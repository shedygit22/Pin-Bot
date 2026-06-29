const { PrismaClient } = require("@prisma/client");
const { createPin, getValidToken } = require("../src/lib/pinterest");
const { sendDailyDigest, sendCalendarExpiryWarning } = require("../src/lib/notifications");

const prisma = new PrismaClient();
const POLL_INTERVAL = 60000;

async function publishDuePins() {
  const duePins = await prisma.scheduledPin.findMany({
    where: {
      status: "pending",
      scheduledAt: { lte: new Date() },
      retryCount: { lt: 4 },
    },
    orderBy: { scheduledAt: "asc" },
    take: 10,
  });

  for (const pin of duePins) {
    try {
      console.log(`[Worker] Publishing pin ${pin.id}: ${pin.generatedTitle}`);
      const token = await getValidToken(pin.userId);
      const result = await createPin(pin.userId, pin.boardId, {
        title: pin.generatedTitle || "",
        description: pin.generatedDescription || "",
        link: pin.blogUrlWithUtm || "",
        imageUrl: pin.imageUrl || "",
        altText: pin.generatedAltText || undefined,
      });

      await prisma.scheduledPin.update({
        where: { id: pin.id },
        data: {
          status: "published",
          publishedAt: new Date(),
          pinterestPinId: result.id,
          pinterestPinUrl: result.link,
        },
      });

      await prisma.jobLog.create({
        data: {
          pinId: pin.id,
          jobType: "publish",
          attemptNumber: pin.retryCount + 1,
          status: "success",
        },
      });

      console.log(`[Worker] Successfully published pin ${pin.id}`);
    } catch (error) {
      console.error(`[Worker] Failed to publish pin ${pin.id}:`, error.message);
      const retryCount = pin.retryCount + 1;
      await prisma.scheduledPin.update({
        where: { id: pin.id },
        data: {
          status: retryCount >= 4 ? "failed" : "pending",
          retryCount,
          lastRetryAt: new Date(),
        },
      });

      await prisma.jobLog.create({
        data: {
          pinId: pin.id,
          jobType: "publish",
          attemptNumber: retryCount,
          status: "failed",
          errorMessage: error.message,
        },
      });

      if (retryCount >= 4) {
        try {
          const sgMail = require("@sendgrid/mail");
          sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");
          const user = await prisma.user.findUnique({ where: { id: pin.userId } });
          if (user?.email) {
            await sgMail.send({
              to: user.email,
              from: process.env.SENDGRID_FROM_EMAIL || "noreply@pinbot.app",
              subject: "⚠️ Pin Failed to Publish",
              html: `<h2>Pin Failed</h2><p>${pin.generatedTitle}</p><p>${error.message}</p>`,
            });
          }
        } catch (emailErr) {
          console.error("[Worker] Failed to send failure email:", emailErr.message);
        }
      }
    }
  }
  return duePins.length;
}

async function refreshExpiringTokens() {
  const expiringSoon = await prisma.pinterestAccount.findMany({
    where: {
      tokenExpiresAt: {
        lte: new Date(Date.now() + 3600000 * 6),
      },
      isActive: true,
    },
  });

  for (const account of expiringSoon) {
    try {
      console.log(`[Worker] Refreshing token for user ${account.userId}`);
      const response = await require("axios").post(
        "https://api.pinterest.com/v5/oauth/token",
        null,
        {
          params: {
            grant_type: "refresh_token",
            refresh_token: account.refreshToken,
            client_id: process.env.PINTEREST_CLIENT_ID,
            client_secret: process.env.PINTEREST_CLIENT_SECRET,
          },
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      );
      await prisma.pinterestAccount.update({
        where: { id: account.id },
        data: {
          accessToken: response.data.access_token,
          tokenExpiresAt: new Date(Date.now() + (response.data.expires_in || 3600000) * 1000),
          lastRefreshedAt: new Date(),
        },
      });
      console.log(`[Worker] Token refreshed for user ${account.userId}`);
    } catch (error) {
      console.error(`[Worker] Token refresh failed for user ${account.userId}:`, error.message);
    }
  }
}

async function checkCalendarExpiry() {
  const calendars = await prisma.contentCalendar.findMany({
    where: { status: "ready" },
    orderBy: { parsedAt: "desc" },
    distinct: ["userId"],
  });

  for (const cal of calendars) {
    if (!cal.parsedAt) continue;
    const daysSinceParsed = Math.floor(
      (Date.now() - cal.parsedAt.getTime()) / 86400000
    );
    const daysLeft = 30 - daysSinceParsed;
    if (daysLeft <= 5 && daysLeft > 0) {
      try {
        const sgMail = require("@sendgrid/mail");
        sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");
        const user = await prisma.user.findUnique({ where: { id: cal.userId } });
        if (user?.email) {
          await sgMail.send({
            to: user.email,
            from: process.env.SENDGRID_FROM_EMAIL || "noreply@pinbot.app",
            subject: `📅 Content Calendar Expires in ${daysLeft} Days`,
            html: `<h2>Calendar Expiring Soon</h2><p>Upload your next calendar to keep automation running.</p>`,
          });
        }
      } catch (err) {
        console.error("[Worker] Calendar expiry email failed:", err.message);
      }
    }
  }
}

let lastDailyDigestDate = "";
let lastWeeklyReportDate = "";

async function runScheduledTasks() {
  const today = new Date().toISOString().split("T")[0];

  if (today !== lastDailyDigestDate) {
    const users = await prisma.user.findMany();
    for (const user of users) {
      try {
        const scheduledCount = await prisma.scheduledPin.count({
          where: { userId: user.id, status: "pending", scheduledAt: { gte: new Date() } },
        });
        if (scheduledCount > 0) {
          const sgMail = require("@sendgrid/mail");
          sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");
          if (user.email) {
            await sgMail.send({
              to: user.email,
              from: process.env.SENDGRID_FROM_EMAIL || "noreply@pinbot.app",
              subject: `Your Pinterest Automation Report - ${today}`,
              html: `<h2>Daily Report</h2><p>You have ${scheduledCount} pins scheduled today.</p>`,
            });
          }
        }
      } catch (err) {
        console.error("[Worker] Daily digest failed:", err.message);
      }
    }
    lastDailyDigestDate = today;
  }
}

async function workerLoop() {
  console.log("[Worker] Starting Pinterest Automation Worker...");
  console.log(`[Worker] Poll interval: ${POLL_INTERVAL}ms`);

  while (true) {
    try {
      const published = await publishDuePins();
      if (published > 0) {
        console.log(`[Worker] Published ${published} pins`);
      }
      await refreshExpiringTokens();
      await checkCalendarExpiry();
      await runScheduledTasks();
    } catch (error) {
      console.error("[Worker] Loop error:", error.message);
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
  }
}

workerLoop().catch(console.error);

process.on("SIGINT", async () => {
  console.log("[Worker] Shutting down...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("[Worker] Shutting down...");
  await prisma.$disconnect();
  process.exit(0);
});

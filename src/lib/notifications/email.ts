import sgMail from "@sendgrid/mail";

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || "";
const SENDER_EMAIL = process.env.SENDER_EMAIL || "noreply@pinbot.app";

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!SENDGRID_API_KEY) {
    console.warn("SendGrid API key not configured. Email not sent:", options.subject);
    return false;
  }

  try {
    await sgMail.send({
      to: options.to,
      from: SENDER_EMAIL,
      subject: options.subject,
      text: options.text || "",
      html: options.html || options.text || "",
    });
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

export function buildDailyDigestEmail(
  userName: string,
  data: {
    publishedYesterday: Array<{ title: string; url: string; impressions?: number }>;
    scheduledToday: Array<{ title: string; time: string }>;
    issues: string[];
    weekStats: { published: number; impressions: number; saves: number };
  }
): { subject: string; html: string } {
  const publishedList = data.publishedYesterday
    .map((p) => `<li>✅ ${p.title} — ${p.impressions ? `📊 ${p.impressions} impressions` : "Published"}</li>`)
    .join("");

  const scheduledList = data.scheduledToday
    .map((s) => `<li>📅 ${s.title} — ${s.time}</li>`)
    .join("");

  const issuesList = data.issues
    .map((i) => `<li>⚠️ ${i}</li>`)
    .join("");

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">📊 Your Pinterest Automation Report</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p>Hi ${userName},</p>
        <p>Here's your daily Pinterest automation summary:</p>

        <h3>✅ Published Yesterday: ${data.publishedYesterday.length} pins</h3>
        <ul>${publishedList || "<li>No pins published yesterday</li>"}</ul>

        <h3>📅 Scheduled Today: ${data.scheduledToday.length} pins</h3>
        <ul>${scheduledList || "<li>No pins scheduled today</li>"}</ul>

        ${data.issues.length ? `<h3>⚠️ Issues</h3><ul>${issuesList}</ul>` : ""}

        <h3>📊 This Week</h3>
        <p>${data.weekStats.published} pins published | ${data.weekStats.impressions} impressions | ${data.weekStats.saves} saves</p>

        <hr style="border: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #666; font-size: 12px;">This is an automated email from your Pinterest Automation system.</p>
      </div>
    </div>
  `;

  return {
    subject: `Your Pinterest Automation Report — ${new Date().toLocaleDateString()}`,
    html,
  };
}

export function buildFailureAlertEmail(
  data: {
    pinTitle: string;
    errorMessage: string;
    attempts: number;
    nextSteps: string;
  }
): { subject: string; html: string } {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #e74c3c; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">⚠️ Pin Failed to Publish</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p><strong>Pin:</strong> ${data.pinTitle}</p>
        <p><strong>Error:</strong> ${data.errorMessage}</p>
        <p><strong>Attempts:</strong> ${data.attempts}</p>
        <p><strong>Recommended Next Steps:</strong></p>
        <p>${data.nextSteps}</p>
      </div>
    </div>
  `;

  return {
    subject: `⚠️ Pin Failed to Publish — Action May Be Required`,
    html,
  };
}

export function buildCalendarWarningEmail(
  userName: string,
  daysRemaining: number
): { subject: string; html: string } {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #f39c12; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">📅 Content Calendar Expiring Soon</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p>Hi ${userName},</p>
        <p>Your Pinterest content calendar will expire in <strong>${daysRemaining} days</strong>.</p>
        <p>To keep your automation running smoothly, please upload your next content calendar now.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/onboarding/upload" 
           style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 15px;">
          Upload Next Calendar
        </a>
      </div>
    </div>
  `;

  return {
    subject: `📅 Your Pinterest Content Calendar Expires in ${daysRemaining} Days`,
    html,
  };
}

export function buildMonthlyReportEmail(
  userName: string,
  month: string,
  data: {
    totalPins: number;
    totalImpressions: number;
    totalSaves: number;
    totalClicks: number;
    topPins: Array<{ title: string; impressions: number; saves: number }>;
    recommendations: string[];
  }
): { subject: string; html: string } {
  const topPinsList = data.topPins
    .map((p, i) => `<li>#${i + 1}: ${p.title} — ${p.impressions} impressions, ${p.saves} saves</li>`)
    .join("");

  const recsList = data.recommendations
    .map((r) => `<li>💡 ${r}</li>`)
    .join("");

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">📊 Your Pinterest Monthly Report</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0;">${month}</p>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p>Hi ${userName},</p>
        <p>Here's your Pinterest performance summary for ${month}:</p>

        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0;">
          <div style="background: white; padding: 15px; border-radius: 8px; text-align: center;">
            <div style="font-size: 28px; font-weight: bold; color: #667eea;">${data.totalPins}</div>
            <div style="color: #666;">Pins Published</div>
          </div>
          <div style="background: white; padding: 15px; border-radius: 8px; text-align: center;">
            <div style="font-size: 28px; font-weight: bold; color: #667eea;">${data.totalImpressions.toLocaleString()}</div>
            <div style="color: #666;">Impressions</div>
          </div>
          <div style="background: white; padding: 15px; border-radius: 8px; text-align: center;">
            <div style="font-size: 28px; font-weight: bold; color: #667eea;">${data.totalSaves.toLocaleString()}</div>
            <div style="color: #666;">Saves</div>
          </div>
          <div style="background: white; padding: 15px; border-radius: 8px; text-align: center;">
            <div style="font-size: 28px; font-weight: bold; color: #667eea;">${data.totalClicks.toLocaleString()}</div>
            <div style="color: #666;">Clicks to Blog</div>
          </div>
        </div>

        <h3>🏆 Top 5 Performing Pins</h3>
        <ol>${topPinsList}</ol>

        <h3>💡 AI-Generated Recommendations</h3>
        <ul>${recsList}</ul>

        <hr style="border: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #666; font-size: 12px;">This is an automated monthly report from your Pinterest Automation system.</p>
      </div>
    </div>
  `;

  return {
    subject: `📊 Your Pinterest Monthly Report — ${month}`,
    html,
  };
}

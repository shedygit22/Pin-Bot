import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateChatResponse } from "@/lib/ai/groq";
import { SYSTEM_PROMPTS } from "@/lib/ai/prompts";
import { generatePinContent } from "@/lib/ai/generator";

const TOOLS = [
  {
    type: "function",
    function: {
      name: "get_scheduled_pins",
      description: "Get scheduled pins for a date range",
      parameters: {
        type: "object",
        properties: {
          startDate: { type: "string", description: "Start date (YYYY-MM-DD)" },
          endDate: { type: "string", description: "End date (YYYY-MM-DD)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "reschedule_pin",
      description: "Reschedule a pin to a new date/time",
      parameters: {
        type: "object",
        properties: {
          pinId: { type: "string" },
          newDatetime: { type: "string", description: "New datetime (ISO format)" },
        },
        required: ["pinId", "newDatetime"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_pin",
      description: "Delete a scheduled pin",
      parameters: {
        type: "object",
        properties: {
          pinId: { type: "string" },
        },
        required: ["pinId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "regenerate_pin_content",
      description: "Regenerate content for a pin",
      parameters: {
        type: "object",
        properties: {
          pinId: { type: "string" },
          element: { type: "string", enum: ["title", "description", "image", "all"] },
        },
        required: ["pinId", "element"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_pin_to_schedule",
      description: "Add a new pin to the schedule",
      parameters: {
        type: "object",
        properties: {
          topic: { type: "string" },
          date: { type: "string" },
          board: { type: "string" },
          blogUrl: { type: "string" },
        },
        required: ["topic", "date", "board", "blogUrl"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_calendar_summary",
      description: "Get a summary of the current content calendar",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_analytics",
      description: "Get Pinterest analytics data",
      parameters: {
        type: "object",
        properties: {
          metric: { type: "string" },
          dateRange: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_queue_status",
      description: "Get the current pin queue status",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_account_settings",
      description: "Get current account settings",
      parameters: { type: "object", properties: {} },
    },
  },
];

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { message, conversationId } = await req.json();
    if (!message) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        brandSettings: true,
        pinterestAccounts: true,
        contentCalendars: { where: { status: "active" }, take: 1 },
      },
    });

    let conversation;
    if (conversationId) {
      conversation = await prisma.chatConversation.findUnique({
        where: { id: conversationId, userId: session.user.id },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });
    }

    if (!conversation) {
      conversation = await prisma.chatConversation.create({
        data: { userId: session.user.id, title: message.substring(0, 50) },
        include: { messages: true },
      });
    }

    await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        userId: session.user.id,
        role: "user",
        content: message,
      },
    });

        const brandSettings = user?.brandSettings;
    const pinterestAccount = user?.pinterestAccounts?.[0];
    const userContext = {
      name: user?.name,
      brandName: brandSettings?.brandName,
      nicheDescription: brandSettings?.nicheDescription,
      brandVoice: brandSettings?.brandVoice,
      pinsPerDay: brandSettings?.defaultPinsPerDay,
      pinterestConnected: !!pinterestAccount,
      boardCount: pinterestAccount?.boardsJson ? JSON.parse(pinterestAccount.boardsJson).length : 0,
      activeCalendar: (user?.contentCalendars?.length || 0) > 0,
    };

    const systemPrompt = `${SYSTEM_PROMPTS.chatSystemPrompt}\n\nCurrent user context: ${JSON.stringify(userContext)}`;

    const aiResponse = await generateChatResponse(
      conversation.messages.map((m) => ({ role: m.role, content: m.content || "" })),
      systemPrompt,
      TOOLS
    );

    if (aiResponse?.tool_calls) {
      for (const toolCall of aiResponse.tool_calls) {
        if (toolCall.type === "function") {
          await executeToolCall(toolCall.function.name, JSON.parse(toolCall.function.arguments), session.user.id);
        }
      }
    }

    const aiContent = aiResponse?.content || "I'm sorry, I couldn't process that request.";

    await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        userId: session.user.id,
        role: "assistant",
        content: aiContent,
        toolCallsJson: JSON.stringify(aiResponse?.tool_calls || []),
        tokensUsed: 0,
      },
    });

    return NextResponse.json({
      message: aiContent,
      conversationId: conversation.id,
      toolCalls: aiResponse?.tool_calls || [],
    });
  } catch (error: any) {
    console.error("Chat API failed:", error);
    return NextResponse.json({ error: error.message || "Chat failed" }, { status: 500 });
  }
}

async function executeToolCall(name: string, args: any, userId: string) {
  switch (name) {
    case "reschedule_pin":
      await prisma.scheduledPin.update({
        where: { id: args.pinId, userId },
        data: { scheduledAt: new Date(args.newDatetime) },
      });
      break;
    case "delete_pin":
      await prisma.scheduledPin.delete({
        where: { id: args.pinId, userId },
      });
      break;
    case "regenerate_pin_content":
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/pins/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinId: args.pinId, element: args.element }),
      });
      if (!response.ok) throw new Error("Regeneration failed");
      break;
    case "add_pin_to_schedule":
      const entry = await prisma.contentEntry.create({
        data: {
          calendarId: "",
          userId,
          targetDate: new Date(args.date),
          topicOrTitle: args.topic,
          blogUrl: args.blogUrl,
          boardName: args.board,
          status: "pending",
        },
      });
      const genResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/pins/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryIds: [entry.id] }),
      });
      if (!genResponse.ok) throw new Error("Pin generation failed");
      break;
  }
}

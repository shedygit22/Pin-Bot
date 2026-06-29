import { z } from "zod";

export const calendarEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  topic_or_title: z.string().min(1, "Topic or title is required"),
  blog_url: z.string().url("Must be a valid URL"),
  board_name: z.string().min(1, "Board name is required"),
  content_category: z.string().optional(),
  extra_notes: z.string().optional(),
  preferred_style: z.string().optional(),
  brand_colors: z.string().optional(),
  pins_per_day: z.coerce.number().min(1).max(5).optional(),
  image_upload_path: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});

export const brandSettingsSchema = z.object({
  brandName: z.string().optional(),
  nicheDescription: z.string().optional(),
  brandVoice: z.enum(["professional", "educational", "motivational", "casual", "creative"]).optional(),
  brandColors: z.array(z.string()).max(5).optional(),
  logoUrl: z.string().optional(),
  fontPreference: z.string().optional(),
  defaultPinsPerDay: z.number().min(3).max(5).optional(),
  autoFillEnabled: z.boolean().optional(),
  blackoutDates: z.array(z.string()).optional(),
});

export const chatRequestSchema = z.object({
  message: z.string().min(1),
  conversationId: z.string().optional(),
});

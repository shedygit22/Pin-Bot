export interface ParsedCalendarEntry {
  date: string;
  topic_or_title: string;
  blog_url: string;
  board_name: string;
  image_upload_path?: string;
  content_category?: string;
  brand_colors?: string;
  pins_per_day?: number;
  extra_notes?: string;
  preferred_style?: string;
}

export interface GeneratedPin {
  title: string;
  description: string;
  keywords: string[];
  hashtags: string[];
  altText: string;
  cta: string;
  imagePrompt: string;
  style: string;
}

export interface PinVariation {
  title: string;
  description: string;
  keywords: string[];
  hashtags: string[];
  altText: string;
  cta: string;
  imagePrompt: string;
  style: string;
  layout: string;
}

export interface ChatToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface AnalyticsData {
  impressions: number;
  saves: number;
  clicks: number;
  closeups: number;
  engagementRate: number;
}

export interface CalendarDay {
  date: string;
  pins: ScheduledPinData[];
  entryCount: number;
}

export interface ScheduledPinData {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  scheduledAt: string;
  status: string;
  boardName: string;
  blogUrl: string;
}

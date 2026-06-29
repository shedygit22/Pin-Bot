import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
  }
}

export interface ParsedEntry {
  date: string;
  topicOrTitle: string;
  blogUrl?: string;
  boardName?: string;
  contentCategory?: string;
  extraNotes?: string;
  preferredStyle?: string;
  brandColorsOverride?: string;
  pinsPerDayOverride?: number;
  userImageUrl?: string;
}

export interface ScheduledPin {
  id: string;
  entryId: string;
  userId: string;
  boardId?: string;
  generatedTitle?: string;
  generatedDescription?: string;
  generatedKeywords?: string;
  generatedHashtags?: string;
  generatedAltText?: string;
  generatedCta?: string;
  imageUrl?: string;
  imageSource: string;
  imagePromptUsed?: string;
  blogUrlWithUtm?: string;
  scheduledAt?: string;
  status: string;
  pinterestPinId?: string;
  pinterestPinUrl?: string;
  retryCount: number;
  publishedAt?: string;
  createdAt: string;
}

export interface ContentEntry {
  id: string;
  calendarId: string;
  userId: string;
  targetDate: string;
  topicOrTitle: string;
  blogUrl?: string;
  boardName?: string;
  boardId?: string;
  contentCategory?: string;
  extraNotes?: string;
  preferredStyle?: string;
  status: string;
  pins?: ScheduledPin[];
}

export interface AnalyticsSummary {
  totalPublished: number;
  totalImpressions: number;
  totalSaves: number;
  totalClicks: number;
  totalCloseups: number;
  engagementRate: string;
}

export interface BrandSettings {
  brandName: string;
  nicheDescription: string;
  brandVoice: string;
  brandColors: string[];
  fontPreference: string;
  defaultPinsPerDay: number;
  textOverlayEnabled: boolean;
  autoFillEnabled: boolean;
  preferredImageService: string;
}

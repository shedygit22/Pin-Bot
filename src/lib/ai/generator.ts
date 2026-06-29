import { generateWithGroq } from "./groq";
import { SYSTEM_PROMPTS } from "./prompts";
import type { GeneratedPin, PinVariation } from "@/types";

export interface ContentInput {
  topicOrTitle: string;
  blogUrl: string;
  contentCategory?: string;
  brandVoice?: string;
  brandColors?: string[];
  extraNotes?: string;
  preferredStyle?: string;
}

export interface GeneratedContent {
  title: string;
  description: string;
  hashtags: string[];
  keywords: string[];
  altText: string;
  cta: string;
  imagePrompt: string;
  style: string;
  allTitles: string[];
}

export async function generatePinContent(input: ContentInput): Promise<GeneratedContent> {
  const category = input.contentCategory || detectCategory(input.topicOrTitle);
  const style = input.preferredStyle || getPreferredStyle(category);

  const titlesJson = await generateWithGroq(
    SYSTEM_PROMPTS.titleGeneration,
    `Topic: "${input.topicOrTitle}"\nContent Category: ${category}\nExtra Notes: ${input.extraNotes || "None"}`,
    "llama-3.1-70b-versatile",
    0.8
  );

  let allTitles: string[] = [];
  try {
    allTitles = JSON.parse(titlesJson);
  } catch {
    allTitles = [input.topicOrTitle];
  }

  const selectedTitle = allTitles[0] || input.topicOrTitle;

  const keywordsJson = await generateWithGroq(
    SYSTEM_PROMPTS.keywordGeneration,
    `Topic: "${input.topicOrTitle}"\nCategory: ${category}`,
    "llama-3.1-70b-versatile",
    0.5
  );

  let keywords: string[] = [];
  try {
    keywords = JSON.parse(keywordsJson);
  } catch {
    keywords = [input.topicOrTitle.toLowerCase()];
  }

  const description = await generateWithGroq(
    SYSTEM_PROMPTS.descriptionGeneration,
    `Pin Title: "${selectedTitle}"\nTopic: "${input.topicOrTitle}"\nBlog URL: ${input.blogUrl}\nKeywords: ${keywords.join(", ")}`,
    "llama-3.1-70b-versatile",
    0.7
  );

  const hashtagsJson = await generateWithGroq(
    SYSTEM_PROMPTS.hashtagGeneration,
    `Topic: "${input.topicOrTitle}"\nCategory: ${category}\nTitle: "${selectedTitle}"`,
    "llama-3.1-70b-versatile",
    0.5
  );

  let hashtags: string[] = [];
  try {
    hashtags = JSON.parse(hashtagsJson);
  } catch {
    hashtags = [`#${category.replace(/\s+/g, "")}`, `#${input.topicOrTitle.replace(/\s+/g, "")}`];
  }

  const altText = await generateWithGroq(
    SYSTEM_PROMPTS.altTextGeneration,
    `Pin Title: "${selectedTitle}"\nCategory: ${category}\nVisual Style: ${style}`,
    "llama-3.1-70b-versatile",
    0.5
  );

  const cta = await generateWithGroq(
    SYSTEM_PROMPTS.ctaGeneration,
    `Topic: "${input.topicOrTitle}"\nBlog URL: ${input.blogUrl}`,
    "llama-3.1-70b-versatile",
    0.7
  );

  const imagePrompt = await generateWithGroq(
    SYSTEM_PROMPTS.imagePromptGeneration,
    `Topic: "${input.topicOrTitle}"\nVisual Style: ${style}\nCategory: ${category}\nBrand Colors: ${(input.brandColors || ["#667eea", "#764ba2"]).join(", ")}`,
    "llama-3.1-70b-versatile",
    0.8
  );

  return {
    title: selectedTitle,
    description: description.substring(0, 500),
    hashtags,
    keywords,
    altText: altText.substring(0, 100),
    cta: cta.substring(0, 60),
    imagePrompt,
    style,
    allTitles,
  };
}

export async function generatePinVariations(
  input: ContentInput,
  count: number = 4
): Promise<PinVariation[]> {
  const category = input.contentCategory || detectCategory(input.topicOrTitle);

  const variationsJson = await generateWithGroq(
    SYSTEM_PROMPTS.multiVariation,
    `Topic: "${input.topicOrTitle}"\nCategory: ${category}\nBrand Voice: ${input.brandVoice || "professional"}\nExtra Notes: ${input.extraNotes || "None"}\nGenerate exactly 4 variations.`,
    "llama-3.1-70b-versatile",
    0.8
  );

  let variations: PinVariation[] = [];
  try {
    variations = JSON.parse(variationsJson);
  } catch {
    variations = [
      { title: `How to ${input.topicOrTitle}`, description: "", keywords: [], hashtags: [], altText: "", cta: "", imagePrompt: "", style: "infographic", layout: "step-by-step" },
      { title: `5 ${input.topicOrTitle} Tips`, description: "", keywords: [], hashtags: [], altText: "", cta: "", imagePrompt: "", style: "list", layout: "list" },
      { title: `The ${input.topicOrTitle} Guide`, description: "", keywords: [], hashtags: [], altText: "", cta: "", imagePrompt: "", style: "guide", layout: "text-card" },
      { title: `${input.topicOrTitle}: What I Learned`, description: "", keywords: [], hashtags: [], altText: "", cta: "", imagePrompt: "", style: "lifestyle", layout: "story" },
    ];
  }

  const results: PinVariation[] = [];
  for (const v of variations) {
    const fullContent = await generatePinContent({
      ...input,
      topicOrTitle: v.title,
      preferredStyle: (v as any).visual_style || input.preferredStyle,
    });
    results.push({
      title: fullContent.title,
      description: fullContent.description,
      keywords: fullContent.keywords,
      hashtags: fullContent.hashtags,
      altText: fullContent.altText,
      cta: fullContent.cta,
      imagePrompt: fullContent.imagePrompt,
      style: fullContent.style,
      layout: v.layout || "standard",
    });
  }

  return results;
}

function detectCategory(topic: string): string {
  const topicLower = topic.toLowerCase();
  const categories: Record<string, RegExp[]> = {
    "Food & Recipes": [/food/, /recipe/, /cook/, /bake/, /dinner/, /breakfast/, /lunch/, /meal/, /kitchen/, /healthy (eating|food|diet)/],
    "Health & Wellness": [/health/, /wellness/, /fitness/, /yoga/, /meditation/, /workout/, /exercise/, /mindful/, /self.care/],
    "Finance & Business": [/budget/, /save money/, /invest/, /finance/, /business/, /entrepreneur/, /money/, /side hustle/, /passive income/],
    "Fashion & Beauty": [/fashion/, /beauty/, /outfit/, /makeup/, /style/, /clothing/, /accessories/, /hair/],
    "Home & DIY": [/home/, /diy/, /decor/, /renovation/, /garden/, /organize/, /craft/, /furniture/],
    "Travel": [/travel/, /vacation/, /trip/, /destination/, /wanderlust/, /adventure/, /road trip/, /backpack/],
    "Parenting": [/parent/, /mom/, /dad/, /baby/, /toddler/, /kid/, /children/, /family/, /mama/],
    "Technology": [/tech/, /app/, /software/, /ai/, /digital/, /coding/, /programming/, /gadget/],
    "Education": [/learn/, /study/, /course/, /education/, /skill/, /knowledge/, /tutorial/, /guide/],
    "Motivational": [/motivat/, /inspire/, /success/, /mindset/, /goal/, /happiness/, /positivity/],
  };

  for (const [category, patterns] of Object.entries(categories)) {
    if (patterns.some((p) => p.test(topicLower))) return category;
  }
  return "General";
}

function getPreferredStyle(category: string): string {
  const styleMap: Record<string, string> = {
    "Food & Recipes": "flat lay, lifestyle",
    "Health & Wellness": "clean lifestyle",
    "Finance & Business": "infographic, text-heavy",
    "Fashion & Beauty": "product showcase",
    "Home & DIY": "step-by-step",
    "Travel": "scenic landscape",
    "Parenting": "warm lifestyle",
    "Technology": "minimal, dark mode",
    "Education": "text card, infographic",
    "Motivational": "quote card",
  };
  return styleMap[category] || "clean, modern";
}

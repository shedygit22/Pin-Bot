import Papa from "papaparse";
import mammoth from "mammoth";
import { generateWithGroq } from "../ai/groq";
import { SYSTEM_PROMPTS } from "../ai/prompts";
import type { ParsedCalendarEntry } from "@/types";

export async function parseCsvFile(
  fileBuffer: Buffer
): Promise<{ entries: ParsedCalendarEntry[]; errors: string[] }> {
  const content = fileBuffer.toString("utf-8");

  return new Promise((resolve, reject) => {
    Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results: any) => {
        const errors: string[] = [];
        const entries: ParsedCalendarEntry[] = [];

        for (let i = 0; i < results.data.length; i++) {
          const row = results.data[i] as any;
          if (!row.date || !row.topic_or_title || !row.blog_url || !row.board_name) {
            errors.push(`Row ${i + 1}: Missing required field(s) - date, topic_or_title, blog_url, and board_name are required`);
            continue;
          }
          entries.push({
            date: row.date,
            topic_or_title: row.topic_or_title,
            blog_url: row.blog_url,
            board_name: row.board_name,
            content_category: row.content_category || undefined,
            brand_colors: row.brand_colors || undefined,
            pins_per_day: row.pins_per_day || undefined,
            extra_notes: row.extra_notes || undefined,
            preferred_style: row.preferred_style || undefined,
            image_upload_path: row.image_upload_path || undefined,
          });
        }

        resolve({ entries, errors });
      },
      error: (error) => reject(error),
    });
  });
}

export async function parseWordDocument(
  fileBuffer: Buffer
): Promise<{ entries: ParsedCalendarEntry[]; errors: string[] }> {
  try {
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    const text = result.value;

    if (text.includes("date") || text.includes("topic") || text.includes("blog_url")) {
      return parseDocumentText(text);
    }

    const aiResult = await generateWithGroq(
      SYSTEM_PROMPTS.wordDocumentParsing,
      `Extract content calendar data from this document:\n\n${text}`,
      "llama-3.1-70b-versatile",
      0.3
    );

    let entries: ParsedCalendarEntry[] = [];
    try {
      entries = JSON.parse(aiResult);
    } catch {
      return { entries: [], errors: ["Failed to parse AI interpretation of document"] };
    }

    return { entries, errors: [] };
  } catch (error: any) {
    return { entries: [], errors: [error.message || "Failed to parse Word document"] };
  }
}

export async function parsePdfDocument(
  fileBuffer: Buffer
): Promise<{ entries: ParsedCalendarEntry[]; errors: string[] }> {
  try {
    const pdfParse = require("pdf-parse");
    const result = await pdfParse(fileBuffer);
    const text = result.text;
    return parseDocumentText(text);
  } catch (error: any) {
    return { entries: [], errors: [error.message || "Failed to parse PDF document"] };
  }
}

export async function parseDocumentText(
  text: string
): Promise<{ entries: ParsedCalendarEntry[]; errors: string[] }> {
  try {
    const aiResult = await generateWithGroq(
      SYSTEM_PROMPTS.wordDocumentParsing,
      `Extract content calendar data from this text:\n\n${text}`,
      "llama-3.1-70b-versatile",
      0.3
    );

    const entries: ParsedCalendarEntry[] = JSON.parse(aiResult);
    return { entries, errors: [] };
  } catch (error: any) {
    return { entries: [], errors: [error.message || "Failed to parse document text"] };
  }
}

export async function validateEntries(
  entries: ParsedCalendarEntry[]
): Promise<{ valid: boolean; issues: Array<{ entry_index: number; field: string; issue_type: string; message: string }>; suggestedFixes: string[] }> {
  const issues: Array<{ entry_index: number; field: string; issue_type: string; message: string }> = [];
  const suggestedFixes: string[] = [];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    if (!entry.date || isNaN(Date.parse(entry.date))) {
      issues.push({ entry_index: i, field: "date", issue_type: "invalid_date", message: "Invalid or missing date" });
    } else if (new Date(entry.date) < new Date()) {
      issues.push({ entry_index: i, field: "date", issue_type: "past_date", message: "Date is in the past" });
    }

    if (!entry.blog_url) {
      issues.push({ entry_index: i, field: "blog_url", issue_type: "missing_url", message: "Blog URL is required" });
    }
  }

  const urlPattern = /^https?:\/\/.+/;
  for (let i = 0; i < entries.length; i++) {
    if (entries[i].blog_url && !urlPattern.test(entries[i].blog_url)) {
      issues.push({ entry_index: i, field: "blog_url", issue_type: "invalid_url", message: "URL is not valid (must start with http:// or https://)" });
    }
  }

  if (issues.length > 0) {
    suggestedFixes.push("Fix the issues above before proceeding with content generation");
  }

  return { valid: issues.length === 0, issues, suggestedFixes };
}

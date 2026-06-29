import { generateWithPollinations } from "./pollinations";
import { generateWithHuggingFace } from "./huggingface";
import { generateWithCraiyon } from "./craiyon";
import { processImage, createTextCard, addTextOverlay } from "./sharp";

interface GenerateImageOptions {
  prompt: string;
  title?: string;
  brandColors?: string[];
  userImageUrl?: string;
}

export async function generatePinImage(
  options: GenerateImageOptions
): Promise<{ buffer: Buffer; source: string }> {
  const { prompt, title, brandColors, userImageUrl } = options;

  if (userImageUrl) {
    try {
      const response = await fetch(userImageUrl);
      const buffer = Buffer.from(await response.arrayBuffer());
      const processed = await processImage(buffer, { title, brandColors });
      return { buffer: processed, source: "user_upload" };
    } catch {
      console.warn("User image fetch failed, falling through to AI generation");
    }
  }

  const pollinationsResult = await generateWithPollinations(prompt);
  if (pollinationsResult) {
    const processed = await processImage(pollinationsResult, { title, brandColors });
    if (title) {
      const withText = await addTextOverlay(processed, title);
      return { buffer: withText, source: "pollinations" };
    }
    return { buffer: processed, source: "pollinations" };
  }

  const hfResult = await generateWithHuggingFace(prompt);
  if (hfResult) {
    const processed = await processImage(hfResult, { title, brandColors });
    if (title) {
      const withText = await addTextOverlay(processed, title);
      return { buffer: withText, source: "huggingface" };
    }
    return { buffer: processed, source: "huggingface" };
  }

  const craiyonResult = await generateWithCraiyon(prompt);
  if (craiyonResult) {
    const processed = await processImage(craiyonResult, { title, brandColors });
    if (title) {
      const withText = await addTextOverlay(processed, title);
      return { buffer: withText, source: "craiyon" };
    }
    return { buffer: processed, source: "craiyon" };
  }

  const textCard = await createTextCard(title || "New Pin", {
    brandColors,
    subtitle: "Click to learn more",
  });
  return { buffer: textCard, source: "text_card" };
}

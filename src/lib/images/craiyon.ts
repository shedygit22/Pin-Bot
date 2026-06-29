import axios from "axios";

export async function generateWithCraiyon(prompt: string): Promise<Buffer | null> {
  try {
    const response = await axios.post(
      "https://api.craiyon.com/v3",
      { prompt, negative_prompt: "nsfw, low quality, blurry", style: "art" },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 60000,
      }
    );

    if (response.data?.images?.[0]) {
      const imageData = response.data.images[0];
      const buffer = Buffer.from(imageData, "base64");
      return buffer;
    }
    return null;
  } catch (error) {
    console.warn("Craiyon generation failed:", error);
    return null;
  }
}

import axios from "axios";

const POLLINATIONS_BASE = "https://image.pollinations.ai/prompt";

interface PollinationsOptions {
  width?: number;
  height?: number;
  model?: string;
  nologo?: boolean;
}

export async function generateWithPollinations(
  prompt: string,
  options: PollinationsOptions = {}
): Promise<Buffer | null> {
  try {
    const {
      width = 1000,
      height = 1500,
      model = "flux",
      nologo = true,
    } = options;

    const encodedPrompt = encodeURIComponent(prompt);
    const url = `${POLLINATIONS_BASE}/${encodedPrompt}?width=${width}&height=${height}&model=${model}&nologo=${nologo}`;

    const response = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 30000,
    });

    if (response.status === 200) {
      return Buffer.from(response.data);
    }
    return null;
  } catch (error) {
    console.warn("Pollinations.ai generation failed:", error);
    return null;
  }
}

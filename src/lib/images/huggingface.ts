import axios from "axios";

const HF_API_BASE = "https://api-inference.huggingface.co/models";
const HF_TOKEN = process.env.HUGGINGFACE_API_KEY || "";

const MODELS = [
  "stabilityai/stable-diffusion-xl-base-1.0",
  "runwayml/stable-diffusion-v1-5",
  "prompthero/openjourney",
];

export async function generateWithHuggingFace(
  prompt: string,
  modelIndex: number = 0
): Promise<Buffer | null> {
  if (!HF_TOKEN) return null;

  for (let i = modelIndex; i < MODELS.length; i++) {
    try {
      const response = await axios.post(
        `${HF_API_BASE}/${MODELS[i]}`,
        { inputs: prompt },
        {
          headers: {
            Authorization: `Bearer ${HF_TOKEN}`,
            "Content-Type": "application/json",
          },
          responseType: "arraybuffer",
          timeout: 60000,
        }
      );

      if (response.status === 200) {
        return Buffer.from(response.data);
      }
    } catch (error: any) {
      if (error?.response?.status === 503) {
        console.warn(`HF model ${MODELS[i]} is loading, trying next...`);
        continue;
      }
      console.warn(`HF model ${MODELS[i]} failed:`, error?.message);
      continue;
    }
  }
  return null;
}

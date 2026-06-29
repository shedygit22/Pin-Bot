import sharp from "sharp";

const PIN_WIDTH = 1000;
const PIN_HEIGHT = 1500;

export async function processImage(
  imageBuffer: Buffer,
  options: {
    title?: string;
    brandColors?: string[];
    watermarkUrl?: string;
    font?: string;
  } = {}
): Promise<Buffer> {
  let image = sharp(imageBuffer);

  const metadata = await image.metadata();

  if (metadata.width !== PIN_WIDTH || metadata.height !== PIN_HEIGHT) {
    image = image.resize(PIN_WIDTH, PIN_HEIGHT, {
      fit: "cover",
      position: "center",
    });
  }

  const compressed = await image.jpeg({ quality: 85, mozjpeg: true }).toBuffer();
  return compressed;
}

export async function createTextCard(
  title: string,
  options: {
    brandColors?: string[];
    subtitle?: string;
    font?: string;
  } = {}
): Promise<Buffer> {
  const colors = options.brandColors?.length
    ? options.brandColors
    : ["#667eea", "#764ba2"];

  const gradient = `linear-gradient(135deg, ${colors[0]}, ${colors[colors.length - 1]})`;

  const svgText = `
    <svg width="${PIN_WIDTH}" height="${PIN_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colors[0]}" />
          <stop offset="100%" style="stop-color:${colors[colors.length - 1]}" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>
      <text x="50%" y="45%" text-anchor="middle" dominant-baseline="middle"
            font-family="${options.font || "Arial, sans-serif"}" font-size="48"
            font-weight="bold" fill="white" text-anchor="middle">
        ${wrapText(title, 20).map((line, i) =>
          `<tspan x="500" dy="${i === 0 ? "0" : "60"}">${escapeXml(line)}</tspan>`
        ).join("")}
      </text>
      ${options.subtitle ? `
        <text x="50%" y="65%" text-anchor="middle" dominant-baseline="middle"
              font-family="Arial, sans-serif" font-size="28" fill="rgba(255,255,255,0.8)">
          ${escapeXml(options.subtitle)}
        </text>
      ` : ""}
    </svg>
  `;

  return sharp(Buffer.from(svgText))
    .resize(PIN_WIDTH, PIN_HEIGHT)
    .jpeg({ quality: 90 })
    .toBuffer();
}

export async function addTextOverlay(
  imageBuffer: Buffer,
  text: string,
  position: "top" | "bottom" | "center" = "bottom"
): Promise<Buffer> {
  const lines = wrapText(text, 25);
  const lineHeight = 60;
  const fontSize = Math.min(56, Math.max(32, Math.floor(800 / text.length)));

  let yPos: number;
  switch (position) {
    case "top": yPos = 150; break;
    case "center": yPos = 750; break;
    case "bottom": yPos = 1200; break;
  }

  const svgOverlay = `
    <svg width="${PIN_WIDTH}" height="${PIN_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="${yPos - 40}" width="1000" height="${lines.length * lineHeight + 80}" fill="rgba(0,0,0,0.5)" rx="10"/>
      <text x="500" y="${yPos + 10}" text-anchor="middle"
            font-family="Arial, sans-serif" font-size="${fontSize}"
            font-weight="bold" fill="white">
        ${lines.map((line, i) =>
          `<tspan x="500" dy="${i === 0 ? "0" : lineHeight}">${escapeXml(line)}</tspan>`
        ).join("")}
      </text>
    </svg>
  `;

  return sharp(imageBuffer)
    .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
    .jpeg({ quality: 85 })
    .toBuffer();
}

function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + " " + word).trim().length <= maxCharsPerLine) {
      currentLine += (currentLine ? " " : "") + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

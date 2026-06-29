const fs = require("fs");
const path = require("path");

const files = [
  "src/app/dashboard/page.tsx",
  "src/app/calendar/page.tsx",
  "src/app/calendar/upload/page.tsx",
  "src/app/analytics/page.tsx",
  "src/app/settings/page.tsx",
  "src/app/library/page.tsx",
  "src/app/login/page.tsx",
  "src/app/onboarding/page.tsx",
  "src/app/onboarding/upload/page.tsx",
  "src/app/content-library/page.tsx",
];

for (const f of files) {
  const fp = path.join(process.cwd(), f);
  if (!fs.existsSync(fp)) {
    console.log("Skipping (not found):", f);
    continue;
  }
  let content = fs.readFileSync(fp, "utf8");

  // Remove literal backtick-r-backtick-n
  content = content.replace(/`r`n/g, "\n");

  // Remove BOM
  content = content.replace(/^\uFEFF/, "");

  // Split into lines and rebuild
  const lines = content.split(/\r?\n/);

  // Find all "use client" lines and dynamic lines
  const hasUseClient = lines.some((l) => l.trim() === '"use client";');
  const hasDynamic = lines.some((l) => l.trim().startsWith('export const dynamic'));

  // Remove all "use client" lines and all dynamic lines
  const cleaned = lines.filter((l) => {
    const t = l.trim();
    return t !== '"use client";' && !t.startsWith("export const dynamic");
  });

  // Build final content
  let result = "";
  if (hasUseClient) {
    result += '"use client";\n';
  }
  if (hasDynamic) {
    result += 'export const dynamic = "force-dynamic";\n';
  }
  // Add a blank line if we added directives
  if (hasUseClient || hasDynamic) {
    result += "\n";
  }
  result += cleaned.join("\n");

  // Clean up multiple blank lines
  result = result.replace(/\n{3,}/g, "\n\n");

  fs.writeFileSync(fp, result, "utf8");
  console.log("Fixed:", f);
}

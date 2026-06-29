const fs = require("fs");
const path = require("path");

const files = [
  "src/app/dashboard/page.tsx",
  "src/app/calendar/page.tsx",
  "src/app/analytics/page.tsx",
  "src/app/settings/page.tsx",
  "src/app/library/page.tsx",
  "src/app/login/page.tsx",
  "src/app/onboarding/page.tsx",
];

for (const f of files) {
  const fp = path.join(process.cwd(), f);
  let content = fs.readFileSync(fp, "utf8");
  content = content.replace(/`r`n/g, "\n");
  if (!content.includes('force-dynamic')) {
    content = content.replace('"use client";\n', '"use client";\nexport const dynamic = "force-dynamic";\n\n');
  }
  content = content.replace(/\n{4,}/g, "\n\n\n");
  fs.writeFileSync(fp, content, "utf8");
  console.log("Verified:", f);
}

const fs = require("fs");
const path = require("path");

const files = [
  "src/app/calendar/upload/page.tsx",
  "src/app/onboarding/upload/page.tsx",
  "src/app/content-library/page.tsx",
];

for (const f of files) {
  const fp = path.join(process.cwd(), f);
  if (!fs.existsSync(fp)) continue;
  let content = fs.readFileSync(fp, "utf8");
  content = content.replace(/`r`n/g, "\n");
  content = content.replace(/﻿/g, "");
  content = content.replace(/"use client";\s*"use client";/g, '"use client";');
  if (!content.includes('"use client";')) {
    content = '"use client";\n' + content;
  }
  if (!content.includes("force-dynamic")) {
    content = content.replace('"use client";\n', '"use client";\nexport const dynamic = "force-dynamic";\n\n');
  }
  content = content.replace(/\n{4,}/g, "\n\n\n");
  fs.writeFileSync(fp, content, "utf8");
  console.log("Fixed:", f);
}

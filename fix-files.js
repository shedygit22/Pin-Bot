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
  if (fs.existsSync(fp)) {
    let content = fs.readFileSync(fp, "utf8");
    content = content.replace("`r`n", "\n");
    if (content.includes('"use client";')) {
      content = content.replace('"use client";\n', "");
      content = '"use client";\n' + content;
    }
    const lines = content.split("\n");
    let foundClient = false;
    const filtered = lines.filter((l) => {
      if (l.trim() === '"use client";') {
        if (foundClient) return false;
        foundClient = true;
      }
      return true;
    });
    content = filtered.join("\n");
    content = content.replace(/\n{3,}/g, "\n\n");
    fs.writeFileSync(fp, content, "utf8");
    console.log("Fixed:", f);
  }
}

import Firecrawl from "@mendable/firecrawl-js";
import fs from "node:fs";

const firecrawl = new Firecrawl({
  apiKey: "fc-4c2fbb2b083a47b29e4d59f8690cc130",
});

const scrapeResponse = await firecrawl.scrape(
  "https://app.ptrainer.com.br/painel/perfis",
  {
    formats: ["markdown", "html"],
    headers: {
      Cookie:
        "remember_web_59ba36addc2b2f9401580f014c7f58ea4e30989d=eyJpdiI6IlBSM1wvMG1SWG5xUFB3Rlwvb3cwWHdnZz09IiwidmFsdWUiOiJnRmVzcGV6WXVldVRtMzM4bEJOdHdiYkNMQlVvWGRYNGM4WU1hVEJIU3VEejhlK1RZV0cxVmxFWWdHNnQwRjhCWjNwZHpwdFZleHhaTW9XeEJPOVM4SStuT1oxWVB2dzdtbGVDaTczRldxNHNJYXJuK1lUR2JJbW1yZld2WVM0YlpxeGV6ZHpja0JnZlE0Q0VaMHBsdDVOdjZ1RmtLRXg0OHg2SkhIVUk4bFk9IiwibWFjIjoiYWVjZjhiZDk3MTZjZjJmOWM0NjhhNjUwN2U5OTYzMjM3MjI3MjU1NDAwMWVlZDIyZmQzNmY5YTI5MTRlMTEwYSJ9; XSRF-TOKEN=eyJpdiI6IkNUb1FHSXM3S3RIN01nbUpwNHc1ZGc9PSIsInZhbHVlIjoibmp3a1VnOWRZa1NYYnlSaktzbU5rMlVHUWhUdGlLSTFKWnVva1NldGRCQThPejRuaE5aYVwvMU9rRnM5cUQ0TXYiLCJtYWMiOiJjMTRlNjFlM2I1OTYzMWM3ODhlYjFiYjE4ZWY2YWJjMDQzNzk2ODRhMzc3NzNmMWFmZTcyYTkyMmEzMzFkODdjIn0%3D; ptrainer_session=eyJpdiI6IlVnVFEySk5VWlVqaHNtc21yZ2t6RHc9PSIsInZhbHVlIjoiWmcxc3FCN2F1OFd6cDBTXC9UWWp5Y2hRc2kyWlhEQm5WQVBkTWVYRHdqUjJmYzJGMlVlalcyeTEwTzMxdnhZT3UiLCJtYWMiOiJjM2JlNGIzMTJiY2M0MDllYjIyZjQ3MDUxYjliNGU1Zjk1ZWU0ZWNjZmJjN2Q2OGUyMGZlZWEzOTMwYTQxNzhjIn0%3D",
    },
  },
);

fs.writeFileSync("scrapeResponse.html", scrapeResponse.html);
fs.writeFileSync("scrapeResponse.md", scrapeResponse.markdown);
fs.writeFileSync(
  "metadata.json",
  JSON.stringify(scrapeResponse.metadata, null, 2),
);
console.log(scrapeResponse);

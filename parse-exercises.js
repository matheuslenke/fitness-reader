/**
 * Parses site.html and extracts exercise data into exercises.json
 * Run: node parse-exercises.js
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const htmlPath = join(__dirname, "site.html");
const outPath = join(__dirname, "exercises.json");

const html = readFileSync(htmlPath, "utf-8");

// Find the tbody with lista-exercicios
const tbodyMatch = html.match(
  /<tbody id="lista-exercicios">([\s\S]*?)<\/tbody>/,
);
if (!tbodyMatch) {
  throw new Error("Could not find #lista-exercicios tbody");
}

const tbody = tbodyMatch[1];
const rows = tbody.split(/<tr>/).filter(Boolean);

const groups = [];
let currentGroup = null;

for (const row of rows) {
  // Group header: <td ... colspan="4">Grupo X </td>
  const groupMatch = row.match(/colspan="4"[^>]*>Grupo\s+([A-E])\s*<\/td>/i);
  if (groupMatch) {
    currentGroup = groupMatch[1].toUpperCase();
    groups.push({ group: currentGroup, exercises: [] });
    continue;
  }

  if (!currentGroup) continue;

  // Exercise row: 4 <td>s — name+video, series, reps, input
  const tdMatch = row.match(
    /<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/,
  );
  if (!tdMatch) continue;

  const [, nameCell, seriesCell, repsCell, inputCell] = tdMatch;

  // Video URL from data-src
  const videoMatch = nameCell.match(/data-src="([^"]+)"/);
  const videoUrl = videoMatch ? videoMatch[1].trim() : "";

  // Exercise name: strip tags and trim
  const nameRaw = nameCell
    .replace(/<i[\s\S]*?<\/i>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const name = nameRaw || null;
  if (!name) continue;

  // Series and reps: strip tags and trim
  const series =
    seriesCell
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim() || "";
  const reps =
    repsCell
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim() || "";

  // Exercise ID from name="carga[ID]"
  const idMatch = inputCell.match(/name="carga\[(\d+)\]"/);
  const id = idMatch ? idMatch[1] : null;
  if (!id) continue;

  groups[groups.length - 1].exercises.push({
    id,
    name,
    videoUrl,
    sets: series,
    reps,
    group: currentGroup,
  });
}

// Flatten to { groups: [{ group, exercises }], exercises: [...] } for app convenience
const exercises = groups.flatMap((g) => g.exercises.map((e) => ({ ...e })));

const output = {
  groups: groups.map((g) => ({ group: g.group, exercises: g.exercises })),
  exercises,
};

writeFileSync(outPath, JSON.stringify(output, null, 2), "utf-8");
console.log(`Wrote ${output.exercises.length} exercises to ${outPath}`);
console.log(
  "Groups:",
  output.groups.map((g) => `${g.group} (${g.exercises.length})`).join(", "),
);

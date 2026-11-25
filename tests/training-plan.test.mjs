import assert from "node:assert/strict";
import { after, test } from "node:test";
import { createServer } from "vite";

const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
});
after(() => server.close());

const storage = await server.ssrLoadModule("/src/lib/storage.ts");
const { getEmbedUrl, getSuggestedRepetitionCount } = await server.ssrLoadModule(
  "/src/lib/utils.ts",
);
const CYCLE_ID = "consultoria-ia-cycle-3-week-1";

test("the new cycle appears once in existing saved libraries without changing user plans or history", () => {
  const original = storage.buildDefaultSnapshot();
  const customTemplate = {
    ...original.templateLibrary.templates[0],
    name: "Meu plano personalizado",
  };
  const saved = {
    ...original,
    templateLibrary: { templates: [customTemplate] },
    series: [{
      id: "existing-series",
      name: "Ciclo anterior",
      startDate: "2026-10-01",
      endDate: "2026-11-22",
      status: "completed",
      exerciseWeights: { previous: [{ date: "2026-11-20", weight: 35 }] },
    }],
    sessions: [{
      id: "existing-session",
      seriesId: "existing-series",
      group: "A",
      status: "finished",
      startedAt: "2026-11-20T12:00:00Z",
      finishedAt: "2026-11-20T13:00:00Z",
      exercises: [{ exerciseId: "previous", weight: 35, status: "completed" }],
    }],
  };
  const before = structuredClone(saved);
  const normalized = storage.ensureAppSnapshot(saved);

  assert.deepEqual(saved, before);
  assert.deepEqual(normalized.series, saved.series);
  assert.deepEqual(normalized.sessions, saved.sessions);
  assert.equal(normalized.templateLibrary.templates[0].name, customTemplate.name);
  assert.equal(normalized.templateLibrary.templates.filter(({ id }) => id === CYCLE_ID).length, 1);
  assert.deepEqual(storage.ensureAppSnapshot(normalized), normalized);
});

test("cycle 3 creates independent A-D workouts with the prescribed repetition progression", () => {
  const initial = storage.buildDefaultSnapshot();
  const template = storage.getTemplateById(initial.templateLibrary, CYCLE_ID);
  assert.ok(template);
  assert.equal(template.createdAt, "2026-11-23");
  assert.deepEqual(template.groups.map(({ group }) => group), ["A", "B", "C", "D"]);
  assert.equal(new Set(template.groups.flatMap(({ exercises }) => exercises.map(({ id }) => id))).size, 32);

  const withSeries = storage.createSeries(initial, { templateId: CYCLE_ID });
  const series = withSeries.series[0];
  for (const group of template.groups) {
    assert.equal(group.exercises.length, 8);
    assert.equal(group.preparation.movements.length, 3);
    const snapshot = storage.createSession(withSeries, series.id, group.group);
    const session = snapshot.sessions[0];
    assert.equal(session.exercises.length, 8);
    assert.deepEqual(session.exercises.map(({ exerciseId }) => exerciseId), group.exercises.map(({ id }) => id));

    group.exercises.forEach((exercise, index) => {
      const expectedRepetitions = exercise.reps === "Até a Falha"
        ? [0, 0, 0, 0]
        : exercise.reps === "15-20"
          ? [15, 15, 15, 15]
          : [15, 12, 8, 6];
      assert.deepEqual(session.exercises[index].setProgress.map(({ repetitions }) => repetitions), expectedRepetitions);
      assert.notEqual(series.exercisesByGroup[group.group][index], exercise);
    });
  }
  assert.equal(template.groups[3].preparation.guidance.length, 3);
  assert.equal(template.groups[0].exercises[3].videoUrl, "");
  assert.equal(template.groups[1].exercises[7].cadence, null);
});

test("repetition suggestions support pyramid, range, and failure prescriptions", () => {
  assert.deepEqual([0, 1, 2, 3].map((index) => getSuggestedRepetitionCount("15, 12, 8, 6", index)), [15, 12, 8, 6]);
  assert.equal(getSuggestedRepetitionCount("15-20", 3), 15);
  assert.equal(getSuggestedRepetitionCount("Até a Falha", 2), 0);
  assert.equal(getSuggestedRepetitionCount("8-10 (cada perna)"), 8);
  assert.equal(getSuggestedRepetitionCount("12, 8", 3), 8);
});

test("provided embed links work in the modal and ambient player while missing links stay unavailable", () => {
  const embed = "https://www.youtube.com/embed/SapM-j_3M20";
  assert.equal(getEmbedUrl(embed), embed);
  assert.equal(getEmbedUrl("https://youtu.be/SapM-j_3M20"), embed);
  assert.equal(getEmbedUrl("https://www.youtube.com/watch?v=SapM-j_3M20"), embed);
  const ambient = new URL(getEmbedUrl(embed, { background: true }));
  assert.equal(ambient.searchParams.get("playlist"), "SapM-j_3M20");
  assert.equal(ambient.searchParams.get("mute"), "1");
  assert.equal(getEmbedUrl(null), "");
  assert.equal(getEmbedUrl(""), "");
});

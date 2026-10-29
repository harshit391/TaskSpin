import { describe, expect, it } from "vitest";
import { buildListEntries } from "@/lib/taskEntries";
import { Task } from "@/types/task";

const roadmap = { id: "r1", title: "Launch", color: "#4ECDC4", createdAt: "", updatedAt: "" };

function task(id: string, extra: Partial<Task> = {}): Task {
  return {
    id,
    title: id,
    notes: null,
    completed: false,
    createdAt: "",
    updatedAt: "",
    projectId: null,
    recurrenceType: null,
    recurrenceDays: null,
    recurrenceWeekdays: null,
    recurrenceStartDate: null,
    hiddenUntil: null,
    plannedDate: null,
    roadmapId: null,
    roadmapPosition: null,
    ...extra,
  };
}

const step = (id: string, pos: number, extra: Partial<Task> = {}) =>
  task(id, { roadmapId: "r1", roadmap, roadmapPosition: pos, ...extra });

const shape = (entries: ReturnType<typeof buildListEntries>) =>
  entries.map((e) => (e.kind === "task" ? e.task.id : `[${e.steps.map((s) => s.id).join(",")}]`));

describe("buildListEntries", () => {
  it("leaves lists without roadmaps unchanged", () => {
    expect(shape(buildListEntries([task("a"), task("b")]))).toEqual(["a", "b"]);
  });

  it("collapses a roadmap into one stack ordered by position", () => {
    const list = [task("a"), step("s3", 2), step("s1", 0), task("b"), step("s2", 1)];
    // s1 (the next step) sits before b, so the stack does too
    expect(shape(buildListEntries(list))).toEqual(["a", "[s1,s2,s3]", "b"]);
  });

  it("places the stack where its next step appears in the list", () => {
    const list = [step("s1", 0), task("a"), step("s2", 1)];
    expect(shape(buildListEntries(list))).toEqual(["[s1,s2]", "a"]);
  });

  it("renders a single remaining step as a normal row", () => {
    expect(shape(buildListEntries([task("a"), step("s1", 0)]))).toEqual(["a", "s1"]);
  });

  it("keeps completed roadmap tasks out of the stack", () => {
    const list = [step("s1", 0), step("s2", 1), step("done", 2, { completed: true })];
    expect(shape(buildListEntries(list))).toEqual(["[s1,s2]", "done"]);
  });

  it("stacks multiple roadmaps independently", () => {
    const other = { ...roadmap, id: "r2", title: "Other" };
    const list = [
      step("a1", 0),
      task("x2", { roadmapId: "r2", roadmap: other, roadmapPosition: 1 }),
      step("a2", 1),
      task("x1", { roadmapId: "r2", roadmap: other, roadmapPosition: 0 }),
    ];
    expect(shape(buildListEntries(list))).toEqual(["[a1,a2]", "[x1,x2]"]);
  });
});

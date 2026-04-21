import { test } from "node:test";
import assert from "node:assert/strict";
import { computeSmartScore } from "./smartScore.js";

test("higher priority and closer due date score higher", () => {
  const now = new Date("2026-04-21T10:00:00.000Z");
  const highUrgent = computeSmartScore(
    { priority: "high", effort: "medium", dueDate: "2026-04-21T12:00:00.000Z" },
    now,
  );
  const lowLater = computeSmartScore({ priority: "low", effort: "medium", dueDate: "2026-04-28T12:00:00.000Z" }, now);
  assert.ok(highUrgent > lowLater);
});

test("low effort receives a higher smart score than high effort", () => {
  const now = new Date("2026-04-21T10:00:00.000Z");
  const lowEffort = computeSmartScore({ priority: "medium", effort: "low", dueDate: null }, now);
  const highEffort = computeSmartScore({ priority: "medium", effort: "high", dueDate: null }, now);
  assert.ok(lowEffort > highEffort);
});

test("overdue tasks outrank future tasks with same priority and effort", () => {
  const now = new Date("2026-04-21T10:00:00.000Z");
  const overdue = computeSmartScore(
    { priority: "medium", effort: "medium", dueDate: "2026-04-20T10:00:00.000Z" },
    now,
  );
  const future = computeSmartScore(
    { priority: "medium", effort: "medium", dueDate: "2026-04-25T10:00:00.000Z" },
    now,
  );
  assert.ok(overdue > future);
});


import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../app.js";
import { migrateUp } from "../db/migrate.js";

const JWT_SECRET = "test_secret_for_task_routes_123";
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "smart-todo-tests-"));
process.env.DB_PATH = path.join(tempDir, "test.db");

const app = createApp({ jwtSecret: JWT_SECRET });

let token = "";
let secondToken = "";
let createdTaskId = "";

before(() => {
  migrateUp();
});

after(() => {
  fs.rmSync(tempDir, { recursive: true, force: true });
});

test("unauthorized access to tasks is rejected", async () => {
  const res = await request(app).get("/tasks");
  assert.equal(res.status, 401);
  assert.equal(res.body.error.code, "UNAUTHORIZED");
});

test("unauthorized access to tasks/today is rejected", async () => {
  const res = await request(app).get("/tasks/today");
  assert.equal(res.status, 401);
  assert.equal(res.body.error.code, "UNAUTHORIZED");
});

test("signup and login succeed", async () => {
  const signupRes = await request(app).post("/auth/signup").send({
    email: "tasks.user@example.com",
    password: "password123",
    displayName: "Tasks User",
  });
  assert.equal(signupRes.status, 201);

  const loginRes = await request(app).post("/auth/login").send({
    email: "tasks.user@example.com",
    password: "password123",
  });
  assert.equal(loginRes.status, 200);
  assert.equal(typeof loginRes.body.token, "string");
  token = loginRes.body.token;
});

test("POST /tasks creates a task", async () => {
  const res = await request(app)
    .post("/tasks")
    .set("Authorization", `Bearer ${token}`)
    .send({ title: "Task A", status: "todo", priority: "high", effort: "low" });

  assert.equal(res.status, 201);
  assert.equal(res.body.task.title, "Task A");
  assert.equal(res.body.task.status, "todo");
  assert.equal(res.body.task.priority, "high");
  assert.equal(res.body.task.effort, "low");
  createdTaskId = res.body.task.id;
});

test("second user cannot access another user's task", async () => {
  await request(app).post("/auth/signup").send({
    email: "other.user@example.com",
    password: "password123",
    displayName: "Other User",
  });
  const loginRes = await request(app).post("/auth/login").send({
    email: "other.user@example.com",
    password: "password123",
  });
  secondToken = loginRes.body.token as string;

  const patchRes = await request(app)
    .patch(`/tasks/${createdTaskId}`)
    .set("Authorization", `Bearer ${secondToken}`)
    .send({ title: "Hacked title" });

  assert.equal(patchRes.status, 404);
  assert.equal(patchRes.body.error.code, "NOT_FOUND");
});

test("GET /tasks returns current user's tasks", async () => {
  const res = await request(app).get("/tasks").set("Authorization", `Bearer ${token}`);
  assert.equal(res.status, 200);
  assert.equal(Array.isArray(res.body.tasks), true);
  assert.ok(res.body.tasks.length >= 1);
});

test("GET /tasks/today excludes done tasks", async () => {
  await request(app).post("/tasks").set("Authorization", `Bearer ${token}`).send({
    title: "Done Task",
    status: "done",
    priority: "high",
    effort: "low",
  });

  const res = await request(app).get("/tasks/today").set("Authorization", `Bearer ${token}`);
  assert.equal(res.status, 200);
  assert.equal(Array.isArray(res.body.tasks), true);
  assert.equal(
    (res.body.tasks as Array<{ status: string }>).some((task) => task.status === "done"),
    false,
  );
});

test("PATCH /tasks/:id updates fields", async () => {
  const res = await request(app)
    .patch(`/tasks/${createdTaskId}`)
    .set("Authorization", `Bearer ${token}`)
    .send({ status: "done", priority: "medium" });

  assert.equal(res.status, 200);
  assert.equal(res.body.task.status, "done");
  assert.equal(res.body.task.priority, "medium");
});

test("DELETE /tasks/:id deletes the task", async () => {
  const deleteRes = await request(app).delete(`/tasks/${createdTaskId}`).set("Authorization", `Bearer ${token}`);
  assert.equal(deleteRes.status, 204);

  const listRes = await request(app).get("/tasks").set("Authorization", `Bearer ${token}`);
  assert.equal(listRes.status, 200);
  const ids = (listRes.body.tasks as Array<{ id: string }>).map((task) => task.id);
  assert.equal(ids.includes(createdTaskId), false);
});


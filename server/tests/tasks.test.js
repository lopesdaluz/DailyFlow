const test = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const path = require("node:path");

async function waitForServer(url, timeoutMs = 10000) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (
        res.ok ||
        res.status === 404 ||
        res.status === 401 ||
        res.status === 400
      ) {
        return;
      }
    } catch (error) {
      // server still starting
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  throw new Error(`Server did not start on ${url}`);
}

test("creating a task returns 201 with a task payload", async () => {
  const server = spawn("node", ["server.js"], {
    cwd: path.join(__dirname, ".."),
    env: {
      ...process.env,
      PORT: "5010",
      JWT_SECRET: "test-secret",
    },
    stdio: "inherit",
  });

  try {
    await waitForServer("http://localhost:5010/api/health");

    const res = await fetch("http://localhost:5010/api/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
      body: JSON.stringify({
        title: "Finish DailyFlow tasks",
        description: "Write the backend task API",
      }),
    });

    assert.equal(res.status, 201, `Expected 201 but got ${res.status}`);
    const data = await res.json();
    assert.equal(data.task.title, "Finish DailyFlow tasks");
    assert.equal(data.task.completed, false);
  } finally {
    server.kill();
  }
});

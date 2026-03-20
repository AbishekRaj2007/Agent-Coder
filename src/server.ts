import "dotenv/config";
import express from "express";
import cors from "cors";
import { randomUUID } from "crypto";
import { buildGraph, redis } from "./graph.js";

const app = express();
app.use(cors());
app.use(express.json());

const clients = new Map<string, express.Response>();

function stripMarkdown(text: string): string {
  return text.replace(/```[\w]*\n?/g, "").trim();
}

function sendEvent(runId: string, data: object) {
  const client = clients.get(runId);
  if (client) {
    client.write(`data: ${JSON.stringify(data)}\n\n`);
  }
}

app.post("/run", async (req, res) => {
  const { task } = req.body;
  if (!task) return res.status(400).json({ error: "task is required" });

  const runId = randomUUID();
  res.json({ runId });

  void runGraph(runId, task);
});

app.get("/stream/:runId", (req, res) => {
  const { runId } = req.params;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  clients.set(runId, res);

  req.on("close", () => {
    clients.delete(runId);
  });
});

// NEW: returns last 20 runs from Redis
app.get("/history", async (_req, res) => {
  const items = await redis.lrange("run:history", 0, 19);
  const history = items.map((i) => JSON.parse(i));
  res.json(history);
});

async function runGraph(runId: string, task: string) {
  try {
    const graph = buildGraph();

    const stream = await graph.stream(
      { task, plan: "", code: "", review: "", iterations: 0, finalOutput: "" },
      {
        streamMode: "updates",
        configurable: { thread_id: runId },
      }
    );

    for await (const update of stream) {
      const [nodeName, stateUpdate] = Object.entries(update)[0] as [string, any];

      if (stateUpdate.code) {
        stateUpdate.code = stripMarkdown(stateUpdate.code);
      }

      await new Promise((r) => setTimeout(r, 100));
      sendEvent(runId, { agent: nodeName, data: stateUpdate, done: false });
    }

    await redis.lpush(
      "run:history",
      JSON.stringify({ runId, task, timestamp: Date.now() })
    );
    await redis.ltrim("run:history", 0, 19);

    sendEvent(runId, { agent: "done", data: {}, done: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("runGraph failed:", message);
    sendEvent(runId, {
      agent: "system",
      data: { review: `Run failed: ${message}` },
      done: true,
    });
  } finally {
    clients.delete(runId);
  }
}

app.listen(3001, () => {
  console.log("🚀 Server running on http://localhost:3001");
});
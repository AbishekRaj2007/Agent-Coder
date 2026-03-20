import "dotenv/config";
import express from "express";
import cors from "cors";
import { buildGraph } from "./graph.js";

const app = express();
app.use(cors());
app.use(express.json());

const clients = new Map<string, express.Response>();

app.post("/run", async (req, res) => {
  const { task } = req.body;
  if (!task) return res.status(400).json({ error: "task is required" });

  const runId = crypto.randomUUID();
  res.json({ runId });

  runGraph(runId, task);
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

function sendEvent(runId: string, data: object) {
  const client = clients.get(runId);
  if (client) {
    client.write(`data: ${JSON.stringify(data)}\n\n`);
  }
}
function stripMarkdown(text: string): string {
  return text.replace(/```[\w]*\n?/g, "").trim();
}
async function runGraph(runId: string, task: string) {
  const graph = buildGraph();

  const stream = await graph.stream(
    { task, plan: "", code: "", review: "", iterations: 0, finalOutput: "" },
    { streamMode: "updates" }  
  );

  for await (const update of stream) {
    const [nodeName, stateUpdate] = Object.entries(update)[0] as [string, any];

    console.log(`[SSE] Node finished: ${nodeName}`);

    await new Promise(r => setTimeout(r, 100));

    sendEvent(runId, {
        agent: nodeName,
        data: {
        ...stateUpdate,
        code: stateUpdate.code ? stripMarkdown(stateUpdate.code) : undefined,
    },
  done: false,
});
  }

  sendEvent(runId, { agent: "done", data: {}, done: true });
  clients.delete(runId);
}

app.listen(3001, () => {
  console.log("🚀 Server running on http://localhost:3001");
});
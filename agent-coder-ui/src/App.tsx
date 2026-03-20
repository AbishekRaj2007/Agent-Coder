import { useState, useRef } from "react";

// What each SSE event looks like
type AgentEvent = {
  agent: string;
  data: {
    plan?: string;
    code?: string;
    review?: string;
  };
  done: boolean;
};

// One panel per agent result
type AgentResult = {
  agent: string;
  content: string;
  status: "running" | "done";
};

export default function App() {
  const [task, setTask] = useState("");
  const [results, setResults] = useState<AgentResult[]>([]);
  const [running, setRunning] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  async function runAgents() {
    if (!task.trim() || running) return;

    setResults([]);
    setRunning(true);

    // Step 1: POST the task, get a runId back
    const res = await fetch("http://localhost:3001/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task }),
    });
    const { runId } = await res.json();

    // Step 2: Open SSE connection with that runId
    const es = new EventSource(`http://localhost:3001/stream/${runId}`);
    eventSourceRef.current = es;

    es.onmessage = (e) => {
      const event: AgentEvent = JSON.parse(e.data);

      if (event.done) {
        es.close();
        setRunning(false);
        return;
      }

      // Extract the relevant content for this agent
      const content =
        event.data.plan ||
        event.data.code ||
        event.data.review ||
        JSON.stringify(event.data);

      // Add this agent's result to the list
      setResults((prev) => [
        ...prev,
        { agent: event.agent, content, status: "done" },
      ]);
    };

    es.onerror = () => {
      es.close();
      setRunning(false);
    };
  }

  const agentColors: Record<string, string> = {
    planner: "#1d9e75",   // teal
    coder: "#7f77dd",     // purple
    reviewer: "#ef9f27",  // amber
  };

  const agentIcons: Record<string, string> = {
    planner: "🧠",
    coder: "💻",
    reviewer: "🔍",
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "2rem", fontFamily: "monospace" }}>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>Agent Coder</h1>
      <p style={{ color: "#888", marginBottom: 24, fontSize: 14 }}>
        Multi-agent AI coding assistant · Planner → Coder → Reviewer
      </p>

      {/* Input */}
      <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
        <input
          value={task}
          onChange={(e) => setTask(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && runAgents()}
          placeholder="Describe a coding task..."
          style={{
            flex: 1, padding: "10px 14px", borderRadius: 8,
            border: "1px solid #333", background: "#111",
            color: "#fff", fontSize: 14,
          }}
        />
        <button
          onClick={runAgents}
          disabled={running}
          style={{
            padding: "10px 20px", borderRadius: 8, border: "none",
            background: running ? "#333" : "#7f77dd",
            color: "#fff", cursor: running ? "not-allowed" : "pointer",
            fontSize: 14,
          }}
        >
          {running ? "Running..." : "Run"}
        </button>
      </div>

      {/* Agent panels */}
      {results.map((r, i) => (
        <div
          key={i}
          style={{
            marginBottom: 16, borderRadius: 10,
            border: `1px solid ${agentColors[r.agent] || "#444"}`,
            overflow: "hidden",
          }}
        >
          {/* Agent header */}
          <div style={{
            padding: "8px 16px", fontWeight: 600, fontSize: 13,
            background: agentColors[r.agent] || "#333",
            color: "#fff", display: "flex", alignItems: "center", gap: 8,
          }}>
            <span>{agentIcons[r.agent] || "🤖"}</span>
            <span>{r.agent.toUpperCase()}</span>
          </div>

          {/* Content */}
          <pre style={{
            margin: 0, padding: "16px",
            background: "#0d0d0d", color: "#e0e0e0",
            fontSize: 13, lineHeight: 1.6,
            whiteSpace: "pre-wrap", wordBreak: "break-word",
            maxHeight: 400, overflowY: "auto",
          }}>
            {r.content}
          </pre>
        </div>
      ))}

      {/* Running indicator */}
      {running && (
        <div style={{ color: "#888", fontSize: 13, textAlign: "center", padding: 16 }}>
          ⏳ Agents working...
        </div>
      )}
    </div>
  );
}
import { Annotation, StateGraph, END } from "@langchain/langgraph";
import Redis from "ioredis";
import { plannerAgent } from "./agents/planner.js";
import { coderAgent } from "./agents/coder.js";
import { reviewerAgent } from "./agents/reviewer.js";

export const GraphState = Annotation.Root({
  task: Annotation<string>,
  plan: Annotation<string>,
  code: Annotation<string>,
  review: Annotation<string>,
  iterations: Annotation<number>,
  finalOutput: Annotation<string>,
});

export type GraphStateType = typeof GraphState.State;

// Redis client — Memurai runs on same port as Redis
export const redis = new Redis({ host: "127.0.0.1", port: 6379 });

redis.on("connect", () => console.log("✅ Redis connected"));
redis.on("error", (err) => console.error("❌ Redis error:", err));

export function buildGraph() {
  const graph = new StateGraph(GraphState)
    .addNode("planner", plannerAgent)
    .addNode("coder", coderAgent)
    .addNode("reviewer", reviewerAgent)
    .addEdge("__start__", "planner")
    .addEdge("planner", "coder")
    .addEdge("coder", "reviewer")
    .addConditionalEdges("reviewer", routeReviewer);

  return graph.compile();
}

function routeReviewer(state: GraphStateType): "coder" | typeof END {
  const hasIssues =
    state.review.toLowerCase().includes("issue") ||
    state.review.toLowerCase().includes("fix") ||
    state.review.toLowerCase().includes("error");

  if (hasIssues && state.iterations < 3) {
    console.log("🔁 [Router] Issues found, sending back to coder...");
    return "coder";
  }

  console.log("✅ [Router] Code approved, finishing...");
  return END;
}
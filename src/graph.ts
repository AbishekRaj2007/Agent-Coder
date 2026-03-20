import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
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

export function buildGraph() {
  const graph = new StateGraph(GraphState)
    .addNode("planner", plannerAgent)
    .addNode("coder", coderAgent)
    .addNode("reviewer", reviewerAgent)
    .addEdge(START, "planner")
    .addEdge("planner", "coder")
    .addConditionalEdges("reviewer", routeReviewer)
    .addEdge("coder", "reviewer");

  return graph.compile();
}

function routeReviewer(state: GraphStateType): "coder" | typeof END {
  const reviewText = (state.review ?? "").toLowerCase();
  const hasIssues = reviewText.includes("issue") ||
                    reviewText.includes("fix") ||
                    reviewText.includes("error");

  if (hasIssues && state.iterations < 3) {
    console.log("🔁 [Router] Issues found, sending back to coder...");
    return "coder";
  }

  console.log("✅ [Router] Code approved, finishing...");
  return END;
}
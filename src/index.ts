import "dotenv/config";
import { buildGraph } from "./graph.js";

async function main() {
  const graph = buildGraph();

  const result = await graph.invoke({
    task: "Write a TypeScript function that debounces any async function",
    plan: "",
    code: "",
    review: "",
    iterations: 0,
    finalOutput: "",
  });

  console.log("\n=== FINAL OUTPUT ===");
  console.log(result.finalOutput || result.code);
}

main();
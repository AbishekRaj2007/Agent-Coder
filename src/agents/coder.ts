import { ChatGroq } from "@langchain/groq";
import type { GraphStateType } from "../graph.js";

const llm = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  temperature: 0.3,
});

export async function coderAgent(state: GraphStateType): Promise<Partial<GraphStateType>> {
  console.log("\n🧠 [Coder] Thinking...");

  const response = await llm.invoke([
    {
      role: "system",
      content: `You are an expert TypeScript developer. Given a plan, write clean, working code. If there was a previous review with issues, fix them. Output only the code block.`,
    },
    {
      role: "user",
      content: `Plan: ${state.plan}\n\nPrevious review (if any): ${state.review}`
    },
  ]);

  const code = response.content as string;
  console.log("📋 Code:\n", code);

  // Return ONLY the fields this agent updates
  return { code, iterations: state.iterations + 1 };
}
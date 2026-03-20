import { ChatGroq } from "@langchain/groq";
import type { GraphStateType } from "../graph.js";

const llm = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  temperature: 0.3,
});

export async function plannerAgent(state: GraphStateType): Promise<Partial<GraphStateType>> {
  console.log("\n🧠 [Planner] Thinking...");

  const response = await llm.invoke([
    {
      role: "system",
      content: `You are a senior software architect. Given a coding task, 
      break it into 3-5 clear implementation steps. Be specific and technical.
      Output only the numbered steps, no extra commentary.`,
    },
    {
      role: "user",
      content: `Task: ${state.task}`,
    },
  ]);

  const plan = response.content as string;
  console.log("📋 Plan:\n", plan);

  // Return ONLY the fields this agent updates
  return { plan };
}
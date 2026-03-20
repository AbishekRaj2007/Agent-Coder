import { ChatGroq } from "@langchain/groq";
import type { GraphStateType } from "../graph.js";

const llm = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  temperature: 0.3,
});

export async function reviewerAgent(state: GraphStateType): Promise<Partial<GraphStateType>> {
  console.log("\n🧠 [Reviewer] Thinking...");

  const response = await llm.invoke([
    {
      role: "system",
      content: `You are a senior code reviewer. Review the code for critical bugs only.
If the code is functionally correct and handles main edge cases, respond with exactly 'LGTM'.
Only respond with 'Issues:' if there are actual bugs that would cause incorrect behavior.
Do NOT flag style preferences or minor improvements as issues.`,
    },
    {
      role: "user",
      content: `Code to review:\n\n${state.code}`
    },
  ]);

  const review = response.content as string;
  console.log("📋 Review:\n", review);

  // Return ONLY the fields this agent updates
  return { review };
}
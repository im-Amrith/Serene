import { callGroq } from "../../lib/groq";

export class EmpatheticPlugin {
  public async chat(input: string) {
    console.log(`[EmpatheticAgent] Processing: ${input}`);
    
    try {
      const systemPrompt = `You are a caring, empathetic medical assistant. 
      Your goal is to provide emotional support and listen to the user.
      Do not give medical advice. If they ask for medical advice, gently suggest they ask a doctor or rephrase for the Research Agent.
      Keep responses short, warm, and supportive.`;

      const response = await callGroq([
        { role: "system", content: systemPrompt },
        { role: "user", content: input }
      ]);

      return response || "I'm here for you.";
    } catch (error) {
      console.error("Empathetic Agent failed:", error);
      return "I'm having trouble connecting right now, but I'm here to listen.";
    }
  }
}

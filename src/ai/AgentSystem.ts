import { ResearchPlugin } from "./plugins/ResearchPlugin";
import { EmpatheticPlugin } from "./plugins/EmpatheticPlugin";
import { callGroq } from "../lib/groq";

// Define the Agent types
export type AgentType = "Research" | "Empathetic" | "Triage";

export interface AgentResponse {
  agent: AgentType;
  response: string;
  thoughtProcess: string; // To show the "Agentic" reasoning
  citation?: string;
  confidence?: number;
}

export class AgentOrchestrator {
  private researchPlugin: ResearchPlugin;
  private empatheticPlugin: EmpatheticPlugin;

  constructor() {
    this.researchPlugin = new ResearchPlugin();
    this.empatheticPlugin = new EmpatheticPlugin();
  }

  /**
   * The "Kernel" of our agentic workflow.
   */
  public async processRequest(userInput: string): Promise<AgentResponse> {
    // 1. Triage / Planning Step
    // The "Triage Agent" decides who handles the request.
    const plan = await this.createPlan(userInput);

    // 2. Execution Step
    let output = "";
    let citation: string | undefined;
    let confidence: number | undefined;

    if (plan.selectedAgent === "Research") {
      const result = await this.researchPlugin.searchMedicalJournals(userInput);
      output = result.text;
      citation = result.citation;
      confidence = result.confidence;
      // Use the research reasoning if available, otherwise fallback to plan reasoning
      if (result.reasoning) {
        plan.reasoning = result.reasoning;
      }
    } else {
      output = await this.empatheticPlugin.chat(userInput);
      // Empathetic agent doesn't need citations usually, but we could add a "Safety" confidence
      confidence = 100; 
    }

    return {
      agent: plan.selectedAgent,
      response: output,
      thoughtProcess: plan.reasoning,
      citation,
      confidence
    };
  }

  /**
   * Uses Groq LLM to decide which plugin to use.
   */
  private async createPlan(input: string): Promise<{ selectedAgent: AgentType; reasoning: string }> {
    try {
      const systemPrompt = `You are a Clinical Triage Orchestrator. Your job is to classify the user's input and decide which specialist agent should handle it.
      
      Agents available:
      1. "Research": Use this for questions about medical facts, symptoms, drugs, studies, or specific health conditions.
      2. "Empathetic": Use this for emotional support, general conversation, greetings, or when the user expresses distress without a specific medical question.

      Output JSON only: { "selectedAgent": "Research" | "Empathetic", "reasoning": "Brief explanation why" }`;

      const response = await callGroq([
        { role: "system", content: systemPrompt },
        { role: "user", content: input }
      ]);

      const parsed = JSON.parse(response || "{}");
      return {
        selectedAgent: parsed.selectedAgent || "Empathetic",
        reasoning: parsed.reasoning || "Defaulting to Empathetic agent."
      };
    } catch (error) {
      console.error("Planning failed, falling back to rule-based:", error);
      // Fallback logic
      const lowerInput = input.toLowerCase();
      if (lowerInput.includes("symptom") || lowerInput.includes("pain") || lowerInput.includes("what is")) {
        return { selectedAgent: "Research", reasoning: "Fallback: Keyword detection." };
      }
      return { selectedAgent: "Empathetic", reasoning: "Fallback: Default." };
    }
  }
}

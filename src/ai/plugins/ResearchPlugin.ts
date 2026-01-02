import { callGroq } from "../../lib/groq";

export interface ResearchResult {
  text: string;
  citation: string;
  confidence: number;
  reasoning?: string;
}

export class ResearchPlugin {
  // Simulates searching a medical database using LLM knowledge
  public async searchMedicalJournals(query: string): Promise<ResearchResult> {
    console.log(`[ResearchAgent] Searching journals for: ${query}`);
    
    try {
      const systemPrompt = `You are a Medical Research Assistant. 
      Your goal is to answer the user's medical question based on established medical knowledge.
      Provide a concise summary of the answer.
      Also provide a likely citation (e.g., "CDC Guidelines", "Mayo Clinic", "JAMA").
      And a confidence score (0-100).
      CRITICAL: Provide the medical reasoning or specific guidelines used (e.g., "Based on NICE Guideline NG28...").
      
      Output JSON only: { "text": "The answer...", "citation": "Source...", "confidence": 95, "reasoning": "Based on..." }`;

      const response = await callGroq([
        { role: "system", content: systemPrompt },
        { role: "user", content: query }
      ]);

      const parsed = JSON.parse(response || "{}");
      return {
        text: parsed.text || "I couldn't find specific research on that.",
        citation: parsed.citation || "General Medical Knowledge",
        confidence: parsed.confidence || 70,
        reasoning: parsed.reasoning || "Standard medical protocol analysis."
      };

    } catch (error) {
      console.error("Research Agent failed:", error);
      return {
        text: "I'm having trouble accessing the medical database right now.",
        citation: "System Error",
        confidence: 0
      };
    }
  }

  // Simulates analyzing data
  public async analyzeSymptoms(symptoms: string): Promise<ResearchResult> {
    return this.searchMedicalJournals(`Analyze these symptoms: ${symptoms}`);
  }
}

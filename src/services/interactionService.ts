import { callGroq, GroqMessage } from "../lib/groq";
import { Medicine } from "./medicineService";

export interface Interaction {
  severity: "high" | "moderate" | "low" | "none";
  type: "drug-drug" | "drug-food";
  items: string[]; // Drugs or foods involved
  description: string;
}

export const InteractionService = {
  checkInteractions: async (medicines: Medicine[]): Promise<Interaction[]> => {
    if (medicines.length === 0) return [];

    const medList = medicines.map(m => `${m.name} (${m.dosage})`).join(", ");
    
    const messages: GroqMessage[] = [
      {
        role: "system",
        content: `You are a medical interaction checker. Analyze the provided list of medicines for potential drug-drug and drug-food interactions.
        Return ONLY a JSON array of objects with this structure:
        [
          {
            "severity": "high" | "moderate" | "low",
            "type": "drug-drug" | "drug-food",
            "items": ["Drug A", "Drug B"] or ["Drug A", "Grapefruit"],
            "description": "Short explanation of the interaction."
          }
        ]
        If there are no known interactions, return an empty array [].
        Do not include any markdown formatting or explanation outside the JSON.`
      },
      {
        role: "user",
        content: `Check for interactions between these medicines: ${medList}`
      }
    ];

    try {
      const response = await callGroq(messages);
      // Clean up response if it contains markdown code blocks
      const cleanResponse = response.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(cleanResponse);
    } catch (error) {
      console.error("Failed to check interactions:", error);
      // Return a safe fallback or empty array on error
      return [];
    }
  }
};

import { callGroq, GroqMessage } from '../lib/groq';
import { ChatMessage } from './symptomService';

export interface SOAPNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export const generateSOAPNote = async (chatHistory: ChatMessage[]): Promise<SOAPNote> => {
  // Format chat history for the prompt
  const conversationText = chatHistory
    .map(msg => `${msg.type.toUpperCase()}: ${msg.text}`)
    .join('\n');

  const messages: GroqMessage[] = [
    {
      role: "system",
      content: `You are an expert Medical Scribe. Convert the following patient-AI conversation into a professional SOAP Note.
      
      Return ONLY a JSON object with the following keys:
      - subjective: What the patient feels/said (History of Present Illness).
      - objective: Observable data (e.g., heart rate from sensors, detected symptoms, visual observations).
      - assessment: Potential conditions based on symptoms (Differential Diagnosis).
      - plan: Recommended next steps (e.g., "See Cardiologist", "Monitor hydration"). Keep it technical and concise for a doctor to read.

      Do not include any markdown formatting or code blocks, just the raw JSON string.`
    },
    {
      role: "user",
      content: `Conversation:\n${conversationText}`
    }
  ];

  try {
    const response = await callGroq(messages);
    // Clean up response if it contains markdown code blocks
    const cleanJson = response.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Error generating SOAP note:", error);
    throw new Error("Failed to generate clinical summary");
  }
};

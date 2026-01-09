const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export const callGroq = async (messages: GroqMessage[], model: string = "llama-3.1-8b-instant") => {
  if (!GROQ_API_KEY) {
    console.warn("Groq API Key is missing. Using mock response.");
    
    // Check if it's a nutrition body scan or menu scan based on system prompt
    const systemContent = messages.find(m => m.role === "system")?.content || "";
    
    if (systemContent.includes("visual description of a person's face/nails")) {
      return JSON.stringify({
        detectedItems: ["Pale Skin", "Dark Circles"],
        recommendations: ["Increase iron-rich foods like spinach and red meat", "Ensure 7-8 hours of sleep"],
        deficiency: "Possible Iron Deficiency Anemia"
      });
    } else if (systemContent.includes("Analyze the restaurant menu text")) {
        return JSON.stringify({
          recommended: [
            { name: "Grilled Salmon with Asparagus", reason: "High in Omega-3 and fiber, low saturated fat.", matchScore: 98 },
            { name: "Quinoa Salad Bowl", reason: "Complete protein and nutrient-dense vegetables.", matchScore: 95 }
          ],
          avoid: [
            { name: "Double Cheeseburger and Fries", reason: "High in sodium and saturated fats." }
          ]
        });
    }
    
    // Default fallback
    return "I am a simulated AI assistant since the API key is missing.";
  }

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Groq API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error calling Groq API:", error);
    throw error;
  }
};

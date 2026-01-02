import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from "firebase/firestore";
import { db } from "../lib/firebase";

export interface ChatMessage {
  type: 'user' | 'bot';
  text: string;
  imageUrl?: string; // Base64 or URL
  citation?: string;
  timestamp: any;
  agent?: string; // e.g., "Research", "Empathetic"
  thoughtProcess?: string;
  confidence?: number;
}

export interface SymptomSession {
  id?: string;
  userId: string;
  messages: ChatMessage[];
  summary?: string;
  createdAt: any;
}

export const SymptomService = {
  // Save a new chat session
  saveSession: async (userId: string, messages: ChatMessage[]) => {
    try {
      const docRef = await addDoc(collection(db, "users", userId, "symptom_sessions"), {
        userId,
        messages,
        createdAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error("Error saving symptom session: ", error);
      throw error;
    }
  },

  // Get past sessions
  getHistory: async (userId: string) => {
    try {
      const q = query(
        collection(db, "users", userId, "symptom_sessions"), 
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SymptomSession[];
    } catch (error) {
      console.error("Error fetching symptom history: ", error);
      return [];
    }
  }
};

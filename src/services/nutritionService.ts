import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy,
  Timestamp 
} from "firebase/firestore";
import { db } from "../lib/firebase";

export interface NutritionScan {
  id?: string;
  userId: string;
  scanType: 'body' | 'menu';
  detectedItems: string[]; // e.g., ["Pale Eyelids", "Spinach Soup"]
  recommendations: string[];
  createdAt: any;
}

export const NutritionService = {
  // Save a scan result
  saveScan: async (scan: Omit<NutritionScan, 'id' | 'createdAt'>) => {
    try {
      const docRef = await addDoc(collection(db, "users", scan.userId, "nutrition_scans"), {
        ...scan,
        createdAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error("Error saving nutrition scan: ", error);
      throw error;
    }
  },

  // Get past scans
  getHistory: async (userId: string) => {
    try {
      const q = query(
        collection(db, "users", userId, "nutrition_scans"), 
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as NutritionScan[];
    } catch (error) {
      console.error("Error getting nutrition history: ", error);
      throw error;
    }
  }
};

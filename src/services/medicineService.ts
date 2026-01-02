import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  Timestamp
} from "firebase/firestore";
import { db } from "../lib/firebase";

export interface Medicine {
  id?: string;
  name: string;
  dosage: string;
  time: string;
  days?: string[]; // e.g. ["Mon", "Wed", "Fri"]
  taken: boolean;
  userId: string;
  createdAt?: any;
}

export const MedicineService = {
  // Add a new medicine
  addMedicine: async (medicine: Omit<Medicine, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, "users", medicine.userId, "medicines"), {
        ...medicine,
        createdAt: Timestamp.now()
      });
      return { id: docRef.id, ...medicine };
    } catch (error) {
      console.error("Error adding medicine (Firebase): ", error);
      // Fallback for Demo/Offline mode
      console.warn("Falling back to local mock data.");
      return { id: `mock-${Date.now()}`, ...medicine };
    }
  },

  // Get all medicines for a user
  getMedicines: async (userId: string) => {
    try {
      const querySnapshot = await getDocs(collection(db, "users", userId, "medicines"));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Medicine[];
    } catch (error) {
      console.error("Error fetching medicines (Firebase): ", error);
      // Fallback mock data
      return [
        { id: '1', name: 'Lisinopril', dosage: '10mg', time: '08:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], taken: true, userId },
        { id: '2', name: 'Metformin', dosage: '500mg', time: '20:00', days: ['Mon', 'Wed', 'Fri'], taken: false, userId }
      ];
    }
  },

  // Toggle taken status
  toggleTaken: async (id: string, currentStatus: boolean, userId: string) => {
    try {
      // If it's a mock ID, don't try to update Firebase
      if (id.startsWith('mock-') || id === '1' || id === '2') return;

      const medicineRef = doc(db, "users", userId, "medicines", id);
      await updateDoc(medicineRef, {
        taken: !currentStatus
      });
    } catch (error) {
      console.error("Error updating medicine: ", error);
    }
  },

  // Delete medicine
  deleteMedicine: async (id: string, userId: string) => {
    try {
      if (id.startsWith('mock-') || id === '1' || id === '2') return;
      await deleteDoc(doc(db, "users", userId, "medicines", id));
    } catch (error) {
      console.error("Error deleting medicine: ", error);
    }
  }
};

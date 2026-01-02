import { doc, collection, writeBatch } from "firebase/firestore";
import { db } from "../lib/firebase";

export const seedUserData = async (uid: string) => {
  const batch = writeBatch(db);

  // 1. User Profile
  const userRef = doc(db, "users", uid);
  batch.set(userRef, {
    name: "Alex Thompson",
    email: "demo@serene.ai",
    guardianLevel: "Level 4 Guardian",
    bloodType: "O+",
    allergies: ["Penicillin", "Peanuts"],
    emergencyContacts: [
      { name: "Sarah Thompson", relation: "Spouse", phone: "+15550123456" }
    ],
    createdAt: new Date().toISOString()
  });

  // 2. Gamification Stats
  const statsRef = doc(db, "users", uid, "stats", "gamification");
  batch.set(statsRef, {
    points: 1250,
    level: 5,
    streak: 12,
    adherenceRate: 92,
    dietQualityScore: 85,
    symptomLogCount: 24,
    lastUpdated: new Date().toISOString()
  });

  // 3. Medicines
  const medicinesRef = collection(db, "users", uid, "medicines");
  const med1Ref = doc(medicinesRef);
  batch.set(med1Ref, {
    name: "Lisinopril",
    dosage: "10mg",
    frequency: "Daily",
    time: "08:00",
    instructions: "Take with food",
    stock: 25,
    refillThreshold: 7
  });

  const med2Ref = doc(medicinesRef);
  batch.set(med2Ref, {
    name: "Metformin",
    dosage: "500mg",
    frequency: "Twice Daily",
    time: "09:00, 21:00",
    instructions: "Take after meals",
    stock: 50,
    refillThreshold: 10
  });

  await batch.commit();
  console.log("User data seeded successfully for UID:", uid);
};

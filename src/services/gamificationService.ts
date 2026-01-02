export interface HealthStats {
  adherenceRate: number; // 0-100
  dietQualityScore: number; // 0-100
  symptomSeverity: number; // 0-10 (0 is good, 10 is bad)
}

export interface PetState {
  mood: 'happy' | 'tired' | 'sick' | 'super';
  level: number;
  name: string;
  description: string;
}

export class GamificationService {
  // H_s = w1(Adherence) + w2(Diet) - w3(Symptoms)
  // Weights
  private static W1 = 0.6; // Adherence is critical
  private static W2 = 0.4; // Diet is important
  private static W3 = 5.0; // Symptom severity penalty (scale 0-10 maps to 0-50 penalty)

  public static calculateHealthScore(stats: HealthStats): number {
    // Formula: (0.6 * Adherence) + (0.4 * Diet) - (5 * Severity)
    const score = (this.W1 * stats.adherenceRate) + 
                  (this.W2 * stats.dietQualityScore) - 
                  (this.W3 * stats.symptomSeverity);
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  public static getPetState(score: number): PetState {
    let mood: PetState['mood'] = 'tired';
    let description = "";

    if (score >= 90) {
      mood = 'super';
      description = "Radiating energy! Your health habits are legendary.";
    } else if (score >= 70) {
      mood = 'happy';
      description = "Feeling great! Keep up the good work.";
    } else if (score >= 40) {
      mood = 'tired';
      description = "Feeling a bit sluggish. Don't forget your meds.";
    } else {
      mood = 'sick';
      description = "Not feeling well. Please check your symptom tracker.";
    }

    return {
      mood,
      level: Math.floor(score / 10),
      name: 'Vitalis',
      description
    };
  }

  public static async getUserStats(userId: string): Promise<HealthStats> {
    // Mock data aggregation
    // In a real app, this would query MedicineService, NutritionService, and SymptomService
    return {
      adherenceRate: 90,
      dietQualityScore: 75,
      symptomSeverity: 1
    };
  }
}

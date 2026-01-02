# LifeGuard AI - Personal Health Companion

LifeGuard AI is a comprehensive, AI-powered health management platform designed to empower users to take control of their well-being. It combines advanced computer vision, acoustic analysis, and generative AI to provide real-time health insights, medication management, and symptom analysis.

## 🚀 Features

### 1. **Smart Dashboard**
*   **Gamified Health Score:** Tracks adherence, diet, and symptoms to generate a daily health score.
*   **Virtual Pet (Vitalis):** A companion that reacts to your health habits (Happy, Tired, Sick).
*   **Real-time Stats:** Visualizes adherence rates and diet quality trends.

### 2. **Medicine Manager**
*   **Digital Pillbox:** Track medications, dosages, and schedules.
*   **Interaction Checker:** Automatically checks for dangerous drug interactions.
*   **Generic Drug Finder:** Finds cost-effective generic alternatives.
*   **Adherence Tracking:** Log taken doses and monitor compliance.

### 3. **AI Symptom Checker**
*   **Conversational Triage:** Chat with an AI agent to analyze symptoms.
*   **SOAP Note Generator:** Generates professional clinical notes for doctor visits.
*   **Dermatology Scanner:** Analyzes skin conditions using computer vision.
*   **Body Map Interface:** Visual symptom selection.

### 4. **Nutrition Analyzer**
*   **Menu Scanner:** Reads restaurant menus and recommends healthy options.
*   **Body Sign Analysis:** Detects potential nutritional deficiencies from facial/nail signs using AI.

### 5. **Physio-Bot**
*   **AI Rep Counter:** Uses computer vision (BlazePose) to count exercise repetitions.
*   **Form Correction:** Provides real-time feedback on exercise form.

### 6. **Respiro-Scan**
*   **Acoustic Analysis:** Analyzes cough and breathing sounds to detect respiratory issues.

### 7. **Mirror-Check Vitals**
*   **Contactless Monitoring:** Measures Heart Rate, Respiration Rate, and SpO2 using just the webcam (rPPG technology).
*   **Real-time Face Tracking:** Automatically adjusts to user movement.

### 8. **User Profile & Safety**
*   **Emergency Mode:** One-tap access to emergency contacts and medical ID.
*   **Wallet Pass:** Generate a digital medical ID pass.
*   **Accessibility:** Voice navigation and High-Contrast Simple Mode for elderly users.

## 🛠️ Tech Stack

*   **Frontend:** React, TypeScript, Vite
*   **Styling:** Tailwind CSS, Lucide React (Icons)
*   **Backend / Auth:** Firebase (Authentication, Firestore)
*   **AI & Machine Learning:**
    *   **TensorFlow.js:** Pose Detection (BlazePose) for Physio-Bot & Mirror-Check.
    *   **Azure Cognitive Services:** Vision & Speech capabilities.
    *   **Groq:** LLM for conversational agents and medical reasoning.
*   **State Management:** React Context API

## 📦 Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/lifeguard-ai.git
    cd lifeguard-ai
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file in the root directory and add your API keys:

    ```env
    # Firebase Configuration
    VITE_FIREBASE_API_KEY=your_api_key
    VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID=your_project_id
    VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    VITE_FIREBASE_APP_ID=your_app_id
    VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

    # AI Services (Optional for Mock Mode)
    VITE_GROQ_API_KEY=your_groq_key
    VITE_AZURE_SPEECH_KEY=your_azure_speech_key
    VITE_AZURE_SPEECH_REGION=your_azure_region
    VITE_AZURE_VISION_KEY=your_azure_vision_key
    VITE_AZURE_VISION_ENDPOINT=your_azure_endpoint
    VITE_GOOGLE_API_KEY=your_google_key
    VITE_GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

## 🔐 Authentication & Demo Mode

The application uses Firebase Authentication.

*   **Demo Account:** The login screen includes an **"Initialize Demo Data"** button.
    *   **Email:** `demo@medco.ai`
    *   **Password:** `password123`
*   **Data Seeding:** Clicking the initialize button will create the user (if not exists) and populate Firestore with sample data for a rich demo experience.

## 📄 License

This project is licensed under the MIT License.

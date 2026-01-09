export class VisionService {
  // Uses Azure Computer Vision to analyze an image URL or Blob
  public static async analyzeImage(imageUrl: string): Promise<string> {
    const key = import.meta.env.VITE_AZURE_VISION_KEY;
    const endpoint = import.meta.env.VITE_AZURE_VISION_ENDPOINT;

    if (!key || !endpoint) {
      console.warn("Azure Vision keys missing, using mock.");
      return "A close up of a person's face showing pale skin, suggesting potential iron deficiency.";
    }

    const url = `${endpoint}/vision/v3.2/analyze?visualFeatures=Description,Objects,Tags&language=en`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': key
        },
        body: JSON.stringify({ url: imageUrl })
      });

      if (!response.ok) {
        throw new Error(`Azure Vision API Error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.description?.captions[0]?.text || "No description available.";
    } catch (error) {
      console.error("Vision Analysis Failed:", error);
      return "Failed to analyze image.";
    }
  }

  // Uses Azure Computer Vision to analyze an image Blob (Binary)
  public static async analyzeImageBinary(imageBlob: Blob): Promise<string> {
    const key = import.meta.env.VITE_AZURE_VISION_KEY;
    const endpoint = import.meta.env.VITE_AZURE_VISION_ENDPOINT;

    if (!key || !endpoint) {
      console.warn("Azure Vision keys missing, using mock.");
      return "A close up of a person's face showing pale skin and slight dark circles under the eyes. Tags: face, person, indoor";
    }

    const url = `${endpoint}/vision/v3.2/analyze?visualFeatures=Description,Objects,Tags&language=en`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'Ocp-Apim-Subscription-Key': key
        },
        body: imageBlob
      });

      if (!response.ok) {
        throw new Error(`Azure Vision API Error: ${response.statusText}`);
      }

      const data = await response.json();
      const captions = data.description?.captions[0]?.text;
      const tags = data.tags?.map((t: any) => t.name).join(", ");
      return captions ? `${captions}. Tags: ${tags}` : "No description available.";
    } catch (error) {
      console.error("Vision Analysis Failed:", error);
      return "Failed to analyze image.";
    }
  }

  // Uses Azure Computer Vision OCR (Read API) to extract text from an image
  public static async readText(imageBlob: Blob): Promise<string[]> {
    const key = import.meta.env.VITE_AZURE_VISION_KEY;
    const endpoint = import.meta.env.VITE_AZURE_VISION_ENDPOINT;

    if (!key || !endpoint) {
      console.warn("Azure Vision keys missing, using mock.");
      return [
        "Grilled Salmon with Asparagus",
        "Quinoa Salad Bowl",
        "Double Cheeseburger and Fries",
        "Green Smoothie"
      ];
    }

    const url = `${endpoint}/vision/v3.2/read/analyze`;

    try {
      // 1. Submit image for processing
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'Ocp-Apim-Subscription-Key': key
        },
        body: imageBlob
      });

      if (response.status !== 202) {
        throw new Error(`Azure OCR API Error: ${response.statusText}`);
      }

      const operationLocation = response.headers.get('Operation-Location');
      if (!operationLocation) throw new Error("No Operation-Location header found");

      // 2. Poll for results
      let status = 'running';
      let resultData;

      while (status === 'running' || status === 'notStarted') {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s
        const resultResponse = await fetch(operationLocation, {
          headers: { 'Ocp-Apim-Subscription-Key': key }
        });
        resultData = await resultResponse.json();
        status = resultData.status;
      }

      if (status === 'succeeded') {
        const lines: string[] = [];
        resultData.analyzeResult.readResults.forEach((page: any) => {
          page.lines.forEach((line: any) => {
            lines.push(line.text);
          });
        });
        return lines;
      } else {
        throw new Error("OCR Operation failed");
      }

    } catch (error) {
      console.error("OCR Failed:", error);
      return [];
    }
  }

  // Simulates Azure Vision describing the screen content (Legacy/Mock)
  public static async describeScreen(screenName: string, contextData: any): Promise<string> {
    // ... existing mock logic ...
    console.log(`[VisionService] Analyzing screen: ${screenName}`, contextData);
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (screenName === 'Dashboard') return "You are on the Dashboard. You have 2 upcoming medicines and a flu alert in your area.";
    if (screenName === 'MedicineManager') return `You are on the Medicine Manager. You have ${contextData?.medicineCount || 0} medicines listed.`;
    return `You are on the ${screenName} page.`;
  }
}

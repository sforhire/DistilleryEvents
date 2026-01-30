
import { GoogleGenAI } from "@google/genai";
import { EventRecord } from "../types";

const getApiKey = (): string => {
  try {
    return (typeof process !== 'undefined' ? process.env.API_KEY : '') || '';
  } catch {
    return '';
  }
};

export const generateFOHBriefing = async (event: EventRecord): Promise<string> => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    return "AI Briefing unavailable: API_KEY environment variable is not set. Please configure your Gemini key in Vercel.";
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const foodDetails = event.hasFood 
    ? `FOOD SERVICE: ${event.foodSource} - ${event.foodServiceType} style.` 
    : "NO FOOD SERVICE.";
    
  const parkingDetails = event.addParking 
    ? "PARKING: Additional 20 cars requested ($500 fee applied). Ensure spots are reserved."
    : "PARKING: Standard parking requirements.";

  const barLogistics = event.beerWineOffered
    ? "BAR: Beer/Wine offered for additional fee."
    : "BAR: Client paying uncorking fee for own selection.";

  const prompt = `
    Act as an expert event coordinator for a premium Distillery. Generate a concise, professional Front of House (FOH) briefing for the following event:
    
    Event Type: ${event.eventType}
    Guest Name: ${event.firstName} ${event.lastName}
    Date & Time: ${event.dateRequested} at ${event.time}
    Guest Count: ${event.guests}
    Bar Setup: ${event.barType} (${barLogistics})
    Logistics: ${foodDetails} | ${parkingDetails}
    Tour Required: ${event.hasTour ? 'Yes' : 'No'}
    Tasting Required: ${event.hasTasting ? 'Yes' : 'No'}
    Special Requests: ${event.notes}
    
    Please structure the briefing with sections for:
    1. Arrival & Greeting (include parking notes)
    2. Bar & Service Strategy (mention beer/wine vs uncorking)
    3. Logistics & Food Timing
    4. Key Points for Success
    
    Keep it actionable and helpful for the service staff. Mention any specific equipment needed for the food service style.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
      },
    });
    
    return response.text || "Unable to generate briefing at this time.";
  } catch (error) {
    console.error("Gemini Briefing Error:", error);
    return "Error generating AI briefing. Please check your API key permissions or project status.";
  }
};

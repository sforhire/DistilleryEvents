
import { GoogleGenAI } from "@google/genai";
import { EventRecord } from "../types";

// Follows Gemini API Coding Guidelines:
// 1. Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
// 2. Use ai.models.generateContent to query with model and prompt.
export const generateFOHBriefing = async (event: EventRecord): Promise<string> => {
  // Always initialize right before use with the correct environment variable (process.env.API_KEY)
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const foodDetails = event.hasFood 
    ? `FOOD SERVICE: ${event.foodSource || 'TBD'} - ${event.foodServiceType || 'TBD'} style.` 
    : "NO FOOD SERVICE.";
    
  const prompt = `
    Act as an expert event coordinator. Generate a concise FOH briefing for:
    Event: ${event.eventType}
    Guest: ${event.firstName} ${event.lastName}
    Count: ${event.guests}
    Bar: ${event.barType}
    Food: ${foodDetails}
    Notes: ${event.notes}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // Direct property access to .text (extracted string output as per guidelines)
    return response.text || "Unable to generate briefing.";
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    return "Error generating AI briefing.";
  }
};


import { GoogleGenAI } from "@google/genai";
import { EventRecord } from "../types";
import { getEnv } from "./utils";

export const generateFOHBriefing = async (event: EventRecord): Promise<string> => {
  const apiKey = getEnv('API_KEY');
  
  if (!apiKey) {
    return "AI Briefing unavailable: API_KEY environment variable is not set.";
  }

  const ai = new GoogleGenAI({ apiKey });
  
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
    return response.text || "Unable to generate briefing.";
  } catch (error) {
    return "Error generating AI briefing.";
  }
};

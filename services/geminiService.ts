
import { GoogleGenAI } from "@google/genai";
import { EventRecord } from "../types";

/**
 * Generates an event briefing using Gemini AI.
 * Mandatory: Uses process.env.API_KEY directly for initialization as per guidelines.
 */
export const generateFOHBriefing = async (event: EventRecord): Promise<string> => {
  // Always obtain the API key exclusively from process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const foodDetails = event.hasFood 
    ? `FOOD SERVICE: ${event.foodSource || 'TBD'} - ${event.foodServiceType || 'TBD'} style.` 
    : "NO FOOD SERVICE.";
    
  // Refined prompt to focus on data; persona is moved to systemInstruction
  const prompt = `
    Generate a concise Front of House (FOH) intelligence briefing for:
    Event: ${event.eventType}
    Guest: ${event.firstName} ${event.lastName}
    Count: ${event.guests}
    Bar Selection: ${event.barType}
    Catering: ${foodDetails}
    Specific Client Notes: ${event.notes}
  `;

  try {
    // Correct method: Query GenAI with model and prompt in a single call using recommended text task model
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are an expert event coordinator. Generate a highly professional, concise Front of House (FOH) intelligence briefing based on the provided event data. Focus on critical operational details.",
      }
    });
    // Correct method: Access .text property directly (not as a function)
    return response.text || "Unable to generate briefing.";
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    return "Error generating AI briefing.";
  }
};

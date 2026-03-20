import { GoogleGenAI, Type } from "@google/genai";

export async function callGeminiWithRotation(prompt: string, systemInstruction?: string, responseSchema?: any) {
  const keys = Object.keys(process.env)
    .filter(k => k.startsWith('GEMINI_KEY_'))
    .map(k => process.env[k] as string)
    .filter(Boolean);

  if (keys.length === 0) {
    throw new Error("No Gemini API keys configured. Please add GEMINI_KEY_1 in settings.");
  }

  let lastError;
  for (const key of keys) {
    try {
      const ai = new GoogleGenAI({ apiKey: key });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: responseSchema ? "application/json" : "text/plain",
          responseSchema,
        }
      });
      return response.text;
    } catch (error: any) {
      lastError = error;
      // If rate limited (429), try the next key
      if (error.status === 429 || error.message?.includes('429')) {
        console.warn("Rate limit hit, rotating to next Gemini key...");
        continue;
      }
      // If other error, throw immediately
      throw error;
    }
  }
  throw lastError;
}

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function suggestTweet(topic: string) {
  if (!process.env.GEMINI_API_KEY) {
    return ["AI insights currently restricted. (Missing API Key)"];
  }
  
  try {
    const prompt = `Act as a social media expert for JTweet. Generate 3 short, catchy, and professional tweets about: ${topic}. 
    Style: Next-gen, tech-forward, high-value. 
    Format: Return only the 3 tweets separated by | character.`;
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });

    const text = response.text || "";
    return text.split('|').map(t => t.trim()).filter(t => t.length > 0);
  } catch (error) {
    console.error("Gemini Error:", error);
    return ["The future of communication is here.", "JTweet: Where intelligence hits the feed.", "Connect at the speed of thought."];
  }
}

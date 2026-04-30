import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function suggestTweet(topic: string) {
  if (!process.env.GEMINI_API_KEY) {
    return ["AI insights currently restricted. (Missing API Key)"];
  }
  
  try {
    const prompt = `System Instruction: You are the Neural Core AI for JTweet, a cyber-fusion microblogging platform. Your goal is to help users synthesize high-impact "Signals" (tweets).
    
    Task: Generate 3 distinct and engaging Signals about this topic: "${topic}".
    
    Style Guidelines:
    - Tone: Futuristic, visionary, technical but accessible, and slightly provocative.
    - Aesthetics: Cyber-fusion, high-performance, neural-inked.
    - Constraints: Maximum 180 characters per Signal. Use relevant technical or futuristic metaphors (e.g., protocol, synchronization, matrix, sector, uplink).
    
    Format: Return ONLY the results as a single line, with each Signal separated by the "||" token.`;
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });

    const text = response.text || "";
    return text.split('||').map(t => t.trim()).filter(t => t.length > 0);
  } catch (error) {
    console.error("Gemini Error:", error);
    return ["The future of communication is here.", "JTweet: Where intelligence hits the feed.", "Connect at the speed of thought."];
  }
}

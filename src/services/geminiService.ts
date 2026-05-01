import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function summarizeTweet(content: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Please provide a very concise, one-sentence summary of the following signal (tweet): "${content}"`,
    });

    return response.text?.trim() || "Summary unavailable.";
  } catch (error) {
    console.error("Summarization error:", error);
    return "Failed to process signal summary.";
  }
}

export async function analyzeSentiment(content: string): Promise<'positive' | 'neutral' | 'negative'> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the sentiment of this text and return ONLY one word: "positive", "neutral", or "negative". Text: "${content}"`,
    });

    const sentiment = response.text?.toLowerCase().trim();
    if (sentiment?.includes('positive')) return 'positive';
    if (sentiment?.includes('negative')) return 'negative';
    return 'neutral';
  } catch (error) {
    return 'neutral';
  }
}

export async function suggestTweet(topic: string): Promise<string[]> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Suggest 3 creative and futuristic signals (tweets) about ${topic}. Return ONLY a JSON array of strings.`,
      config: { responseMimeType: "application/json" }
    });

    const suggestions = JSON.parse(response.text || "[]");
    return Array.isArray(suggestions) ? suggestions : [response.text || ""];
  } catch (error) {
    return ["The future is indeterminate.", "Connectivity flux detected.", "Neural link established."];
  }
}

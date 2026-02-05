
import { GoogleGenAI } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getFinancialAdvice = async (dataSummary: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a professional financial advisor for Finance Hub. Based on the following dashboard data summary, provide 3 short, actionable financial tips.
      
      Data Summary:
      ${dataSummary}
      
      Format the response as clear, bulleted points with bold headers. Keep it professional and encouraging.`,
      config: {
        systemInstruction: "You are an expert financial consultant with deep knowledge of personal finance management. Your goal is to provide concise, data-driven advice.",
        temperature: 0.7,
      }
    });
    
    return response.text;
  } catch (error) {
    console.error('Error fetching financial advice:', error);
    return "I'm having trouble analyzing your data right now. Please try again later.";
  }
};

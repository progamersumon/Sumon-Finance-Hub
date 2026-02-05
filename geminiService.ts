
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

export const getFinancialAdvice = async (query: string, context: any) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Process context to make it readable for the LLM
    const summarizedContext = {
      netWorth: context.metrics?.find((m: any) => m.label === 'Net Worth')?.value,
      monthlyIncome: context.transactions?.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + t.amount, 0),
      monthlyExpenses: context.transactions?.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + t.amount, 0),
      pendingBillsCount: context.bills?.filter((b: any) => b.status !== 'paid').length,
      savingsProgress: context.savings?.map((s: any) => `${s.name}: ${Math.round((s.current/s.target)*100)}%`).join(', ')
    };

    const userPrompt = `User Data: ${JSON.stringify(summarizedContext)}\nUser Question: "${query}"`;
    const systemInstruction = `You are an expert financial advisor for the "Finance Hub" app.
      
      Instructions:
      1. Provide concise, actionable, and encouraging financial advice.
      2. Use the user's data (Net Worth: ৳${summarizedContext.netWorth}) to personalize the answer.
      3. Format the response with clear points.
      4. Keep it professional but friendly.`;

    // FIX: Using systemInstruction in config as per current best practices for Gemini 3
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: systemInstruction,
      },
    });

    // FIX: Correctly access text property (not a method)
    return response.text || "I apologize, but I couldn't generate advice at this moment. Please try asking in a different way.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Something went wrong while connecting to the AI advisor. Please check your connection and try again.";
  }
};

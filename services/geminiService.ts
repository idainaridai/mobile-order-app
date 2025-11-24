import { GoogleGenAI, Type } from "@google/genai";
import { Product, ProductCategory } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    // NOTE: In a real production app, ensure process.env.API_KEY is set securely.
    // For this demo, if the key is missing, we will simulate a response or throw a clear error.
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async generateDailySpecial(ingredients: string): Promise<Omit<Product, 'id' | 'isSoldOut'>> {
    if (!process.env.API_KEY) {
      console.warn("Gemini API Key is missing. Returning mock data.");
      // Mock fall back for demo purposes if no key provided
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            name: `シェフの気まぐれ: ${ingredients}風`,
            price: 850,
            category: ProductCategory.RECOMMEND,
            description: `${ingredients}を贅沢に使った、本日限定の特別メニューです。`,
            imageUrl: 'https://picsum.photos/400/300?random=99',
            isSpecial: true
          });
        }, 1500);
      });
    }

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Create a creative Japanese Izakaya menu item using these ingredients/themes: "${ingredients}". 
        Return a JSON object with name, price (in JPY, between 500-1200), description (appetizing, max 40 chars), and a category (must be "おすすめ").`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              price: { type: Type.NUMBER },
              description: { type: Type.STRING },
            },
            required: ["name", "price", "description"]
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      
      return {
        name: result.name || '本日のスペシャル',
        price: result.price || 800,
        category: ProductCategory.RECOMMEND,
        description: result.description || '旬の食材を使った逸品です。',
        imageUrl: 'https://picsum.photos/400/300?random=' + Math.floor(Math.random() * 1000),
        isSpecial: true,
      };

    } catch (error) {
      console.error("Gemini generation failed:", error);
      throw new Error("メニュー生成に失敗しました");
    }
  }
}

export const geminiService = new GeminiService();
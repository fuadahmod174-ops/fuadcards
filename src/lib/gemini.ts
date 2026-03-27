import { GoogleGenAI } from "@google/genai";

// Use the platform provided API key
function getGenAI() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set. Please check your environment variables.");
  }
  return new GoogleGenAI({ apiKey });
}

export async function generateAnimeImage(characterName: string, animeSource: string) {
  const genAI = getGenAI();
  const model = genAI.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: {
      parts: [
        {
          text: `High-quality anime trading card illustration of ${characterName} from ${animeSource}. 
          Style: High-end aesthetic, vibrant colors, detailed background, cinematic lighting. 
          The character should be the central focus. 
          The bottom-right corner should be clean and uncluttered for a QR code overlay, without any artificial borders, frames, or boxes in that specific area.`
        }
      ]
    },
    config: {
      imageConfig: {
        aspectRatio: "3:4",
        imageSize: "1K"
      }
    }
  });

  const response = await model;
  const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
  
  if (!part?.inlineData?.data) {
    throw new Error("Failed to generate image");
  }

  return `data:image/png;base64,${part.inlineData.data}`;
}

export async function generateCardStats(characterName: string, animeSource: string) {
  const genAI = getGenAI();
  const model = genAI.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the lore and canonical strength of ${characterName} from ${animeSource}. 
    Calculate their Power and Strength directly from their canonical feats and abilities.
    Return JSON format: { "power": number (1-100), "strength": number (1-100), "rarity": "Common" | "Rare" | "Epic" | "Legendary", "lore_reasoning": string }`,
    config: {
      responseMimeType: "application/json"
    }
  });

  const response = await model;
  return JSON.parse(response.text || "{}");
}

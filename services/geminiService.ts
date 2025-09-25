import { GoogleGenAI, Type } from "@google/genai";
import { CampaignResult, AdvancedSettings } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    targetAudience: { type: Type.STRING },
    keyMessaging: { type: Type.ARRAY, items: { type: Type.STRING } },
    socialMediaStrategy: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          platform: { type: Type.STRING },
          strategy: { type: Type.STRING },
        },
        required: ["platform", "strategy"],
      },
    },
    seoKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
    adCopy: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          headline: { type: Type.STRING },
          body: { type: Type.STRING },
        },
        required: ["headline", "body"],
      },
    },
    aiImagePrompts: { type: Type.ARRAY, items: { type: Type.STRING } },
    aiVideoConcepts: { type: Type.ARRAY, items: { type: Type.STRING } },
    backlinkStrategy: { type: Type.ARRAY, items: { type: Type.STRING } },
    trendingTopics: {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                topic: { type: Type.STRING },
                angle: { type: Type.STRING },
            },
            required: ["topic", "angle"],
        },
    },
    metaData: {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
        },
        required: ["title", "description"],
    },
  },
  required: ["targetAudience", "keyMessaging", "socialMediaStrategy", "seoKeywords", "adCopy"]
};


export const generateMarketingCampaign = async (productDescription: string, generateMedia: boolean, settings: AdvancedSettings): Promise<CampaignResult> => {

  let prompt = `Generate a comprehensive marketing campaign for the following product: "${productDescription}".\n\n`;

  // --- Branding Context ---
  if (settings.companyName) prompt += `The campaign is for the company "${settings.companyName}".\n`;
  if (settings.companyWebsite) prompt += `Analyze the writing style, tone, and branding from their website: ${settings.companyWebsite}. The generated content should match this style. \n`;
  if (settings.brandColors.primary || settings.brandColors.secondary) prompt += `The brand's primary colors are ${settings.brandColors.primary} and secondary is ${settings.brandColors.secondary}. Visuals should incorporate this palette.\n`;
  if (settings.socialMediaLinks.length > 0) {
      prompt += `The company's social media profiles are:\n${settings.socialMediaLinks.map(l => `- ${l.platform}: ${l.url}`).join('\n')}\n`;
  }

  // --- Content & SEO ---
  if(settings.nationalLanguage) prompt += `All content must be written in ${settings.nationalLanguage}.\n`;
  if (settings.useGoogleEAT) prompt += `All written content must adhere to Google's E-E-A-T (Experience, Expertise, Authoritativeness, and Trustworthiness) guidelines.\n`;
  if (settings.useHemingwayStyle) prompt += `Write all copy in the style of Hemingway: clear, concise, and impactful.\n`;
  prompt += `Always generate SEO meta title and description for a webpage about this product.\n`

  // --- Strategic Directives ---
  if (settings.generateBacklinks) prompt += `Include a practical backlink generation strategy with actionable ideas.\n`;
  if (settings.findTrendingTopics) prompt += `Include a section with trending topics relevant to the product and creative angles to leverage them.\n`;

  // --- Media Generation ---
  if (generateMedia) {
    prompt += "Crucially, you must also provide creative prompts for AI image generation and concepts for short-form videos (e.g., TikTok, Reels).\n";
    if (settings.insertWatermark) prompt += `For AI image prompts, compose the scene to leave a clean, unobtrusive space for a logo or watermark to be added later.\n`;
    if (settings.generateVerifiableText) prompt += `For AI image prompts that include text, make a best effort to ensure the text is spelled correctly and is clearly legible.\n`;
  } else {
    prompt += "Do not generate AI image prompts or video concepts.\n";
  }

  // --- Platform Targeting ---
  if (settings.targetPlatforms.length > 0) {
    prompt += `Tailor the social media strategy specifically for these platforms: ${settings.targetPlatforms.join(', ')}. Provide distinct strategies for each.\n`;
  }

  prompt += `Return the campaign as a JSON object adhering to the specified schema.`;

  const dynamicSchema = {...responseSchema};
  if (!generateMedia) {
      delete dynamicSchema.properties.aiImagePrompts;
      delete dynamicSchema.properties.aiVideoConcepts;
  }
  if (!settings.generateBacklinks) {
    delete dynamicSchema.properties.backlinkStrategy;
  }
  if (!settings.findTrendingTopics) {
    delete dynamicSchema.properties.trendingTopics;
  }


  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: dynamicSchema,
      },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as CampaignResult;
  } catch (error) {
    console.error("Error generating marketing campaign:", error);
    throw new Error("Failed to generate marketing campaign. The model may have returned an invalid response.");
  }
};

export const generateImageFromPrompt = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: '1:1',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        } else {
            throw new Error("No image was generated.");
        }
    } catch (error) {
        console.error("Error generating image:", error);
        throw new Error("Failed to generate image from prompt.");
    }
};

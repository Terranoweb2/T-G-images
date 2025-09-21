
// FIX: The type `VideosOperation` is not an exported member of '@google/genai'. It has been removed from the import.
import { GoogleGenAI, Modality } from "@google/genai";
import { GenerateContentResponse } from "@google/genai";

if (!process.env.API_KEY) {
  // In a real app, you would want to handle this more gracefully.
  // For this context, we'll alert and assume it's set in the environment.
  alert("API_KEY environment variable not set. Please set it to use Gemini API.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const generateVideo = async (prompt: string, image?: { base64: string; mimeType: string }): Promise<string> => {
  // FIX: The type `VideosOperation` is not available. The type annotation has been removed to allow type inference.
  let operation;
  
  if (image) {
    operation = await ai.models.generateVideos({
      model: 'veo-2.0-generate-001',
      prompt,
      image: {
        imageBytes: image.base64,
        mimeType: image.mimeType,
      },
      config: { numberOfVideos: 1 },
    });
  } else {
    operation = await ai.models.generateVideos({
      model: 'veo-2.0-generate-001',
      prompt,
      config: { numberOfVideos: 1 },
    });
  }

  // Poll for completion
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds between checks
    operation = await ai.operations.getVideosOperation({ operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) {
    throw new Error("Video generation failed or returned no link.");
  }
  
  // In a real browser environment, you would fetch this URL.
  // The response body contains the MP4 bytes.
  // Note: The download link requires the API key to be appended.
  const finalUrl = `${downloadLink}&key=${process.env.API_KEY!}`;

  // Fetching the video and creating a blob URL for client-side use
  const response = await fetch(finalUrl);
  if (!response.ok) {
    throw new Error('Failed to download the generated video.');
  }
  const videoBlob = await response.blob();
  return URL.createObjectURL(videoBlob);
};

export const editImage = async (prompt: string, image: { base64: string; mimeType: string }): Promise<{ newImageBase64: string; newMimeType: string; textResponse: string }> => {
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image-preview',
    contents: {
      parts: [
        { inlineData: { data: image.base64, mimeType: image.mimeType } },
        { text: prompt },
      ],
    },
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });

  let newImageBase64: string | null = null;
  let newMimeType: string | null = null;
  let textResponse = "";

  const candidate = response.candidates?.[0];

  if (candidate?.content?.parts) {
    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        newImageBase64 = part.inlineData.data;
        newMimeType = part.inlineData.mimeType;
      } else if (part.text) {
        textResponse += part.text;
      }
    }
  } else {
    // If no candidates, check for blocking
    const blockReason = response.promptFeedback?.blockReason;
    if (blockReason) {
      throw new Error(`Image editing request was blocked. Reason: ${blockReason}`);
    }
  }

  if (!newImageBase64 || !newMimeType) {
    if (textResponse) {
      // Model responded with text but no image
      throw new Error(`Image editing failed to return a new image. Model response: "${textResponse}"`);
    }
    // No image and no text, and not blocked. This is an unexpected failure.
    throw new Error("Image editing failed to return a new image.");
  }

  return { newImageBase64, newMimeType, textResponse };
};

import { AIAnalysis } from "@/types/VoiceNote";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.EXPO_PUBLIC_GROQ_API_KEY || "",
});

export const transcribeAudio = async (audioUri: string): Promise<string> => {
  try {
    const fileExtension = audioUri.split(".").pop()?.toLowerCase() || "m4a";
    let mimeType = "audio/mp4";

    switch (fileExtension) {
      case "wav":
        mimeType = "audio/wav";
        break;
      case "webm":
        mimeType = "audio/webm";
        break;
      case "mp3":
        mimeType = "audio/mpeg";
        break;
      case "m4a":
      case "mp4":
        mimeType = "audio/mp4";
        break;
      case "ogg":
        mimeType = "audio/ogg";
        break;
      default:
        mimeType = "audio/mp4";
    }

    console.log(`🎵 Sending ${fileExtension.toUpperCase()} file to Whisper...`);

    const formData = new FormData();
    formData.append("file", {
      uri: audioUri,
      type: mimeType,
      name: `audio.${fileExtension}`,
    } as any);
    formData.append("model", "whisper-large-v3");
    formData.append("response_format", "text");
    formData.append("language", "en");

    // Direct fetch to Groq API
    const response = await fetch(`${process.env.EXPO_PUBLIC_GROQ_API_URL}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.EXPO_PUBLIC_GROQ_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.text();

    if (!result || result.trim().length === 0) {
      throw new Error("Empty transcription response");
    }

    console.log(
      "✅ Transcription successful:",
      result.substring(0, 100) + "..."
    );
    return result;
  } catch (error) {
    throw new Error(
      `Error transcribing audio: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

export const extractKeyPoints = async (
  transcription: string
): Promise<AIAnalysis> => {
  try {
    const analysis = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an AI assistant specialized in analyzing voice note transcriptions and converting them into structured summaries.

         Your task is to carefully read the transcription and return a structured JSON object with the following information:
          1. Title – Generate a concise and informative title that summarizes the main topic (max 50 characters).

          2. Key Points – Extract the main ideas, insights, or discussed topics from the content. Use clear, short bullet points.

          3. Actions – Identify all actionable items or next steps mentioned. These should be concrete and clear.

          4. Tags – List relevant tags (keywords or categories) that best describe the content contextually


          Some Instructions:
          * Make sure:

          * The output is readable and helpful.

          * There is no extra explanation or commentary.

          * All fields are present, even if some arrays are empty.



          Respond with JSON in this exact format:
            {
              "title": "Brief descriptive title",
              "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
              "actions": ["Action item 1", "Action item 2"],
              "tags": ["tag1", "tag2"]
            }`,
        },
        {
          role: "user",
          content: `Analyze this transcription and extract key points:
        
        ${transcription}`,
        },
      ],
      model: "llama-3.1-8b-instant",
      response_format: {
        type: "json_object",
      },
    });
    if (!analysis || !analysis.choices || analysis.choices.length === 0) {
      throw new Error("No analysis response received");
    }

    const content = analysis.choices[0].message.content as string;
    const parsed = JSON.parse(content) as AIAnalysis;

    return parsed;
  } catch (error) {
    throw new Error(
      `Error extracting key points: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

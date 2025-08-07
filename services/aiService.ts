import { AIAnalysis } from "@/types/VoiceNote";
import Groq from "groq-sdk";
import { executeCalendarTool } from "./llmCalendarIntegration";

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
    // First, check if the transcription contains calendar-related content
    const calendarResult = await processCalendarRequests(transcription);

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

          ${
            calendarResult.eventsCreated.length > 0
              ? `\n\nNote: ${
                  calendarResult.eventsCreated.length
                } calendar event(s) have been automatically created from this transcription: ${calendarResult.eventsCreated
                  .map((e: any) => e.title)
                  .join(", ")}`
              : ""
          }

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

    // Add calendar events to the analysis result
    if (calendarResult.eventsCreated.length > 0) {
      parsed.calendarEvents = calendarResult.eventsCreated.map((event) => ({
        title: event.title,
        eventId: event.eventId,
        created: true,
      }));
    }

    return parsed;
  } catch (error) {
    throw new Error(
      `Error extracting key points: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

interface CalendarProcessingResult {
  eventsCreated: Array<{ title: string; eventId?: string }>;
  errors: string[];
}


const processCalendarRequests = async (
  transcription: string
): Promise<CalendarProcessingResult> => {
  try {
    console.log("🗓️ Analyzing transcription for calendar events...");

    const calendarAnalysis = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a calendar assistant that identifies when users mention events, meetings, appointments, or scheduled activities in their voice notes.

          Analyze the transcription and identify any calendar events that should be created. Look for:
          - Meetings, appointments, calls
          - Events with specific dates/times
          - Reminders for future activities
          - Scheduled tasks or deadlines

          IMPORTANT: You must return VALID JSON without any comments or additional text.

          If you find calendar events, extract the details and return them in this EXACT JSON format:
          {
            "hasCalendarEvents": true,
            "events": [
              {
                "title": "Event title",
                "date": "today",
                "time": "10:00",
                "durationMinutes": 60,
                "location": "location if mentioned",
                "notes": "additional context"
              }
            ]
          }

          If no calendar events are found, return this EXACT JSON:
          {
            "hasCalendarEvents": false,
            "events": []
          }

          Rules:
          - Only create events for specific, actionable items like meetings, appointments, calls
          - Do NOT create events for tasks like "send email", "call someone", "write report" unless they specify a scheduled time
          - If no specific time is mentioned, use "10:00" as default
          - If no duration is mentioned, use 60 minutes as default
          - Be conservative - only create events for clearly scheduled activities
          - Return ONLY valid JSON, no comments, no explanations
          - Date should be "today", "tomorrow", or "YYYY-MM-DD" format`,
        },
        {
          role: "user",
          content: `Analyze this transcription for calendar events:

          ${transcription}`,
        },
      ],
      model: "llama-3.1-8b-instant",
      response_format: {
        type: "json_object",
      },
      temperature: 0.1, 
    });
    if (!calendarAnalysis.choices?.[0]?.message?.content) {
      return { eventsCreated: [], errors: [] };
    }

    let calendarData;
    try {
      const rawContent = calendarAnalysis.choices[0].message.content;
      console.log("🔍 Raw calendar analysis response:", rawContent);

      const cleanedContent = rawContent
        .replace(/\/\/.*$/gm, "") // Remove single-line comments
        .replace(/\/\*[\s\S]*?\*\//g, "") // Remove multi-line comments
        .replace(/,(\s*[}\]])/g, "$1"); // Remove trailing commas

      calendarData = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("❌ Failed to parse calendar analysis JSON:", parseError);
      console.error(
        "Raw content:",
        calendarAnalysis.choices[0].message.content
      );
    }

    // Validate the calendar data structure
    if (typeof calendarData !== "object" || calendarData === null) {
      console.error("❌ Invalid calendar data structure:", calendarData);
      return { eventsCreated: [], errors: ["Invalid calendar data structure"] };
    }

    if (
      !calendarData.hasOwnProperty("hasCalendarEvents") ||
      !calendarData.hasOwnProperty("events")
    ) {
      console.error(
        "❌ Missing required fields in calendar data:",
        calendarData
      );
      return {
        eventsCreated: [],
        errors: ["Missing required fields in calendar response"],
      };
    }

    if (
      !calendarData.hasCalendarEvents ||
      !Array.isArray(calendarData.events) ||
      calendarData.events.length === 0
    ) {
      console.log("📝 No calendar events detected in transcription");
      return { eventsCreated: [], errors: [] };
    }

    console.log(
      `🎯 Found ${calendarData.events.length} potential calendar event(s)`
    );

    const eventsCreated: Array<{ title: string; eventId?: string }> = [];
    const errors: string[] = [];

    // Process each detected event
    for (const event of calendarData.events) {
      try {
        // Validate event structure
        if (!event || typeof event !== "object" || !event.title) {
          console.warn("⚠️ Skipping invalid event:", event);
          errors.push("Skipped invalid event structure");
          continue;
        }

        console.log(`📅 Creating calendar event: ${event.title}`);

        const result = await executeCalendarTool("create_quick_event", {
          title: event.title,
          date: event.date || "tomorrow",
          time: event.time || "10:00",
          durationMinutes: event.durationMinutes || 60,
          location: event.location,
          notes: event.notes
            ? `From voice note: ${event.notes}`
            : "Created from voice note",
        });

        if (result.success) {
          eventsCreated.push({
            title: event.title,
            eventId: (result as any).eventId,
          });
          console.log(
            `✅ Calendar event created: ${event.title} (ID: ${
              (result as any).eventId
            })`
          );
        } else {
          errors.push(
            `Failed to create event "${event.title}": ${result.error}`
          );
          console.error(`❌ Failed to create calendar event: ${result.error}`);
        }
      } catch (error) {
        const errorMsg = `Error creating event "${event.title}": ${
          error instanceof Error ? error.message : String(error)
        }`;
        errors.push(errorMsg);
        console.error("❌", errorMsg);
      }
    }

    return { eventsCreated, errors };
  } catch (error) {
    console.error("❌ Error processing calendar requests:", error);

    // If it's a JSON validation error, provide more specific feedback
    if (
      error instanceof Error &&
      error.message.includes("json_validate_failed")
    ) {
      console.log(
        "🔄 Calendar analysis failed due to invalid JSON, continuing without calendar events"
      );
      return { eventsCreated: [], errors: [] }; // Don't treat this as a critical error
    }

    return {
      eventsCreated: [],
      errors: [
        `Calendar processing error: ${
          error instanceof Error ? error.message : String(error)
        }`,
      ],
    };
  }
};

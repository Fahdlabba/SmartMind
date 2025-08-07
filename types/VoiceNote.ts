export interface VoiceNote {
  id: string;
  title: string;
  audioUri: string;
  transcription: string;
  keyPoints: string[];
  actions: string[];
  tags: string[];
  createdAt: Date;
  duration: number; // in seconds
}

export interface AIAnalysis {
  title?: string;
  keyPoints: string[];
  actions: string[];
  tags: string[];
  calendarEvents?: Array<{
    title: string;
    eventId?: string;
    created: boolean;
  }>;
}

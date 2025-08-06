# # SmartMind Voice Notes App

A React Native voice note taking application built with Expo that allows users to record audio, automatically transcribe it, and extract key insights using AI.

## Features

- **Voice Recording**: Record high-quality audio notes with a simple tap
- **Auto Transcription**: Automatically transcribe voice recordings to text (using dummy AI service)
- **Smart Analysis**: Extract key points, action items, and tags from transcriptions
- **Search & Filter**: Search through notes and filter by tags
- **Audio Playback**: Play back recorded audio notes
- **Data Persistence**: All notes are saved locally using AsyncStorage

## Screenshots

The app consists of two main tabs:

### Record Tab (Home)
- Large record button for easy voice recording
- Recording status indicator
- Preview of recent notes
- Processing indicator during AI analysis

### Explore Tab
- Search functionality across all notes
- Tag-based filtering
- Full note management (view, delete)
- Complete transcriptions and extracted insights

## Installation

1. Make sure you have Node.js and npm installed
2. Install Expo CLI globally:
   ```bash
   npm install -g @expo/cli
   ```

3. Clone the repository and install dependencies:
   ```bash
   cd SmartMind
   npm install
   ```

4. Start the development server:
   ```bash
   npx expo start
   ```

5. Use Expo Go app on your mobile device to scan the QR code, or press 'w' to open in web browser

## Dependencies

- **expo-av**: Audio recording and playback functionality
- **expo-file-system**: File management for audio files
- **@react-native-async-storage/async-storage**: Local data persistence
- **@expo/vector-icons**: Icons for the UI

## AI Service Integration

Currently, the app uses dummy AI services for demonstration purposes. To integrate with real AI services:

1. **Transcription Service**: Replace the `transcribeAudio` function in `services/aiService.ts` with your preferred speech-to-text API (e.g., OpenAI Whisper, Google Speech-to-Text, AWS Transcribe)

2. **Analysis Service**: Replace the `extractKeyPoints` function with your preferred text analysis API (e.g., OpenAI GPT, Google Cloud Natural Language API)

Example integration with OpenAI:

```typescript
// services/aiService.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: 'your-api-key',
});

export const transcribeAudio = async (audioUri: string): Promise<string> => {
  const audioFile = await FileSystem.readAsStringAsync(audioUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  
  const response = await openai.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-1',
  });
  
  return response.text;
};

export const extractKeyPoints = async (transcription: string): Promise<AIAnalysis> => {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'Extract key points, action items, and tags from the following transcription. Return in JSON format.',
      },
      {
        role: 'user',
        content: transcription,
      },
    ],
  });
  
  return JSON.parse(response.choices[0].message.content);
};
```

## Data Structure

The app uses the following data structure for voice notes:

```typescript
interface VoiceNote {
  id: string;
  title: string;
  audioUri: string;
  transcription: string;
  keyPoints: string[];
  actions: string[];
  tags: string[];
  createdAt: Date;
  duration: number;
}
```

## Permissions

The app requires microphone permission to record audio. This is automatically requested when the user first attempts to record.

## File Storage

- Audio files are stored in the app's document directory
- Note metadata is stored in AsyncStorage
- All data persists between app sessions

## Future Enhancements

- [ ] Cloud synchronization
- [ ] Note sharing functionality
- [ ] Advanced search with filters
- [ ] Export notes to different formats
- [ ] Voice note categories/folders
- [ ] Reminder system for action items
- [ ] Integration with calendar apps
- [ ] Custom AI prompt configurations
- [ ] Audio quality settings
- [ ] Batch operations on notes

## Troubleshooting

### Common Issues

1. **Recording not working**: Ensure microphone permissions are granted
2. **Audio playback issues**: Check device audio settings and ensure files exist
3. **Processing delays**: The AI processing simulation includes deliberate delays for demonstration

### Development Issues

1. **Module resolution errors**: Ensure all dependencies are installed with `npm install`
2. **Metro bundler issues**: Clear cache with `npx expo start -c`
3. **Platform-specific issues**: Test on both iOS and Android simulators

## License

This project is open source and available under the MIT License.

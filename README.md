# # SmartMind Voice Notes App

A React Native voice note-taking application built with Expo that allows users to record audio, automatically transcribe it, and extract key insights using AI.

## Features

- **Voice Recording**: Record high-quality audio notes with a simple tap
- **Auto Transcription**: Automatically transcribe voice recordings to text (using dummy AI service)
- **Smart Analysis**: Extract key points, action items, and tags from transcriptions
- **Search & Filter**: Search through notes and filter by tags
- **Audio Playback**: Play back recorded audio notes
- **Data Persistence**: All notes are saved locally using AsyncStorage


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


## AI Service Integration

1. **Transcription Service**

2. **Analysis Service**

## Permissions

The app requires microphone permission to record audio. This is automatically requested when the user first attempts to record.

## License

This project is open source and available under the MIT License.

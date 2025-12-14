# Vocal Training App

A Next.js React application that helps users develop their singing voice by detecting their vocal range and practicing pitch matching.

## Features

- **Vocal Range Detection**: Detect your lowest and highest comfortable notes (A1-F6 range)
- **Pitch Matching Game**: Listen to notes within your range and practice matching them
- **Scoring System**: Earn points based on how long you stay on pitch
- **Adjustable Note Duration**: Choose between short (3s), medium (6s), or long (9s) note durations
- **Session Management**: Uses localStorage to remember your vocal range and session

## Getting Started

First, install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the app.

**Note**: You'll need to allow microphone access when prompted for the app to work properly.

## How to Use

1. **Detect Your Vocal Range**:
   - Click "Detect Low Note" and sing your lowest comfortable note. Hold it steady until detected.
   - Click "Detect High Note" and sing your highest comfortable note. Hold it steady until detected.

2. **Play the Game**:
   - Once your range is detected, click "Play Game"
   - Choose your preferred note duration (short, medium, or long)
   - Click "Play Note" to hear a random note within your range
   - Click "Start Singing" after the note plays and try to match the pitch
   - Your score increases based on how long you stay on pitch
   - Click "Next Round" to continue to the next note

## Technical Details

- Built with Next.js 16, React 19, and TypeScript
- Uses Web Audio API for microphone input and audio playback
- Pitch detection using autocorrelation algorithm
- Note frequencies calculated using standard musical tuning
- Tailwind CSS for styling

## Browser Compatibility

Requires a modern browser with Web Audio API support (Chrome, Firefox, Safari, Edge).

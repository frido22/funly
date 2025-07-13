# Funly - Jokester AI

A desktop application that transforms your screen into comedy gold! Take screenshots and get absolutely hilarious AI-generated jokes about anything you see.

## What We Do Now

Funly (formerly Free Cluely) is now **Jokester AI** - your personal comedy wingman that:
- Takes screenshots of your screen
- Analyzes images, audio, and content using Google's Gemini AI
- Generates three absolutely hilarious, context-aware jokes
- Delivers comedy gold with wordplay, unexpected twists, and brilliant observations
- Creates an always-on-top transparent overlay for instant laughs

Built at **Sundai** as a fork of the original cheating assistant, we've transformed it into a comedy powerhouse that makes any content funnier!

## Original Repository

This project is forked from the original "Interview Coder" repository. We've completely reimagined its purpose from a coding interview assistant to a comedy generation tool, maintaining the robust screenshot and AI analysis infrastructure while pivoting to pure entertainment. 

## Quick Start Guide

### Prerequisites
- Make sure you have Node.js installed on your computer
- Git installed on your computer
- A Gemini API key (get it from [Google AI Studio](https://makersuite.google.com/app/apikey))

### Installation Steps

1. Clone the repository:
```bash
git clone [repository-url]
cd free-cluely
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Create a file named `.env` in the root folder
   - Add your Gemini API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```
   - Save the file

### Running the App

#### Method 1: Development Mode (Recommended for first run)
1. Open a terminal and run:
```bash
npm run dev -- --port 5180
```

2. Open another terminal in the same folder and run:
```bash
NODE_ENV=development npm run electron:dev
```

#### Method 2: Production Mode
```bash
npm run build
```
The built app will be in the `release` folder.

### Important Notes

1. **Closing the App**: 
   - Press `Cmd + Q` (Mac) or `Ctrl + Q` (Windows/Linux) to quit
   - Or use Activity Monitor/Task Manager to close `Interview Coder`
   - The X button currently doesn't work (known issue)

2. **How It Works**:
   - Take a screenshot using `Cmd/Ctrl + H`
   - Press `Cmd/Enter` to generate three hilarious jokes
   - The transparent overlay stays on top for instant comedy access
   - Works with any content: websites, code, documents, images, etc.

3. **If the app doesn't start**:
   - Make sure no other app is using port 5180
   - Try killing existing processes:
     ```bash
     # Find processes using port 5180
     lsof -i :5180
     # Kill them (replace [PID] with the process ID)
     kill [PID]
     ```

4. **Keyboard Shortcuts**:
   - `Cmd/Ctrl + B`: Toggle window visibility
   - `Cmd/Ctrl + H`: Take screenshot
   - `Cmd/Enter`: Generate jokes from screenshot
   - `Cmd/Ctrl + Arrow Keys`: Move window

### Troubleshooting

If you see errors:
1. Delete the `node_modules` folder
2. Delete `package-lock.json`
3. Run `npm install` again
4. Try running the app again using Method 1

## Comedy Features

- **Context-Aware Humor**: Jokes reference specific elements visible in your screenshots
- **Multiple Formats**: Works with images, audio files, and live screen content
- **Stand-up Quality**: AI trained to deliver memorable, quotable one-liners
- **Instant Access**: Transparent overlay for comedy on demand
- **Smart Analysis**: Powered by Google's Gemini 2.0-flash for intelligent content understanding

## Technical Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Desktop**: Electron 33 with Node.js backend  
- **AI**: Google Gemini 2.0-flash for content analysis
- **Features**: Screenshot capture, audio processing, real-time overlays

## Contribution

Built at **Sundai** for comedy lovers everywhere! 

We welcome contributions to make Funly even funnier:
- Submit PRs for new comedy features
- Enhance joke generation algorithms  
- Improve UI/UX for better comedy delivery
- Add new content analysis capabilities

For custom comedy solutions or integrations, reach out to discuss collaboration opportunities! 

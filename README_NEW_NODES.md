# N8N Web Automation Tools - New Nodes

This package provides custom n8n nodes for web automation tasks, particularly focused on social media automation and AI content generation.

## New Nodes Added

### 1. Post Video TikTok Node

**File**: `nodes/PostVideoTiktokNode/PostVideoTiktokNode.node.ts`

Automates posting videos to TikTok using TikTok Studio.

**Features:**

- Upload video files to TikTok
- Set video description
- Configure audience settings (Everyone, Friends, OnlyYou)
- Toggle various options:
  - AI Generated content
  - Music copyright check
  - Content check lite
  - Comments, Duets, Stitch settings
- Cross-platform support (Windows, MacOS, Linux)

**Parameters:**

- `videoPath`: Path to the video file
- `description`: Video description
- `audience`: Target audience
- `showBrowser`: Show browser during execution
- `isCloseBrowser`: Close browser after completion
- `isAiGenerated`: Mark as AI generated content
- `runMusicCopyrightCheck`: Run music copyright check
- `runContentCheckLite`: Run content check lite
- `isCommentOn`: Enable comments
- `isDuetOn`: Enable duets
- `isStitchOn`: Enable stitch
- `os`: Operating system

### 2. Generate Audio AI Studio Node

**File**: `nodes/GenerateAudioAistudioNode/GenerateAudioAistudioNode.node.ts`

Generates audio using Google AI Studio's text-to-speech capabilities.

**Features:**

- Generate audio from text prompts
- Choose from 30 different voices
- Set style instructions for voice tone
- Cross-platform browser automation

**Parameters:**

- `styleInstruction`: Voice style instructions
- `voice`: Voice selection (Zephyr, Puck, Charon, etc.)
- `prompt`: Text to convert to audio
- `outputPath`: Output file path
- `showBrowser`: Show browser during execution
- `isCloseBrowser`: Close browser after completion
- `os`: Operating system

### 3. Generate Image ChatGPT Node

**File**: `nodes/GenerateImageChatGptNode/GenerateImageChatGptNode.node.ts`

Generates images using ChatGPT's DALL-E integration.

**Features:**

- Generate images from text descriptions
- Download generated images
- Retry mechanism for reliability
- Binary output support

**Parameters:**

- `prompt`: Image description
- `outputPath`: Output file path
- `showBrowser`: Show browser during execution
- `isCloseBrowser`: Close browser after completion
- `os`: Operating system

### 4. Post Reels Facebook Node

**File**: `nodes/PostReelsFacebookNode/PostReelsFacebookNode.node.ts`

Automates posting reels to Facebook.

**Features:**

- Upload video files as Facebook reels
- Set reels description
- Support for multiple Facebook pages
- Cross-platform browser automation

**Parameters:**

- `videoPath`: Path to the video file
- `description`: Reels description
- `page`: Facebook page name (optional)
- `showBrowser`: Show browser during execution
- `isCloseBrowser`: Close browser after completion
- `os`: Operating system

## Installation

1. Install dependencies:

```bash
npm install
```

2. Build the package:

```bash
npm run build
```

3. Install in n8n:

```bash
npm install -g n8n
n8n-node-dev install
```

## Usage

### TikTok Video Posting

```javascript
// Example workflow
{
  "nodes": [
    {
      "name": "Post TikTok Video",
      "type": "postVideoTiktokNode",
      "parameters": {
        "videoPath": "/path/to/video.mp4",
        "description": "Amazing video content!",
        "audience": "Everyone",
        "showBrowser": true
      }
    }
  ]
}
```

### Audio Generation

```javascript
// Example workflow
{
  "nodes": [
    {
      "name": "Generate Audio",
      "type": "generateAudioAistudioNode",
      "parameters": {
        "styleInstruction": "Speak in a calm and professional tone",
        "voice": "Zephyr",
        "prompt": "Welcome to our podcast episode",
        "outputPath": "./output/audio.mp3"
      }
    }
  ]
}
```

### Image Generation

```javascript
// Example workflow
{
  "nodes": [
    {
      "name": "Generate Image",
      "type": "generateImageChatGptNode",
      "parameters": {
        "prompt": "A beautiful sunset over mountains",
        "outputPath": "./output/image.png"
      }
    }
  ]
}
```

### Facebook Reels Posting

```javascript
// Example workflow
{
  "nodes": [
    {
      "name": "Post Facebook Reels",
      "type": "postReelsFacebookNode",
      "parameters": {
        "videoPath": "/path/to/reels.mp4",
        "description": "Check out this amazing content!",
        "page": "My Business Page"
      }
    }
  ]
}
```

## Requirements

- Node.js >= 20.15
- Google Chrome browser
- Valid TikTok, Facebook, ChatGPT, and Google AI Studio accounts
- n8n workflow automation platform

## Browser Configuration

All nodes use Playwright for browser automation and support:

- **Windows**: Chrome at `C:\Program Files\Google\Chrome\Application\chrome.exe`
- **MacOS**: Chrome at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
- **Linux**: Chrome installation required

## Notes

- Set `showBrowser: true` for first-time login to platforms
- Ensure video files exist and are accessible
- Some operations may require manual intervention for authentication
- Respect platform terms of service and rate limits

## License

MIT License - see LICENSE file for details.

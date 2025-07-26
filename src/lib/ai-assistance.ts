// AI Assistance service for handling voice commands and app interactions

export interface AppCommand {
  appName: string;
  url?: string;
  action: 'open' | 'play';
}

export interface StructuredResponse {
  type: 'app' | 'youtube' | 'normal';
  app?: string;
  url?: string;
  content?: string;
}

// Available apps mapping
const APPS_MAP: Record<string, AppCommand> = {
  'netflix': { appName: 'Netflix', url: 'https://netflix.com', action: 'open' },
  'youtube': { appName: 'YouTube', url: 'https://youtube.com', action: 'open' },
  'plex': { appName: 'Plex', url: 'https://plex.tv', action: 'open' },
  'disney': { appName: 'Disney+', url: 'https://disneyplus.com', action: 'open' },
  'disney+': { appName: 'Disney+', url: 'https://disneyplus.com', action: 'open' },
  'disneyplus': { appName: 'Disney+', url: 'https://disneyplus.com', action: 'open' },
  'tubi': { appName: 'Tubi', url: 'https://tubi.tv', action: 'open' },
  'hbo': { appName: 'HBO Max', url: 'https://max.com', action: 'open' },
  'hbo max': { appName: 'HBO Max', url: 'https://max.com', action: 'open' },
  'max': { appName: 'HBO Max', url: 'https://max.com', action: 'open' }
};

// Pre-Gemini: Check if user wants to open an app directly
export function checkDirectAppCommand(transcription: string): AppCommand | null {
  const text = transcription.toLowerCase().trim();
  
  // Common patterns for opening apps
  const openPatterns = [
    /^open\s+(.+)$/,
    /^launch\s+(.+)$/,
    /^start\s+(.+)$/,
    /^go\s+to\s+(.+)$/,
    /^show\s+(.+)$/
  ];

  for (const pattern of openPatterns) {
    const match = text.match(pattern);
    if (match) {
      const appName = match[1].trim();
      const app = APPS_MAP[appName];
      if (app) {
        return app;
      }
    }
  }

  return null;
}

// Enhanced Gemini prompt for structured responses
export function createEnhancedGeminiPrompt(userInput: string): string {
  return `You are a helpful AI assistant for a smart TV interface. 

IMPORTANT: If the user asks to play, watch, or open specific content on YouTube (like channels, videos, or creators), respond with a structured token in this EXACT format:
{youtube:"https://youtube.com/results?search_query=SEARCH_TERM"}

Replace SEARCH_TERM with the URL-encoded search term. For example:
- "Play Linus Tech Tips" → {youtube:"https://youtube.com/results?search_query=Linus+Tech+Tips"}
- "Watch PewDiePie videos" → {youtube:"https://youtube.com/results?search_query=PewDiePie"}
- "Show me cooking tutorials" → {youtube:"https://youtube.com/results?search_query=cooking+tutorials"}

For all other requests, respond normally in a conversational manner.

User input: "${userInput}"`;
}

// Post-Gemini: Parse structured responses
export function parseStructuredResponse(response: string): StructuredResponse {
  // Check for YouTube token pattern
  const youtubeMatch = response.match(/\{youtube:"([^"]+)"\}/);
  if (youtubeMatch) {
    return {
      type: 'youtube',
      url: youtubeMatch[1],
      content: response
    };
  }

  // Check for other app tokens (future expansion)
  const appMatch = response.match(/\{([^:]+):"([^"]+)"\}/);
  if (appMatch) {
    return {
      type: 'app',
      app: appMatch[1],
      url: appMatch[2],
      content: response
    };
  }

  // Normal conversational response
  return {
    type: 'normal',
    content: response
  };
}

// Open app or URL
export function openApp(command: AppCommand, customUrl?: string): void {
  const url = customUrl || command.url;
  if (url) {
    console.log(`Opening ${command.appName} at ${url}`);
    window.open(url, '_blank');
  }
}

// Generate vocal response for app opening
export function generateAppOpeningResponse(appName: string, isPlaying: boolean = false): string {
  if (isPlaying) {
    return `Opening ${appName} and playing your content now.`;
  }
  return `Opening ${appName} now.`;
}
// API service utilities for Replicate and Gemini AI

// CORS Note: For Electron builds, you can disable web security to bypass CORS:
// In your Electron main process, set: webSecurity: false in BrowserWindow options
// Or use: --disable-web-security flag when launching Electron

// Web Speech API type declarations
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface ReplicateSettings {
  apiKey: string;
  model: string;
}

export interface GeminiSettings {
  apiKey: string;
  model: string;
}

export interface TranscriptionResult {
  transcription: string;
  language?: string;
}

export interface AIResponse {
  response: string;
}

// Replicate API Service for Whisper transcription
export class ReplicateService {
  private apiKey: string;
  private model: string;

  constructor(settings: ReplicateSettings) {
    this.apiKey = settings.apiKey;
    this.model = settings.model;
  }

  async transcribeAudio(audioBlob: Blob): Promise<TranscriptionResult> {
    try {
      console.log('Starting Replicate API transcription via backend...');
      
      // Create FormData to send audio file to backend
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');
      
      // Call local Flask backend instead of Replicate API directly
      const response = await fetch('http://localhost:5100/transcribe', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Backend transcription request failed:', response.status, errorData);
        throw new Error(`Backend transcription failed: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();
      console.log('Backend transcription completed successfully:', result);
      
      return {
        transcription: result.transcription,
        language: result.language
      };
      
    } catch (error) {
      console.error('Replicate transcription error:', error);
      throw error;
    }
  }

}

// Gemini AI Service
export class GeminiService {
  private apiKey: string;
  private model: string;

  constructor(settings: GeminiSettings) {
    this.apiKey = settings.apiKey;
    this.model = settings.model;
  }

  async generateResponse(transcription: string): Promise<AIResponse> {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a helpful AI assistant. Please respond to the following user input in a natural and helpful way. If the user spoke in a language other than English, please respond in the same language. User input: "${transcription}"`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.candidates || result.candidates.length === 0) {
      throw new Error('No response generated from Gemini AI');
    }

    const responseText = result.candidates[0].content?.parts?.[0]?.text;
    if (!responseText) {
      throw new Error('Invalid response format from Gemini AI');
    }

    return {
      response: responseText
    };
  }
}

// Web Speech API Service (Browser-based transcription)
export class WebSpeechService {
  private recognition: any = null;

  constructor() {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.setupRecognition();
    }
  }

  private setupRecognition() {
    if (!this.recognition) return;
    
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;
    this.recognition.lang = 'auto'; // Will use browser's default language
  }

  async transcribeAudioBlob(audioBlob: Blob): Promise<TranscriptionResult> {
    if (!this.recognition) {
      throw new Error('Speech Recognition not supported in this browser');
    }

    // For Web Speech API, we need to play the audio while listening
    // This is a workaround since we can't directly process audio blobs
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech Recognition not available'));
        return;
      }

      // Create audio element to play the recorded audio
      const audio = new Audio();
      const audioURL = URL.createObjectURL(audioBlob);
      audio.src = audioURL;

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const confidence = event.results[0][0].confidence;
        
        URL.revokeObjectURL(audioURL);
        resolve({
          transcription: transcript,
          language: this.recognition?.lang || 'en-US'
        });
      };

      this.recognition.onerror = (event) => {
        URL.revokeObjectURL(audioURL);
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      this.recognition.onend = () => {
        URL.revokeObjectURL(audioURL);
      };

      // Start recognition and play audio
      try {
        this.recognition.start();
        audio.play().catch(e => {
          this.recognition?.stop();
          reject(new Error('Failed to play audio for transcription'));
        });
      } catch (error) {
        reject(new Error('Failed to start speech recognition'));
      }
    });
  }

  // Live transcription method for real-time recording
  async transcribeLive(): Promise<TranscriptionResult> {
    if (!this.recognition) {
      throw new Error('Speech Recognition not supported in this browser');
    }

    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech Recognition not available'));
        return;
      }

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        resolve({
          transcription: transcript,
          language: this.recognition?.lang || 'en-US'
        });
      };

      this.recognition.onerror = (event) => {
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      this.recognition.start();
    });
  }

  isSupported(): boolean {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }

  stop() {
    if (this.recognition) {
      this.recognition.stop();
    }
  }
}

// Text-to-Speech Service using Edge TTS backend
export class TextToSpeechService {
  private currentAudio: HTMLAudioElement | null = null;

  constructor() {}

  async speak(text: string, language: string = 'English'): Promise<void> {
    try {
      console.log(`Generating TTS for: "${text}" in language: ${language}`);
      
      // Stop any currently playing audio
      this.stop();

      // Map common language codes to our supported languages
      const languageMap: { [key: string]: string } = {
        'en': 'English',
        'en-US': 'English',
        'hi': 'Hindi',
        'hi-IN': 'Hindi',
        'ta': 'Tamil',
        'ta-IN': 'Tamil',
        'te': 'Telugu',
        'te-IN': 'Telugu',
        'kn': 'Kannada',
        'kn-IN': 'Kannada',
        'ml': 'Malayalam',
        'ml-IN': 'Malayalam',
        'mr': 'Marathi',
        'mr-IN': 'Marathi',
        'gu': 'Gujarati',
        'gu-IN': 'Gujarati',
        'bn': 'Bengali',
        'bn-IN': 'Bengali',
        'ur': 'Urdu',
        'ur-IN': 'Urdu'
      };

      const mappedLanguage = languageMap[language] || language || 'English';

      // Call backend TTS endpoint
      const response = await fetch('http://localhost:5100/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          language: mappedLanguage
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`TTS failed: ${errorData.error || response.statusText}`);
      }

      // Get the audio blob
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Play the audio
      return new Promise((resolve, reject) => {
        this.currentAudio = new Audio(audioUrl);
        
        this.currentAudio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          this.currentAudio = null;
          resolve();
        };
        
        this.currentAudio.onerror = (event) => {
          URL.revokeObjectURL(audioUrl);
          this.currentAudio = null;
          reject(new Error('Audio playback failed'));
        };
        
        this.currentAudio.play().catch(error => {
          URL.revokeObjectURL(audioUrl);
          this.currentAudio = null;
          reject(new Error(`Audio play failed: ${error.message}`));
        });
      });

    } catch (error) {
      console.error('TTS error:', error);
      throw error;
    }
  }

  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
  }

  isSupported(): boolean {
    // Edge TTS via backend is always supported
    return true;
  }
}

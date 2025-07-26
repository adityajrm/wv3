import { useState, useCallback, useEffect } from "react";
import { TVNavigation } from "@/components/tv-navigation";
import { AIOverlay } from "@/components/ai-overlay";
import { HeroCarousel } from "@/components/hero-carousel";
import { AppGrid } from "@/components/app-grid";
import { ContentRow } from "@/components/content-row";
import { ReplicateService, GeminiService, TextToSpeechService, WebSpeechService } from "@/lib/api-services";
import { loadSettings, validateSettings } from "@/lib/settings";
import { useKeyboardNavigation } from "@/hooks/use-keyboard-nav";
import { 
  checkDirectAppCommand, 
  createEnhancedGeminiPrompt, 
  parseStructuredResponse, 
  openApp, 
  generateAppOpeningResponse 
} from "@/lib/ai-assistance";
// Removed toast notifications for clean TV interface

const Index = () => {
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTranscription, setCurrentTranscription] = useState<string>("");
  const [currentAIResponse, setCurrentAIResponse] = useState<string>("");
  const [currentSection, setCurrentSection] = useState(0); // 0: nav, 1: carousel, 2: apps, 3: recommended
  const [navFocused, setNavFocused] = useState(false);
  const [carouselFocused, setCarouselFocused] = useState(false);
  const [appsFocused, setAppsFocused] = useState(false);
  const [recommendedFocused, setRecommendedFocused] = useState(false);

  const settings = loadSettings();
  const settingsValid = validateSettings(settings).length === 0;
  const ttsService = new TextToSpeechService();

  // Global keyboard navigation for section switching
  useKeyboardNavigation({
    onArrowDown: () => {
      if (currentSection < 3) {
        setCurrentSection(prev => prev + 1);
        // Reset focus states
        setNavFocused(false);
        setCarouselFocused(false);
        setAppsFocused(false);
        setRecommendedFocused(false);
      }
    },
    onArrowUp: () => {
      if (currentSection > 0) {
        setCurrentSection(prev => prev - 1);
        // Reset focus states
        setNavFocused(false);
        setCarouselFocused(false);
        setAppsFocused(false);
        setRecommendedFocused(false);
      }
    },
    // Disable when AI overlay is open to prevent background navigation
    disabled: isAIOpen,
  });

  // Effect to manage focus based on current section
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentSection === 0) {
        // Focus navigation
        setNavFocused(true);
        setCarouselFocused(false);
        setAppsFocused(false);
        setRecommendedFocused(false);
      } else if (currentSection === 1) {
        // Focus carousel
        setNavFocused(false);
        setCarouselFocused(true);
        setAppsFocused(false);
        setRecommendedFocused(false);
      } else if (currentSection === 2) {
        // Focus apps
        setNavFocused(false);
        setCarouselFocused(false);
        setAppsFocused(true);
        setRecommendedFocused(false);
      } else if (currentSection === 3) {
        // Focus recommended
        setNavFocused(false);
        setCarouselFocused(false);
        setAppsFocused(false);
        setRecommendedFocused(true);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [currentSection]);

  const addLog = useCallback((step: string, message: string, type: "info" | "success" | "error" | "warning" = "info", duration?: number) => {
    // For TV interface, we'll just log to console instead of showing in UI
    console.log(`[${step}] ${message}`, { type, duration });
  }, []);

  const handleRecordingComplete = async (audioBlob: Blob) => {
    if (!settingsValid) {
      addLog("Error", "API configuration error", "error");
      return;
    }

    setIsProcessing(true);
    setCurrentTranscription("");
    setCurrentAIResponse("");
    
    try {
      addLog("Recording", "Audio recording completed", "success");
      
      // Step 1: Transcribe audio with fallback to Web Speech API
      let transcriptionResult;
      
      try {
        addLog("Transcription", "Attempting Replicate API transcription...", "info");
        const replicateService = new ReplicateService({
          apiKey: settings.replicateApiKey,
          model: settings.replicateModel
        });
        transcriptionResult = await replicateService.transcribeAudio(audioBlob);
      } catch (replicateError) {
        console.error("Replicate API transcription failed:", replicateError);
        addLog("Transcription", "Falling back to Web Speech API...", "warning");
        
        const webSpeechService = new WebSpeechService();
        if (!webSpeechService.isSupported()) {
          throw new Error("Neither Replicate API nor Web Speech API are available");
        }
        
        try {
          transcriptionResult = await webSpeechService.transcribeAudioBlob(audioBlob);
        } catch (webSpeechError) {
          throw webSpeechError;
        }
      }
      
      addLog("Transcription", "Audio transcribed successfully", "success");
      setCurrentTranscription(transcriptionResult.transcription);

      if (!transcriptionResult.transcription.trim()) {
        addLog("Warning", "No speech detected. Please try again.", "warning");
        return;
      }

      // Pre-Gemini Logic: Check for direct app commands
      const directAppCommand = checkDirectAppCommand(transcriptionResult.transcription);
      if (directAppCommand) {
        addLog("Direct Command", `Detected direct app command: ${directAppCommand.appName}`, "info");
        
        // Generate and play immediate response
        const immediateResponse = generateAppOpeningResponse(directAppCommand.appName);
        setCurrentAIResponse(immediateResponse);
        
        // Play vocal response and open app simultaneously
        addLog("Playback", "Playing immediate response...", "info");
        setIsPlaying(true);
        
        // Start TTS and app opening in parallel
        const ttsPromise = ttsService.speak(immediateResponse);
        openApp(directAppCommand);
        
        await ttsPromise;
        addLog("Success", `${directAppCommand.appName} opened successfully!`, "success");
        return;
      }

      // Step 2: Generate AI response with Gemini (enhanced prompt)
      addLog("AI Processing", "Sending transcription to Gemini AI...", "info");
      
      const geminiService = new GeminiService({
        apiKey: settings.geminiApiKey,
        model: settings.geminiModel
      });
      
      // Use enhanced prompt for structured responses
      const enhancedPrompt = createEnhancedGeminiPrompt(transcriptionResult.transcription);
      const aiResult = await geminiService.generateResponse(enhancedPrompt);
      addLog("AI Processing", "AI response generated successfully", "success");
      
      // Post-Gemini Logic: Parse for structured responses
      const structuredResponse = parseStructuredResponse(aiResult.response);
      
      if (structuredResponse.type === 'youtube') {
        addLog("Structured Command", "Detected YouTube play command", "info");
        
        // Generate and set response for YouTube opening
        const youtubeResponse = generateAppOpeningResponse('YouTube', true);
        setCurrentAIResponse(youtubeResponse);
        
        // Play vocal response and open YouTube with specific content
        addLog("Playback", "Playing YouTube response...", "info");
        setIsPlaying(true);
        
        // Start TTS and YouTube opening in parallel
        const ttsPromise = ttsService.speak(youtubeResponse);
        if (structuredResponse.url) {
          openApp({ appName: 'YouTube', action: 'play' }, structuredResponse.url);
        }
        
        await ttsPromise;
        addLog("Success", "YouTube content opened successfully!", "success");
        return;
      }
      
      // Normal conversational response
      setCurrentAIResponse(aiResult.response);

      // Step 3: Play back the response (only output, not input)
      addLog("Playback", "Starting text-to-speech playback...", "info");
      setIsPlaying(true);
      await ttsService.speak(aiResult.response);
      addLog("Playback", "Playback completed", "success");
      addLog("Success", "Conversation completed successfully!", "success");

    } catch (error) {
      console.error("Processing error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      addLog("Error", `Process failed: ${errorMessage}`, "error");
    } finally {
      setIsProcessing(false);
      setIsPlaying(false);
    }
  };



  return (
    <div className="min-h-screen bg-background">
      <TVNavigation 
        onAIClick={() => setIsAIOpen(true)} 
        onFocusChange={setNavFocused}
        isFocused={currentSection === 0}
      />
      
      <div className="px-8 py-6 space-y-8">
        {/* Hero Carousel */}
        <HeroCarousel 
          isFocused={currentSection === 1}
          onFocusChange={setCarouselFocused}
        />
        
        {/* App Grid */}
        <AppGrid 
          isFocused={currentSection === 2}
          onFocusChange={setAppsFocused}
        />
        
        {/* Content Rows */}
        <ContentRow 
          title="Recommended Movies" 
          isFocused={currentSection === 3}
          onFocusChange={setRecommendedFocused}
        />
      </div>

      {/* AI Overlay */}
      <AIOverlay
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        onRecordingComplete={handleRecordingComplete}
        isProcessing={isProcessing}
        transcription={currentTranscription}
        aiResponse={currentAIResponse}
      />
    </div>
  );
};

export default Index;

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, X, Brain, RotateCcw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useKeyboardNavigation } from "@/hooks/use-keyboard-nav";
import { GeminiLiveAudio } from "@/lib/gemini-live-audio";

interface AIOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIOverlay = ({ 
  isOpen, 
  onClose
}: AIOverlayProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState("Ready to speak");
  const [error, setError] = useState("");
  const geminiLiveRef = useRef<GeminiLiveAudio | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const startRecording = async () => {
    if (!geminiLiveRef.current || isRecording) return;
    
    setError("");
    await geminiLiveRef.current.startRecording();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (!geminiLiveRef.current || !isRecording) return;
    
    geminiLiveRef.current.stopRecording();
    setIsRecording(false);
  };

  const handleClose = () => {
    // Ensure full disconnection when closing overlay
    if (geminiLiveRef.current) {
      geminiLiveRef.current.destroy();
      geminiLiveRef.current = null;
      setIsRecording(false);
      setStatus("Ready to speak");
      setError("");
    }
    onClose();
  };

  const resetSession = () => {
    if (!geminiLiveRef.current) return;
    
    geminiLiveRef.current.reset();
    setIsRecording(false);
    setError("");
  };

  // Initialize Gemini Live Audio when overlay opens
  useEffect(() => {
    if (isOpen && !geminiLiveRef.current) {
      geminiLiveRef.current = new GeminiLiveAudio();
      geminiLiveRef.current.onStatusChange = setStatus;
      geminiLiveRef.current.onError = setError;
    }
    
    return () => {
      if (!isOpen && geminiLiveRef.current) {
        geminiLiveRef.current.destroy();
        geminiLiveRef.current = null;
        setIsRecording(false);
        setStatus("Ready to speak");
        setError("");
      }
    };
  }, [isOpen]);

  useKeyboardNavigation({
    onEscape: handleClose,
    onEnter: () => {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    },
    disabled: !isOpen,
  });

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      onKeyDown={(e) => e.stopPropagation()}
    >
      {/* Background overlay with enhanced blur */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-xl"
        onClick={handleClose}
      />
      
      {/* Professional AI Panel */}
      <div 
        ref={overlayRef}
        className={cn(
          "relative glass-panel rounded-3xl p-10 animate-scale-in",
          "w-96 h-96 flex flex-col items-center justify-center",
          "border border-white/10 shadow-[0_0_60px_hsl(var(--ai-pulse)/0.3)]",
          "hover:shadow-[0_0_80px_hsl(var(--ai-pulse)/0.5)]",
          "transition-all duration-700",
          "before:absolute before:inset-0 before:rounded-3xl before:bg-gradient-to-br before:from-white/5 before:to-transparent before:pointer-events-none"
        )}
        tabIndex={-1}
      >
        {/* Ambient Glow Effect */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-radial from-accent/10 to-transparent opacity-60" />
        
        {/* Header Section */}
        <div className="absolute top-6 left-0 right-0 flex items-center justify-between px-6">
          {/* Reset Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={resetSession}
            disabled={isRecording}
            className="w-10 h-10 text-white/60 hover:text-white hover:bg-white/5 nav-focus rounded-xl transition-all duration-300"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>

          {/* AI Branding */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Sparkles className="w-5 h-5 text-accent animate-pulse" />
              <div className="absolute inset-0 bg-accent/20 rounded-full blur-sm" />
            </div>
            <span className="text-sm font-semibold text-white/90 tracking-wide">Gemini Live</span>
          </div>

          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="w-10 h-10 text-white/60 hover:text-white hover:bg-white/5 nav-focus rounded-xl transition-all duration-300"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Central Recording Area */}
        <div className="flex flex-col items-center space-y-8 z-10">
          {/* Enhanced Record Button */}
          <div className="relative">
            {/* Animated Ring for Recording State */}
            {isRecording && (
              <>
                <div className="absolute inset-0 rounded-full border-2 border-red-400/30 animate-ping scale-125" />
                <div className="absolute inset-0 rounded-full bg-red-500/20 animate-glow-pulse scale-110" />
              </>
            )}
            
            {/* Main Button */}
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              size="lg"
              className={cn(
                "w-24 h-24 rounded-full transition-all duration-500 nav-focus",
                "relative z-10 border-2",
                "shadow-[0_8px_32px_hsl(var(--background)/0.3)]",
                isRecording
                  ? "bg-gradient-to-br from-red-500 to-red-600 border-red-400/50 text-white shadow-[0_0_40px_rgba(239,68,68,0.6)] hover:shadow-[0_0_50px_rgba(239,68,68,0.8)]"
                  : "bg-gradient-to-br from-accent to-accent/80 border-accent/30 text-black shadow-[0_0_30px_hsl(var(--accent)/0.4)] hover:shadow-[0_0_40px_hsl(var(--accent)/0.6)] hover:scale-105"
              )}
            >
              {isRecording ? (
                <div className="w-7 h-7 bg-current rounded-md" />
              ) : (
                <Mic className="w-9 h-9" />
              )}
            </Button>
          </div>

          {/* Professional Status Display */}
          <div className="text-center space-y-2">
            <p className={cn(
              "text-sm font-medium tracking-wide transition-colors duration-300",
              error ? "text-red-400" : "text-white/90"
            )}>
              {error || status}
            </p>
            {isRecording && (
              <div className="flex items-center justify-center space-x-1">
                <div className="w-1 h-1 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1 h-1 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1 h-1 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )}
          </div>
        </div>

        {/* Subtle Bottom Indicator */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
          <div className="w-12 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full" />
        </div>
      </div>
    </div>
  );
};
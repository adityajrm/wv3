import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, X, Volume2, Brain, RotateCcw } from "lucide-react";
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
    onEscape: onClose,
    onEnter: () => {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    },
    disabled: !isOpen,
  });

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

  const resetSession = () => {
    if (!geminiLiveRef.current) return;
    
    geminiLiveRef.current.reset();
    setIsRecording(false);
    setError("");
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      onKeyDown={(e) => e.stopPropagation()}
    >
      {/* Background overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Floating AI Panel */}
      <div 
        ref={overlayRef}
        className={cn(
          "relative glass-panel rounded-full p-8 animate-scale-in",
          "w-80 h-80 flex flex-col items-center justify-center",
          "border border-white/20 shadow-2xl",
          "hover:shadow-[0_0_60px_hsl(var(--ai-pulse)/0.4)]",
          "transition-all duration-500"
        )}
        tabIndex={-1}
      >
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 text-white/70 hover:text-white nav-focus"
        >
          <X className="w-4 h-4" />
        </Button>

        {/* AI Brain Icon */}
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 flex items-center space-x-2">
          <Brain className="w-5 h-5 text-accent" />
          <span className="text-sm font-medium text-white/90">Gemini Live</span>
        </div>

        {/* Reset Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={resetSession}
          disabled={isRecording}
          className="absolute top-4 left-4 w-8 h-8 text-white/70 hover:text-white nav-focus"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>

        {/* Central Recording Area */}
        <div className="flex flex-col items-center space-y-6">
          {/* Record Button with Pulse Effect */}
          <div className="relative">
            {isRecording && (
              <div className="absolute inset-0 rounded-full bg-accent/30 animate-glow-pulse scale-150" />
            )}
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              size="lg"
              className={cn(
                "w-20 h-20 rounded-full transition-all duration-300 nav-focus",
                "relative z-10",
                isRecording
                  ? "bg-red-500 hover:bg-red-600 text-white shadow-[0_0_30px_rgba(239,68,68,0.5)]"
                  : "bg-accent hover:bg-accent/90 text-black shadow-[0_0_20px_hsl(var(--accent)/0.3)]"
              )}
            >
              {isRecording ? (
                <div className="w-6 h-6 bg-current rounded-sm" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </Button>
          </div>

          {/* Status Text */}
          <p className="text-sm text-white/80 text-center max-w-xs">
            {error || status}
          </p>
        </div>
      </div>
    </div>
  );
};
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, X, Volume2, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { useKeyboardNavigation } from "@/hooks/use-keyboard-nav";

interface AIOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordingComplete: (audioBlob: Blob) => void;
  isProcessing: boolean;
  transcription?: string;
  aiResponse?: string;
}

export const AIOverlay = ({ 
  isOpen, 
  onClose, 
  onRecordingComplete, 
  isProcessing,
  transcription,
  aiResponse 
}: AIOverlayProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>(new Array(20).fill(0));
  const [typingText, setTypingText] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Auto-start recording when overlay opens
  useEffect(() => {
    if (isOpen && !isRecording && !isProcessing) {
      startRecording();
    }
  }, [isOpen]);

  // Typing animation for transcription
  useEffect(() => {
    if (transcription && transcription !== typingText) {
      let index = 0;
      const interval = setInterval(() => {
        if (index <= transcription.length) {
          setTypingText(transcription.slice(0, index));
          index++;
        } else {
          clearInterval(interval);
        }
      }, 30);
      
      return () => clearInterval(interval);
    }
  }, [transcription, typingText]);

  useKeyboardNavigation({
    onEscape: onClose,
    onEnter: () => {
      if (isRecording) {
        stopRecording();
      }
    },
    disabled: !isOpen,
  });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      // Set up audio analysis
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      // Start audio level monitoring and waveform
      const updateAudioLevel = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / bufferLength;
          setAudioLevel(average / 255);
          
          // Create waveform visualization
          const waveData = Array.from({ length: 20 }, (_, i) => {
            const index = Math.floor((i / 20) * bufferLength);
            return (dataArray[index] || 0) / 255;
          });
          setWaveformData(waveData);
        }
        animationRef.current = requestAnimationFrame(updateAudioLevel);
      };
      updateAudioLevel();

      // Set up MediaRecorder
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      chunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onRecordingComplete(audioBlob);
        
        // Cleanup
        stream.getTracks().forEach(track => track.stop());
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        setAudioLevel(0);
        setWaveformData(new Array(20).fill(0));
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

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
          <span className="text-sm font-medium text-white/90">AI Assistant</span>
        </div>

        {/* Central Recording Area */}
        <div className="flex flex-col items-center space-y-6">
          
          {/* Waveform Visualization */}
          {isRecording && (
            <div className="flex items-end justify-center space-x-1 h-12">
              {waveformData.map((value, index) => (
                <div
                  key={index}
                  className="bg-accent rounded-full min-w-[3px] transition-all duration-75"
                  style={{
                    height: `${Math.max(4, value * 40)}px`,
                    opacity: Math.max(0.3, value)
                  }}
                />
              ))}
            </div>
          )}

          {/* Record Button with Pulse Effect */}
          <div className="relative">
            {isRecording && (
              <div className="absolute inset-0 rounded-full bg-accent/30 animate-glow-pulse scale-150" />
            )}
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              size="lg"
              className={cn(
                "w-20 h-20 rounded-full transition-all duration-300 nav-focus",
                "relative z-10",
                isRecording
                  ? "bg-red-500 hover:bg-red-600 text-white shadow-[0_0_30px_rgba(239,68,68,0.5)]"
                  : "bg-accent hover:bg-accent/90 text-black shadow-[0_0_20px_hsl(var(--accent)/0.3)]"
              )}
            >
              {isProcessing ? (
                <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : isRecording ? (
                <div className="w-6 h-6 bg-current rounded-sm" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </Button>
          </div>

          {/* Status Text */}
          <p className="text-sm text-white/80 text-center">
            {isProcessing ? "Processing..." : 
             isRecording ? "Listening..." : 
             "Tap to speak"}
          </p>
        </div>

        {/* Transcription Display */}
        {typingText && (
          <div className="absolute -bottom-20 left-1/2 transform -translate-x-1/2 w-96">
            <div className="flex justify-center animate-fade-in">
              <div className="glass max-w-xs px-4 py-3 rounded-2xl border border-white/20 text-center">
                <p className="text-sm text-white">
                  {typingText}
                  {typingText.length < (transcription?.length || 0) && (
                    <span className="animate-ping">|</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Audio Level Ring */}
        {isRecording && (
          <div 
            className="absolute inset-4 border-2 border-accent/40 rounded-full transition-all duration-75"
            style={{
              transform: `scale(${0.8 + audioLevel * 0.4})`,
              opacity: 0.3 + audioLevel * 0.7
            }}
          />
        )}
      </div>
    </div>
  );
};
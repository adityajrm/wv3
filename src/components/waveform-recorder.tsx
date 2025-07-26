import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, MicOff, Play, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface WaveformRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  isProcessing: boolean;
}

export const WaveformRecorder = ({ onRecordingComplete, isProcessing }: WaveformRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>(new Array(50).fill(0));
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      // Set up audio analysis for waveform
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      // Start waveform animation
      const updateWaveform = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / bufferLength;
          setAudioLevel(average / 255);
          
          // Create waveform visualization data
          const waveData = Array.from({ length: 50 }, (_, i) => {
            const index = Math.floor((i / 50) * bufferLength);
            return dataArray[index] / 255;
          });
          setWaveformData(waveData);
        }
        animationRef.current = requestAnimationFrame(updateWaveform);
      };
      updateWaveform();

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
        setWaveformData(new Array(50).fill(0));
        setAudioLevel(0);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast.success("Recording started");
      
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Failed to start recording. Please check microphone permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success("Recording stopped");
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

  return (
    <Card className="bg-gradient-to-br from-card to-card/80 border-border/50">
      <CardContent className="p-6">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Voice Recorder</h3>
            <p className="text-sm text-muted-foreground">
              {isRecording ? "Recording in progress..." : "Click to start recording"}
            </p>
          </div>

          {/* Waveform Visualization */}
          <div className="h-24 flex items-end justify-center space-x-1 bg-console-bg rounded-lg p-4">
            {waveformData.map((value, index) => (
              <div
                key={index}
                className={cn(
                  "bg-waveform transition-all duration-75 rounded-full min-h-[2px]",
                  isRecording && value > 0.1 && "shadow-lg shadow-waveform/50"
                )}
                style={{
                  height: `${Math.max(2, value * 60)}px`,
                  opacity: isRecording ? Math.max(0.3, value) : 0.3
                }}
              />
            ))}
          </div>

          {/* Audio Level Indicator */}
          {isRecording && (
            <div className="space-y-2">
              <div className="w-full bg-console-bg rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-ai-glow to-accent transition-all duration-75"
                  style={{ width: `${audioLevel * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Audio Level: {Math.round(audioLevel * 100)}%
              </p>
            </div>
          )}

          {/* Record Button */}
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            size="lg"
            className={cn(
              "w-16 h-16 rounded-full transition-all duration-300",
              isRecording
                ? "bg-destructive hover:bg-destructive/90 animate-pulse"
                : "bg-primary hover:bg-primary/90"
            )}
          >
            {isRecording ? (
              <Square className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </Button>

          <p className="text-xs text-muted-foreground">
            {isRecording ? "Click to stop recording" : "Click to start recording"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
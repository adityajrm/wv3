import { GoogleGenAI, LiveServerMessage, Modality, Session } from '@google/genai';
import { createBlob, decode, decodeAudioData } from './gemini-utils';

// Hard-coded API key as requested
const GEMINI_API_KEY = 'AIzaSyAUHP34aS7UPglJDl64pub4kR7m59IZcTw';

export class GeminiLiveAudio {
  private client: GoogleGenAI;
  private session: Session | null = null;
  private inputAudioContext: AudioContext;
  private outputAudioContext: AudioContext;
  private inputNode: GainNode;
  private outputNode: GainNode;
  private nextStartTime = 0;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private scriptProcessorNode: ScriptProcessorNode | null = null;
  private sources = new Set<AudioBufferSourceNode>();
  private isRecording = false;

  public onStatusChange?: (status: string) => void;
  public onError?: (error: string) => void;

  constructor() {
    this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 16000,
    });
    this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 24000,
    });
    this.inputNode = this.inputAudioContext.createGain();
    this.outputNode = this.outputAudioContext.createGain();
    
    this.client = new GoogleGenAI({
      apiKey: GEMINI_API_KEY,
    });

    this.outputNode.connect(this.outputAudioContext.destination);
    this.initSession();
  }

  private async initSession() {
    const model = 'gemini-2.5-flash-preview-native-audio-dialog';

    try {
      this.session = await this.client.live.connect({
        model: model,
        callbacks: {
          onopen: () => {
            this.updateStatus('Connected to Gemini Live');
          },
          onmessage: async (message: LiveServerMessage) => {
            const audio = message.serverContent?.modelTurn?.parts[0]?.inlineData;

            if (audio) {
              this.nextStartTime = Math.max(
                this.nextStartTime,
                this.outputAudioContext.currentTime,
              );

              const audioBuffer = await decodeAudioData(
                decode(audio.data),
                this.outputAudioContext,
                24000,
                1,
              );
              const source = this.outputAudioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(this.outputNode);
              source.addEventListener('ended', () => {
                this.sources.delete(source);
              });

              source.start(this.nextStartTime);
              this.nextStartTime = this.nextStartTime + audioBuffer.duration;
              this.sources.add(source);
            }

            const interrupted = message.serverContent?.interrupted;
            if (interrupted) {
              for (const source of this.sources.values()) {
                source.stop();
                this.sources.delete(source);
              }
              this.nextStartTime = 0;
            }
          },
          onerror: (e: ErrorEvent) => {
            this.updateError(e.message);
          },
          onclose: (e: CloseEvent) => {
            this.updateStatus('Connection closed: ' + e.reason);
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Orus' } },
          },
        },
      });
    } catch (e) {
      console.error('Failed to initialize session:', e);
      this.updateError('Failed to connect to Gemini Live');
    }
  }

  private updateStatus(msg: string) {
    this.onStatusChange?.(msg);
  }

  private updateError(msg: string) {
    this.onError?.(msg);
  }

  async startRecording(): Promise<void> {
    if (this.isRecording) {
      return;
    }

    await this.inputAudioContext.resume();
    await this.outputAudioContext.resume();

    this.updateStatus('Requesting microphone access...');

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      this.updateStatus('Listening...');

      this.sourceNode = this.inputAudioContext.createMediaStreamSource(this.mediaStream);
      this.sourceNode.connect(this.inputNode);

      const bufferSize = 256;
      this.scriptProcessorNode = this.inputAudioContext.createScriptProcessor(
        bufferSize,
        1,
        1,
      );

      this.scriptProcessorNode.onaudioprocess = (audioProcessingEvent) => {
        if (!this.isRecording || !this.session) return;

        const inputBuffer = audioProcessingEvent.inputBuffer;
        const pcmData = inputBuffer.getChannelData(0);

        this.session.sendRealtimeInput({ media: createBlob(pcmData) });
      };

      this.sourceNode.connect(this.scriptProcessorNode);
      this.scriptProcessorNode.connect(this.inputAudioContext.destination);

      this.isRecording = true;
    } catch (err) {
      console.error('Error starting recording:', err);
      this.updateError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      this.stopRecording();
    }
  }

  stopRecording(): void {
    if (!this.isRecording) return;

    this.updateStatus('Disconnecting...');
    this.isRecording = false;

    if (this.scriptProcessorNode && this.sourceNode) {
      this.scriptProcessorNode.disconnect();
      this.sourceNode.disconnect();
    }

    this.scriptProcessorNode = null;
    this.sourceNode = null;

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    // Close the session when stopping recording to fully disconnect
    this.session?.close();
    this.session = null;

    this.updateStatus('Disconnected');
  }

  reset(): void {
    this.stopRecording();
    this.session?.close();
    this.initSession();
    this.updateStatus('Session reset');
  }

  getIsRecording(): boolean {
    return this.isRecording;
  }

  destroy(): void {
    this.stopRecording();
    this.session?.close();
    this.inputAudioContext.close();
    this.outputAudioContext.close();
  }
}
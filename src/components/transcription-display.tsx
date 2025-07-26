import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Volume2, Copy, User, Bot } from "lucide-react";
import { toast } from "sonner";

export interface TranscriptionEntry {
  id: string;
  timestamp: Date;
  userInput: string;
  aiResponse: string;
  language?: string;
}

interface TranscriptionDisplayProps {
  transcriptions: TranscriptionEntry[];
  isPlaying: boolean;
  onPlayResponse: (text: string) => void;
}

export const TranscriptionDisplay = ({ 
  transcriptions, 
  isPlaying, 
  onPlayResponse 
}: TranscriptionDisplayProps) => {
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <Card className="bg-card border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-foreground flex items-center space-x-2">
          <MessageSquare className="w-4 h-4 text-ai-glow" />
          <span>Conversation History</span>
          <Badge variant="outline" className="ml-auto">
            {transcriptions.length} conversations
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-64 w-full">
          <div className="space-y-4 p-4 pt-0">
            {transcriptions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs">Start recording to see transcriptions and AI responses</p>
              </div>
            ) : (
              transcriptions.map((entry) => (
                <div key={entry.id} className="space-y-3 border-l-2 border-border pl-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {entry.timestamp.toLocaleString()}
                    </Badge>
                    {entry.language && (
                      <Badge variant="secondary" className="text-xs">
                        {entry.language}
                      </Badge>
                    )}
                  </div>

                  {/* User Input */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-ai-glow" />
                      <span className="text-sm font-medium text-foreground">You said:</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(entry.userInput)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="bg-muted/30 rounded-md p-3">
                      <p className="text-sm text-foreground">{entry.userInput}</p>
                    </div>
                  </div>

                  {/* AI Response */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Bot className="w-4 h-4 text-accent" />
                      <span className="text-sm font-medium text-foreground">AI Response:</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(entry.aiResponse)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onPlayResponse(entry.aiResponse)}
                        disabled={isPlaying}
                        className="h-6 w-6 p-0"
                      >
                        <Volume2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="bg-accent/10 border border-accent/20 rounded-md p-3">
                      <p className="text-sm text-foreground">{entry.aiResponse}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
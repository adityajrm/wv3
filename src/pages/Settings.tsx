import { Navigation } from "@/components/ui/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Settings as SettingsIcon, Brain, CheckCircle } from "lucide-react";

const Settings = () => {

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <SettingsIcon className="w-8 h-8 text-accent" />
              <h1 className="text-3xl font-bold text-foreground">Gemini Live Audio</h1>
            </div>
            <p className="text-muted-foreground">
              Real-time voice conversations with Google's Gemini AI
            </p>
          </div>

          {/* Status */}
          <Alert className="border-accent/50 bg-accent/5">
            <CheckCircle className="h-4 w-4 text-accent" />
            <AlertDescription className="text-accent">
              Gemini Live Audio is ready to use! No configuration required.
            </AlertDescription>
          </Alert>

          {/* Info Section */}
          <Card className="bg-muted/30 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-accent" />
                <span>How Gemini Live Audio Works</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground space-y-3">
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li>Click the AI button to open the voice interface</li>
                  <li>Start speaking - your voice is processed in real-time</li>
                  <li>Gemini AI responds with natural voice conversations</li>
                  <li>No transcription delays or text-to-speech processing needed</li>
                </ol>
                
                <div className="bg-card/50 p-4 rounded-lg border border-border/50">
                  <h4 className="font-medium text-foreground mb-2">Features:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Real-time bidirectional voice conversations</li>
                    <li>Natural interruption and turn-taking</li>
                    <li>High-quality audio processing</li>
                    <li>No API key configuration required</li>
                  </ul>
                </div>

                <p className="text-xs text-muted-foreground">
                  <strong>Note:</strong> This app uses Google's Gemini Live Audio API with a pre-configured API key for demonstration purposes.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
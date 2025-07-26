import { useState, useEffect } from "react";
import { Navigation } from "@/components/ui/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Settings as SettingsIcon, Save, Key, Brain, AlertCircle, CheckCircle } from "lucide-react";
import { AppSettings, loadSettings, saveSettings, validateSettings, defaultSettings } from "@/lib/settings";
import { toast } from "sonner";

const Settings = () => {
  const [settings, setSettings] = useState<AppSettings>(loadSettings());
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const errors = validateSettings(settings);
    setValidationErrors(errors);
  }, [settings]);

  const handleSave = () => {
    const errors = validateSettings(settings);
    if (errors.length > 0) {
      toast.error("Please fix validation errors before saving");
      return;
    }

    saveSettings(settings);
    setIsSaved(true);
    toast.success("Settings saved successfully!");
    
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    toast.info("Settings reset to defaults");
  };

  const updateSetting = (key: keyof AppSettings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <SettingsIcon className="w-8 h-8 text-ai-glow" />
              <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            </div>
            <p className="text-muted-foreground">
              Configure your API keys and models for the AI Multi Lingual Assistant
            </p>
          </div>

          {/* Validation Status */}
          {validationErrors.length > 0 ? (
            <Alert className="border-ai-error/50 bg-ai-error/5">
              <AlertCircle className="h-4 w-4 text-ai-error" />
              <AlertDescription className="text-ai-error">
                <div className="space-y-1">
                  <p className="font-medium">Configuration Issues:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-ai-success/50 bg-ai-success/5">
              <CheckCircle className="h-4 w-4 text-ai-success" />
              <AlertDescription className="text-ai-success">
                All settings are valid and ready to use!
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            {/* Replicate Settings */}
            <Card className="bg-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Key className="w-5 h-5 text-ai-glow" />
                  <span>Replicate API</span>
                  <Badge variant="outline" className="ml-auto">Transcription</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="replicate-key">API Key</Label>
                  <Input
                    id="replicate-key"
                    type="password"
                    placeholder="r8_..."
                    value={settings.replicateApiKey}
                    onChange={(e) => updateSetting('replicateApiKey', e.target.value)}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Get your API key from{" "}
                    <a 
                      href="https://replicate.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-ai-glow hover:underline"
                    >
                      replicate.com
                    </a>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="replicate-model">Model Version</Label>
                  <Textarea
                    id="replicate-model"
                    placeholder="openai/whisper:..."
                    value={settings.replicateModel}
                    onChange={(e) => updateSetting('replicateModel', e.target.value)}
                    className="font-mono text-sm h-20 resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Whisper model version for audio transcription
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Gemini Settings */}
            <Card className="bg-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="w-5 h-5 text-accent" />
                  <span>Gemini AI</span>
                  <Badge variant="outline" className="ml-auto">Response</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gemini-key">API Key</Label>
                  <Input
                    id="gemini-key"
                    type="password"
                    placeholder="AIza..."
                    value={settings.geminiApiKey}
                    onChange={(e) => updateSetting('geminiApiKey', e.target.value)}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Get your API key from{" "}
                    <a 
                      href="https://makersuite.google.com/app/apikey" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-ai-glow hover:underline"
                    >
                      Google AI Studio
                    </a>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gemini-model">Model Name</Label>
                  <Input
                    id="gemini-model"
                    placeholder="gemini-2.0-flash"
                    value={settings.geminiModel}
                    onChange={(e) => updateSetting('geminiModel', e.target.value)}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Available models: gemini-2.0-flash, gemini-1.5-pro, gemini-1.5-flash
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <Button
              onClick={handleSave}
              disabled={validationErrors.length > 0}
              className={`flex items-center space-x-2 ${isSaved ? 'bg-ai-success hover:bg-ai-success/90' : ''}`}
            >
              {isSaved ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isSaved ? 'Saved!' : 'Save Settings'}</span>
            </Button>
            
            <Button variant="outline" onClick={handleReset}>
              Reset to Defaults
            </Button>
          </div>

          {/* Info Section */}
          <Card className="bg-muted/30 border-border/50">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground space-y-2">
                <h4 className="font-medium text-foreground">How it works:</h4>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Record audio using the microphone</li>
                  <li>Send audio to Replicate API (Whisper) for transcription</li>
                  <li>Send transcription to Gemini AI for intelligent response</li>
                  <li>Play back the AI response using text-to-speech</li>
                </ol>
                <p className="mt-3">
                  <strong>Note:</strong> Your API keys are stored locally in your browser and never sent to our servers.
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
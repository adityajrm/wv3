import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, AlertCircle, XCircle } from "lucide-react";

export interface LogEntry {
  id: string;
  timestamp: Date;
  step: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  duration?: number;
}

interface ConsoleLogProps {
  logs: LogEntry[];
}

export const ConsoleLog = ({ logs }: ConsoleLogProps) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new logs are added
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [logs]);

  const getLogIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-ai-success" />;
      case "warning":
        return <AlertCircle className="w-4 h-4 text-ai-warning" />;
      case "error":
        return <XCircle className="w-4 h-4 text-ai-error" />;
      default:
        return <Clock className="w-4 h-4 text-ai-glow" />;
    }
  };

  const getLogBadgeVariant = (type: string) => {
    switch (type) {
      case "success":
        return "default";
      case "warning":
        return "secondary";
      case "error":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <Card className="bg-console-bg border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-foreground flex items-center space-x-2">
          <Clock className="w-4 h-4 text-ai-glow" />
          <span>Process Console</span>
          <Badge variant="outline" className="ml-auto">
            {logs.length} entries
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea ref={scrollAreaRef} className="h-64 w-full">
          <div className="space-y-1 p-4 pt-0">
            {logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No process logs yet</p>
                <p className="text-xs">Start recording to see API timing information</p>
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start space-x-3 p-2 rounded-md hover:bg-muted/20 transition-colors"
                >
                  {getLogIcon(log.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <Badge 
                        variant={getLogBadgeVariant(log.type)}
                        className="text-xs"
                      >
                        {log.step}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-foreground mt-1">{log.message}</p>
                    {log.duration && (
                      <p className="text-xs text-ai-glow font-mono mt-1">
                        Duration: {log.duration}ms
                      </p>
                    )}
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
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Settings, Mic, Brain } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export const Navigation = () => {
  const location = useLocation();

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Brain className="w-8 h-8 text-ai-glow" />
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-ai-glow to-accent bg-clip-text text-transparent">
                  WorkingEdge ATLAS
                </h1>
                <p className="text-xs text-muted-foreground">AI Multi Lingual Assistant</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Link to="/">
              <Button
                variant={location.pathname === "/" ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "flex items-center space-x-2",
                  location.pathname === "/" && "bg-primary text-primary-foreground"
                )}
              >
                <Mic className="w-4 h-4" />
                <span>Assistant</span>
              </Button>
            </Link>
            
            <Link to="/settings">
              <Button
                variant={location.pathname === "/settings" ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "flex items-center space-x-2",
                  location.pathname === "/settings" && "bg-primary text-primary-foreground"
                )}
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
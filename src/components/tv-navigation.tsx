import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useKeyboardNavigation } from "@/hooks/use-keyboard-nav";

interface TVNavigationProps {
  onAIClick: () => void;
  onFocusChange?: (focused: boolean) => void;
  isFocused?: boolean;
}

const navItems = [
  { id: "home", label: "Home", active: true },
  { id: "library", label: "Library", active: false },
  { id: "apps", label: "Apps", active: false },
  { id: "settings", label: "Settings", active: false },
];

export const TVNavigation = ({ onAIClick, onFocusChange, isFocused: propIsFocused = false }: TVNavigationProps) => {
  const [activeTab, setActiveTab] = useState("home");
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Focus the first nav item when prop changes
  useEffect(() => {
    if (propIsFocused && buttonRefs.current[0]) {
      buttonRefs.current[0].focus();
      setIsFocused(true);
    } else if (!propIsFocused) {
      setIsFocused(false);
    }
  }, [propIsFocused]);

  useEffect(() => {
    onFocusChange?.(isFocused);
  }, [isFocused, onFocusChange]);

  useKeyboardNavigation({
    onArrowLeft: () => {
      if (!isFocused) return;
      const newIndex = Math.max(0, focusedIndex - 1);
      setFocusedIndex(newIndex);
      buttonRefs.current[newIndex]?.focus();
    },
    onArrowRight: () => {
      if (!isFocused) return;
      const newIndex = Math.min(buttonRefs.current.length - 1, focusedIndex + 1);
      setFocusedIndex(newIndex);
      buttonRefs.current[newIndex]?.focus();
    },
    onEnter: () => {
      if (!isFocused) return;
      if (focusedIndex === buttonRefs.current.length - 1) {
        onAIClick();
      } else {
        const tabId = navItems[focusedIndex]?.id;
        if (tabId) setActiveTab(tabId);
      }
    },
    disabled: false,
  });

  const handleTabClick = (tabId: string, index: number) => {
    setActiveTab(tabId);
    setFocusedIndex(index);
    setIsFocused(true);
  };

  const handleFocus = (index: number) => {
    setFocusedIndex(index);
    setIsFocused(true);
  };

  const handleBlur = () => {
    // Small delay to check if focus moved to another nav item
    setTimeout(() => {
      const hasFocusedElement = buttonRefs.current.some(ref => ref === document.activeElement);
      if (!hasFocusedElement) {
        setIsFocused(false);
      }
    }, 10);
  };

  return (
    <TooltipProvider>
      <nav 
        ref={navRef}
        className="relative px-8 py-6 bg-transparent backdrop-blur-sm border-b border-glass-border/20"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {navItems.map((item, index) => {
              const isActive = activeTab === item.id;
              
              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    <Button
                      ref={(el) => (buttonRefs.current[index] = el)}
                      variant="ghost"
                      size="lg"
                      onClick={() => handleTabClick(item.id, index)}
                      onFocus={() => handleFocus(index)}
                      onBlur={handleBlur}
                      className={cn(
                        "relative px-6 py-3 nav-focus group",
                        "transition-all duration-300 font-bold text-base",
                        isActive 
                          ? "text-white bg-white/10" 
                          : "text-muted-foreground hover:text-white hover:bg-white/5"
                      )}
                    >
                      {item.label}
                      {isActive && (
                        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-white rounded-full animate-scale-in" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                ref={(el) => (buttonRefs.current[navItems.length] = el)}
                onClick={onAIClick}
                onFocus={() => handleFocus(navItems.length)}
                onBlur={handleBlur}
                size="lg"
                className={cn(
                  "px-6 py-3 nav-focus group font-bold text-base",
                  "bg-gradient-to-r from-accent/20 to-primary/20",
                  "hover:from-accent/30 hover:to-primary/30",
                  "border border-accent/30 hover:border-accent/50",
                  "text-muted-foreground hover:text-white",
                  "transition-all duration-300 hover-glow"
                )}
              >
                AI
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>AI Assistant</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </nav>
    </TooltipProvider>
  );
};
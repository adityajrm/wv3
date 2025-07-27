import { useState, useEffect } from "react";
import { TVNavigation } from "@/components/tv-navigation";
import { AIOverlay } from "@/components/ai-overlay";
import { HeroCarousel } from "@/components/hero-carousel";
import { AppGrid } from "@/components/app-grid";
import { ContentRow } from "@/components/content-row";
import { useKeyboardNavigation } from "@/hooks/use-keyboard-nav";

const Index = () => {
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState(0); // 0: nav, 1: carousel, 2: apps, 3: recommended
  const [navFocused, setNavFocused] = useState(false);
  const [carouselFocused, setCarouselFocused] = useState(false);
  const [appsFocused, setAppsFocused] = useState(false);
  const [recommendedFocused, setRecommendedFocused] = useState(false);

  // Global keyboard navigation for section switching
  useKeyboardNavigation({
    onArrowDown: () => {
      if (currentSection < 3) {
        setCurrentSection(prev => prev + 1);
        // Reset focus states
        setNavFocused(false);
        setCarouselFocused(false);
        setAppsFocused(false);
        setRecommendedFocused(false);
      }
    },
    onArrowUp: () => {
      if (currentSection > 0) {
        setCurrentSection(prev => prev - 1);
        // Reset focus states
        setNavFocused(false);
        setCarouselFocused(false);
        setAppsFocused(false);
        setRecommendedFocused(false);
      }
    },
    // Disable when AI overlay is open to prevent background navigation
    disabled: isAIOpen,
  });

  // Effect to manage focus based on current section
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentSection === 0) {
        // Focus navigation
        setNavFocused(true);
        setCarouselFocused(false);
        setAppsFocused(false);
        setRecommendedFocused(false);
      } else if (currentSection === 1) {
        // Focus carousel
        setNavFocused(false);
        setCarouselFocused(true);
        setAppsFocused(false);
        setRecommendedFocused(false);
      } else if (currentSection === 2) {
        // Focus apps
        setNavFocused(false);
        setCarouselFocused(false);
        setAppsFocused(true);
        setRecommendedFocused(false);
      } else if (currentSection === 3) {
        // Focus recommended
        setNavFocused(false);
        setCarouselFocused(false);
        setAppsFocused(false);
        setRecommendedFocused(true);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [currentSection]);




  return (
    <div className="min-h-screen bg-background">
      <TVNavigation 
        onAIClick={() => setIsAIOpen(true)} 
        onFocusChange={setNavFocused}
        isFocused={currentSection === 0}
      />
      
      <div className="px-8 py-6 space-y-8">
        {/* Hero Carousel */}
        <HeroCarousel 
          isFocused={currentSection === 1}
          onFocusChange={setCarouselFocused}
        />
        
        {/* App Grid */}
        <AppGrid 
          isFocused={currentSection === 2}
          onFocusChange={setAppsFocused}
        />
        
        {/* Content Rows */}
        <ContentRow 
          title="Recommended Movies" 
          isFocused={currentSection === 3}
          onFocusChange={setRecommendedFocused}
        />
      </div>

      {/* AI Overlay */}
      <AIOverlay
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
      />
    </div>
  );
};

export default Index;

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useKeyboardNavigation } from "@/hooks/use-keyboard-nav";

interface HeroCarouselProps {
  isFocused?: boolean;
  onFocusChange?: (focused: boolean) => void;
}

const heroContent = [
  {
    id: 1,
    title: "The Last of Us",
    description: "A gripping post-apocalyptic drama series",
    image: "/lovable-uploads/c9bb5f22-f461-48d3-92d0-377bc6e49aa1.png",
    category: "Series",
    rating: "9.0"
  },
  {
    id: 2,
    title: "Featured Movie",
    description: "Discover amazing content with AI assistance",
    image: "https://images.unsplash.com/photo-1489599083698-2aa49c3b3100?w=1200&h=400&fit=crop",
    category: "Movie",
    rating: "8.5"
  },
  {
    id: 3,
    title: "Popular Shows",
    description: "Trending content you might enjoy",
    image: "https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=1200&h=400&fit=crop",
    category: "Collection",
    rating: "8.8"
  }
];

export const HeroCarousel = ({ isFocused = false, onFocusChange }: HeroCarouselProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isCarouselFocused, setIsCarouselFocused] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isFocused && carouselRef.current) {
      carouselRef.current.focus();
      setIsCarouselFocused(true);
    }
  }, [isFocused]);

  useEffect(() => {
    onFocusChange?.(isCarouselFocused);
  }, [isCarouselFocused, onFocusChange]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroContent.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroContent.length) % heroContent.length);
  };

  useKeyboardNavigation({
    onArrowLeft: () => {
      if (isCarouselFocused) prevSlide();
    },
    onArrowRight: () => {
      if (isCarouselFocused) nextSlide();
    },
    disabled: false,
  });

  useEffect(() => {
    if (!isHovered && !isCarouselFocused) {
      const timer = setInterval(nextSlide, 6000);
      return () => clearInterval(timer);
    }
  }, [isHovered, isCarouselFocused]);

  const currentItem = heroContent[currentSlide];

  return (
    <div 
      ref={carouselRef}
      className="relative w-full h-[65vh] rounded-2xl overflow-hidden group focus-within:outline-none nav-focus"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsCarouselFocused(true)}
      onBlur={() => setIsCarouselFocused(false)}
      tabIndex={0}
    >
      {/* Background with parallax effect */}
      <div className="absolute inset-0">
        {heroContent.map((item, index) => (
          <div
            key={item.id}
            className={cn(
              "absolute inset-0 transition-all duration-1000 ease-out",
              index === currentSlide ? "opacity-100 scale-100" : "opacity-0 scale-105"
            )}
          >
            <div
              className="w-full h-full bg-cover bg-center transform transition-transform duration-12000"
              style={{ 
                backgroundImage: `url(${item.image})`,
                transform: index === currentSlide ? 'scale(1.02)' : 'scale(1)'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>
        ))}
      </div>

      {/* Content overlay with frosted glass */}
      <div className="absolute bottom-0 left-0 right-0 p-8">
        <div className="glass-panel rounded-2xl p-6 max-w-2xl animate-fade-in">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1 text-xs font-medium bg-accent/20 text-accent rounded-full border border-accent/30">
                {currentItem.category}
              </span>
              <div className="flex items-center space-x-1 text-yellow-400">
                <span className="text-sm">★</span>
                <span className="text-sm font-medium">{currentItem.rating}</span>
              </div>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight">
              {currentItem.title}
            </h2>
            <p className="text-lg text-white/90 max-w-lg leading-relaxed">
              {currentItem.description}
            </p>
            <div className="flex items-center space-x-4 pt-2">
              <Button 
                size="lg"
                className="bg-white text-black hover:bg-white/90 font-semibold px-8 hover-lift"
              >
                <Play className="w-5 h-5 mr-2 fill-current" />
                Play Now
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-white/30 text-white hover:bg-white/10 font-semibold px-6"
              >
                More Info
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation buttons */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "absolute left-6 top-1/2 -translate-y-1/2 nav-focus",
          "w-12 h-12 text-white/80 hover:text-white",
          "glass rounded-full hover:bg-white/20",
          "transition-all duration-300",
          "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
        )}
        onClick={prevSlide}
      >
        <ChevronLeft className="w-6 h-6" />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "absolute right-6 top-1/2 -translate-y-1/2 nav-focus",
          "w-12 h-12 text-white/80 hover:text-white",
          "glass rounded-full hover:bg-white/20",
          "transition-all duration-300",
          "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
        )}
        onClick={nextSlide}
      >
        <ChevronRight className="w-6 h-6" />
      </Button>

      {/* Indicators */}
      <div className="absolute bottom-6 right-6 flex space-x-2">
        {heroContent.map((_, index) => (
          <button
            key={index}
            className={cn(
              "w-3 h-3 rounded-full transition-all duration-300 nav-focus",
              index === currentSlide 
                ? "bg-white scale-110" 
                : "bg-white/40 hover:bg-white/60"
            )}
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </div>
    </div>
  );
};
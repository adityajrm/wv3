import { useState, useRef, useEffect } from "react";
import { Play, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useKeyboardNavigation } from "@/hooks/use-keyboard-nav";

interface ContentItem {
  id: number;
  title: string;
  image: string;
  year?: string;
  genre?: string;
  rating?: string;
}

interface ContentRowProps {
  title: string;
  items?: ContentItem[];
  isFocused?: boolean;
  onFocusChange?: (focused: boolean) => void;
}

const defaultMovies: ContentItem[] = [
  {
    id: 1,
    title: "Friends",
    image: "https://images.unsplash.com/photo-1489599083698-2aa49c3b3100?w=300&h=400&fit=crop",
    year: "1994",
    genre: "Comedy",
    rating: "8.9"
  },
  {
    id: 2,
    title: "Iron Man",
    image: "https://images.unsplash.com/photo-1635805737707-575885ab0820?w=300&h=400&fit=crop",
    year: "2008",
    genre: "Action",
    rating: "7.9"
  },
  {
    id: 3,
    title: "Spider-Man",
    image: "https://images.unsplash.com/photo-1626278664285-f796b9ee7806?w=300&h=400&fit=crop",
    year: "2002",
    genre: "Action",
    rating: "7.3"
  },
  {
    id: 4,
    title: "The Dark Knight",
    image: "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=300&h=400&fit=crop",
    year: "2008",
    genre: "Drama",
    rating: "9.0"
  },
  {
    id: 5,
    title: "Avengers",
    image: "https://images.unsplash.com/photo-1635805737707-575885ab0820?w=300&h=400&fit=crop",
    year: "2012",
    genre: "Action",
    rating: "8.0"
  },
  {
    id: 6,
    title: "Inception",
    image: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=300&h=400&fit=crop",
    year: "2010",
    genre: "Sci-Fi",
    rating: "8.8"
  }
];

export const ContentRow = ({ title, items = defaultMovies, isFocused = false, onFocusChange }: ContentRowProps) => {
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [isRowFocused, setIsRowFocused] = useState(false);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (isFocused && itemRefs.current[0]) {
      itemRefs.current[0].focus();
      setIsRowFocused(true);
    }
  }, [isFocused]);

  useEffect(() => {
    onFocusChange?.(isRowFocused);
  }, [isRowFocused, onFocusChange]);

  useKeyboardNavigation({
    onArrowLeft: () => {
      if (isRowFocused && focusedIndex > 0) {
        const newIndex = Math.max(0, focusedIndex - 1);
        setFocusedIndex(newIndex);
        itemRefs.current[newIndex]?.focus();
      }
    },
    onArrowRight: () => {
      if (isRowFocused && focusedIndex < items.length - 1) {
        const newIndex = Math.min(items.length - 1, focusedIndex + 1);
        setFocusedIndex(newIndex);
        itemRefs.current[newIndex]?.focus();
      }
    },
    disabled: false,
  });

  const handleFocus = (index: number) => {
    setFocusedIndex(index);
    setIsRowFocused(true);
  };

  const handleBlur = () => {
    setTimeout(() => {
      const hasFocusedElement = itemRefs.current.some(ref => ref === document.activeElement);
      if (!hasFocusedElement) {
        setIsRowFocused(false);
      }
    }, 10);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-semibold text-foreground/90 px-2">{title}</h2>
      <div className="w-full overflow-hidden">
        <div className="flex space-x-6 p-2 overflow-x-auto scrollbar-hide">
          {items.map((item, index) => {
            const isFocusedItem = focusedIndex === index;
            
            return (
              <div
                key={item.id}
                ref={(el) => (itemRefs.current[index] = el)}
                className={cn(
                  "tv-content relative group cursor-pointer flex-shrink-0",
                  "w-44 md:w-52",
                  isFocusedItem && "ring-2 ring-primary/60 ring-offset-2 ring-offset-background"
                )}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                tabIndex={0}
                onFocus={() => handleFocus(index)}
                onBlur={handleBlur}
              >
                <div className="relative overflow-hidden rounded-xl">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-64 md:h-72 object-cover transition-all duration-500 group-hover:scale-110 group-focus:scale-105"
                  />
                  
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  
                  {/* Play button overlay */}
                  <div className={cn(
                    "absolute inset-0 flex items-center justify-center",
                    "transition-all duration-300",
                    (hoveredItem === item.id || isFocusedItem) ? "opacity-100" : "opacity-0"
                  )}>
                    <Button
                      size="lg"
                      className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border border-white/30"
                    >
                      <Play className="w-6 h-6 fill-current" />
                    </Button>
                  </div>

                  {/* Floating metadata overlay */}
                  {(hoveredItem === item.id || isFocusedItem) && (
                    <div className="absolute bottom-4 left-4 right-4 glass-panel p-4 rounded-lg animate-fade-in">
                      <div className="space-y-2">
                        <h3 className="font-semibold text-white text-lg leading-tight">{item.title}</h3>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-sm text-white/80">
                            <span>{item.year}</span>
                            <span>•</span>
                            <span>{item.genre}</span>
                            <span>•</span>
                            <div className="flex items-center space-x-1">
                              <span className="text-yellow-400">★</span>
                              <span>{item.rating}</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full bg-white/10 border-white/30 text-white hover:bg-white/20 text-xs"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add to Watchlist
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
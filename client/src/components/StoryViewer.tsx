import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface Story {
  id: number;
  content: string | null;
  imageUrl: string | null;
  authorName: string;
  authorImage: string | null;
  createdAt: string | null;
  expiresAt: string;
}

interface StoryViewerProps {
  stories: Story[];
  startIndex: number;
  onClose: () => void;
}

const STORY_DURATION = 5000;

export default function StoryViewer({ stories, startIndex, onClose }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const currentStory = stories[currentIndex];

  const goToNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onClose]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
  }, [currentIndex]);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + (100 / (STORY_DURATION / 50));
        if (next >= 100) {
          goToNext();
          return 0;
        }
        return next;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isPaused, goToNext]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goToPrev();
      if (e.key === "ArrowRight") goToNext();
      if (e.key === " ") setIsPaused((p) => !p);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, goToPrev, goToNext]);

  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
        onClick={onClose}
        data-testid="story-viewer-overlay"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-md h-[80vh] max-h-[700px] bg-gradient-to-b from-[#0d1f0d] to-[#0a0a0a] rounded-lg overflow-hidden border border-green-500/30"
          style={{
            boxShadow: "0 0 40px rgba(74, 222, 128, 0.2), 0 0 80px rgba(74, 222, 128, 0.1)",
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
          data-testid="story-viewer-container"
        >
          <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 z-10">
            {stories.map((_, index) => (
              <div
                key={index}
                className="flex-1 h-1 bg-green-900/50 rounded-full overflow-hidden"
              >
                <div
                  className="h-full bg-green-400 transition-all duration-50"
                  style={{
                    width: index < currentIndex 
                      ? "100%" 
                      : index === currentIndex 
                        ? `${progress}%` 
                        : "0%",
                    boxShadow: "0 0 8px rgba(74, 222, 128, 0.6)",
                  }}
                />
              </div>
            ))}
          </div>

          <div className="absolute top-6 left-0 right-0 flex items-center justify-between px-4 z-10">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 p-[2px]"
                style={{
                  boxShadow: "0 0 10px rgba(74, 222, 128, 0.4)",
                }}
              >
                {currentStory.authorImage ? (
                  <img
                    src={currentStory.authorImage}
                    alt={currentStory.authorName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-[#0a0a0a] flex items-center justify-center">
                    <span className="text-green-400 font-mono font-bold">
                      {currentStory.authorName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <p 
                  className="text-green-400 font-mono text-sm font-medium"
                  style={{ textShadow: "0 0 10px rgba(74, 222, 128, 0.5)" }}
                >
                  {currentStory.authorName}
                </p>
                <p className="text-green-600 font-mono text-xs">
                  {formatTimeAgo(currentStory.createdAt)}
                </p>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={onClose}
              className="text-green-400"
              data-testid="button-close-story"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex items-center justify-center h-full pt-16 pb-20 px-4">
            {currentStory.imageUrl ? (
              <img
                src={currentStory.imageUrl}
                alt="Story"
                className="max-w-full max-h-full object-contain rounded-lg"
                style={{
                  boxShadow: "0 0 30px rgba(74, 222, 128, 0.2)",
                }}
              />
            ) : currentStory.content ? (
              <div 
                className="text-center px-8"
                style={{
                  textShadow: "0 0 20px rgba(74, 222, 128, 0.4)",
                }}
              >
                <p className="text-green-400 font-mono text-xl leading-relaxed">
                  {currentStory.content}
                </p>
              </div>
            ) : null}
          </div>

          {currentStory.content && currentStory.imageUrl && (
            <div 
              className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent"
            >
              <p 
                className="text-green-400 font-mono text-sm text-center"
                style={{ textShadow: "0 0 10px rgba(74, 222, 128, 0.5)" }}
              >
                {currentStory.content}
              </p>
            </div>
          )}

          <button
            onClick={(e) => { e.stopPropagation(); goToPrev(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-green-400/60 hover:text-green-400 transition-colors"
            disabled={currentIndex === 0}
            data-testid="button-prev-story"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          
          <button
            onClick={(e) => { e.stopPropagation(); goToNext(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-green-400/60 hover:text-green-400 transition-colors"
            data-testid="button-next-story"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

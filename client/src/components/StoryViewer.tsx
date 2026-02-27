import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
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
  const [direction, setDirection] = useState(1);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentStory = stories[currentIndex];

  const goToNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setDirection(1);
      setCurrentIndex(i => i + 1);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onClose]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex(i => i - 1);
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

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    holdTimer.current = setTimeout(() => setIsPaused(true), 150);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    setIsPaused(false);

    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      if (dx < 0) goToNext();
      else goToPrev();
    }
  };

  const handleTapZone = (side: "left" | "right") => {
    if (side === "left") goToPrev();
    else goToNext();
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center"
        onClick={onClose}
        data-testid="story-viewer-overlay"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-md h-[85vh] max-h-[750px] bg-gradient-to-b from-[#0d1f0d] to-[#0a0a0a] rounded-2xl overflow-hidden border border-green-500/30 select-none"
          style={{ boxShadow: "0 0 40px rgba(74,222,128,0.2), 0 0 80px rgba(74,222,128,0.1)" }}
          onClick={(e) => e.stopPropagation()}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          data-testid="story-viewer-container"
        >
          {/* Progress bars */}
          <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 z-30">
            {stories.map((_, index) => (
              <div key={index} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full"
                  style={{
                    width: index < currentIndex ? "100%" : index === currentIndex ? `${progress}%` : "0%",
                    transition: index === currentIndex ? "none" : undefined,
                    boxShadow: "0 0 6px rgba(74,222,128,0.6)",
                  }}
                />
              </div>
            ))}
          </div>

          {/* Sliding story content */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={{
                enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
                center: { x: 0, opacity: 1 },
                exit: (d: number) => ({ x: d > 0 ? "-100%" : "100%", opacity: 0 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              {/* Story background / image */}
              {currentStory.imageUrl && (
                <img
                  src={currentStory.imageUrl}
                  alt="Story"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70" />

              {/* Author header */}
              <div className="absolute top-8 left-0 right-14 flex items-center gap-3 px-4 z-10">
                <div
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 p-[2px] flex-shrink-0"
                  style={{ boxShadow: "0 0 10px rgba(74,222,128,0.4)" }}
                >
                  {currentStory.authorImage ? (
                    <img src={currentStory.authorImage} alt={currentStory.authorName} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-[#0a0a0a] flex items-center justify-center">
                      <span className="text-green-400 font-mono font-bold text-sm">
                        {currentStory.authorName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm drop-shadow">{currentStory.authorName}</p>
                  <p className="text-white/70 text-xs">{formatTimeAgo(currentStory.createdAt)}</p>
                </div>
              </div>

              {/* Main text content */}
              {currentStory.content && (
                <div className="absolute inset-0 flex items-center justify-center px-8">
                  <p
                    className="text-green-400 font-mono text-xl text-center leading-relaxed"
                    style={{ textShadow: "0 0 20px rgba(74,222,128,0.5)" }}
                  >
                    {currentStory.content}
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Close button — above everything */}
          <div className="absolute top-7 right-3 z-40">
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="text-white hover:text-white hover:bg-white/20 rounded-full"
              data-testid="button-close-story"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Tap zones — left (prev) and right (next) — above content, below close */}
          <button
            className="absolute left-0 top-0 bottom-0 w-2/5 z-20 cursor-pointer"
            onClick={(e) => { e.stopPropagation(); handleTapZone("left"); }}
            aria-label="Previous story"
            data-testid="button-prev-story"
          />
          <button
            className="absolute right-0 top-0 bottom-0 w-2/5 z-20 cursor-pointer"
            onClick={(e) => { e.stopPropagation(); handleTapZone("right"); }}
            aria-label="Next story"
            data-testid="button-next-story"
          />

          {/* Story count hint at bottom */}
          {stories.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1 z-30">
              {stories.map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-200 ${i === currentIndex ? "w-4 h-1.5 bg-green-400" : "w-1.5 h-1.5 bg-white/30"}`}
                />
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

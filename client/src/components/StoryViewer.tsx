import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { SiInstagram, SiTiktok, SiX, SiSnapchat } from "react-icons/si";

interface Story {
  id: number;
  content: string | null;
  imageUrl: string | null;
  authorName: string;
  authorImage: string | null;
  createdAt: string | null;
  expiresAt: string;
  sourceType?: string | null;
  sourceUrl?: string | null;
}

const PLATFORM_BADGE: Record<string, { label: string; Icon: React.ComponentType<{ className?: string }>; color: string }> = {
  instagram: { label: "Instagram", Icon: SiInstagram, color: "#e1306c" },
  tiktok: { label: "TikTok", Icon: SiTiktok, color: "#69c9d0" },
  twitter: { label: "X / Twitter", Icon: SiX, color: "#1d9bf0" },
  snapchat: { label: "Snapchat", Icon: SiSnapchat, color: "#fffc00" },
};

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
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchMoved = useRef(false);
  const touchNavigated = useRef(false);

  const currentStory = stories[currentIndex];

  const goToNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(i => i + 1);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onClose]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
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

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (touchNavigated.current) {
      touchNavigated.current = false;
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    if (e.clientX < rect.left + rect.width / 2) {
      goToPrev();
    } else {
      goToNext();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchMoved.current = false;
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsPaused(false);
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 10) {
      touchNavigated.current = true;
      if (touchStartX.current < window.innerWidth / 2) goToPrev();
      else goToNext();
    } else if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      touchNavigated.current = true;
      if (dx < 0) goToNext();
      else goToPrev();
    }
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center"
        onClick={onClose}
        data-viewer="story"
        data-testid="story-viewer-overlay"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-md h-[85vh] max-h-[750px] rounded-2xl overflow-hidden border border-green-500/30 select-none cursor-pointer"
          style={{
            background: "linear-gradient(to bottom, #0d1f0d, #0a0a0a)",
            boxShadow: "0 0 40px rgba(74,222,128,0.2), 0 0 80px rgba(74,222,128,0.1)",
            touchAction: "none",
          }}
          onClick={handleCardClick}
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          data-testid="story-viewer-container"
        >
          {/* Progress bars */}
          <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 z-10 pointer-events-none">
            {stories.map((_, index) => (
              <div key={index} className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.25)" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: index < currentIndex ? "100%" : index === currentIndex ? `${progress}%` : "0%",
                    background: "white",
                    boxShadow: "0 0 6px rgba(74,222,128,0.6)",
                  }}
                />
              </div>
            ))}
          </div>

          {/* Story content — crossfades instantly */}
          <AnimatePresence mode="sync">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 pointer-events-none"
            >
              {currentStory.imageUrl && (
                <img
                  src={currentStory.imageUrl}
                  alt="Story"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}

              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.5), transparent, rgba(0,0,0,0.7))" }}
              />

              <div className="absolute top-8 left-0 right-14 flex items-center gap-3 px-4">
                <div
                  className="w-10 h-10 rounded-full p-[2px] flex-shrink-0"
                  style={{
                    background: "linear-gradient(135deg, #22c55e, #16a34a)",
                    boxShadow: "0 0 10px rgba(74,222,128,0.4)",
                  }}
                >
                  {currentStory.authorImage ? (
                    <img src={currentStory.authorImage} alt={currentStory.authorName} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <div className="w-full h-full rounded-full flex items-center justify-center" style={{ background: "#0a0a0a" }}>
                      <span className="font-mono font-bold text-sm" style={{ color: "#4ade80" }}>
                        {currentStory.authorName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-sm drop-shadow" style={{ color: "white" }}>{currentStory.authorName}</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>{formatTimeAgo(currentStory.createdAt)}</p>
                </div>
              </div>

              {currentStory.content && (
                <div className="absolute inset-0 flex items-center justify-center px-8">
                  <p
                    className="font-mono text-xl text-center leading-relaxed"
                    style={{ color: "#4ade80", textShadow: "0 0 20px rgba(74,222,128,0.5)" }}
                  >
                    {currentStory.content}
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Close button — stops propagation so it doesn't trigger card navigation */}
          <div className="absolute top-7 right-3 z-20 flex flex-col items-end gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="rounded-full"
              style={{ color: "white" }}
              data-testid="button-close-story"
            >
              <X className="w-5 h-5" />
            </Button>
            {/* Platform attribution badge */}
            {currentStory.sourceType && currentStory.sourceUrl && (() => {
              const badge = PLATFORM_BADGE[currentStory.sourceType];
              if (!badge) return null;
              return (
                <a
                  href={currentStory.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => { e.stopPropagation(); setIsPaused(true); }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/20 text-xs font-medium transition-opacity hover:opacity-80"
                  style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
                  data-testid={`badge-platform-${currentStory.sourceType}`}
                >
                  <badge.Icon className="w-3 h-3" style={{ color: badge.color }} />
                  <span className="text-white/90">{badge.label}</span>
                </a>
              );
            })()}
          </div>

          {/* Story dot indicators */}
          {stories.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1 z-10 pointer-events-none">
              {stories.map((_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-200"
                  style={{
                    width: i === currentIndex ? "1rem" : "0.375rem",
                    height: "0.375rem",
                    background: i === currentIndex ? "#4ade80" : "rgba(255,255,255,0.3)",
                  }}
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

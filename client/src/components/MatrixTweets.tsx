import { useEffect, useState, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Heart, Repeat2, MessageCircle, ExternalLink } from "lucide-react";
import { SiX } from "react-icons/si";
import { Button } from "@/components/ui/button";

import { REFETCH_INTERVALS, BRAND_COLORS } from "@/lib/constants";

interface Tweet {
  id: string;
  text: string;
  createdAt: string;
  authorName: string;
  authorUsername: string;
  authorImage?: string;
  likes: number;
  retweets: number;
  replies: number;
}

export function MatrixTweets() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTweetIndex, setActiveTweetIndex] = useState(0);
  const animationFrameRef = useRef<number>();
  const columnsRef = useRef<{ position: number; speed: number; chars: string[] }[]>([]);
  
  const { data: tweets = [], isLoading, error } = useQuery<Tweet[]>({
    queryKey: ["/api/twitter/tweets?count=20"],
    refetchInterval: REFETCH_INTERVALS.TWEETS,
  });

  const matrixChars = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンXRPLEDGER0123456789";

  const initColumns = useCallback((width: number) => {
    const numColumns = Math.floor(width / 20);
    columnsRef.current = Array.from({ length: numColumns }, () => ({
      position: Math.random() * -30,
      speed: 0.3 + Math.random() * 0.5,
      chars: Array.from({ length: 30 }, () => 
        matrixChars[Math.floor(Math.random() * matrixChars.length)]
      ),
    }));
  }, [matrixChars]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      const { width, height } = container.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;
      initColumns(width);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const animate = () => {
      if (!ctx || !canvas) return;
      
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const fontSize = 14;
      ctx.font = `${fontSize}px monospace`;

      columnsRef.current.forEach((col, i) => {
        col.position += col.speed;
        
        if (col.position > 40) {
          col.position = -10;
          col.chars = Array.from({ length: 30 }, () => 
            matrixChars[Math.floor(Math.random() * matrixChars.length)]
          );
        }

        if (Math.random() > 0.95) {
          const idx = Math.floor(Math.random() * col.chars.length);
          col.chars[idx] = matrixChars[Math.floor(Math.random() * matrixChars.length)];
        }

        const x = i * 20 + 10;
        col.chars.forEach((char, j) => {
          const y = (col.position + j) * fontSize;
          if (y < 0 || y > canvas.height) return;
          
          const alpha = Math.max(0, 1 - j * 0.035);
          if (j === 0) {
            ctx.fillStyle = "#fff";
            ctx.shadowColor = "#fff";
            ctx.shadowBlur = 10;
          } else {
            ctx.fillStyle = `rgba(0, 255, 100, ${alpha})`;
            ctx.shadowColor = BRAND_COLORS.MATRIX_RAIN;
            ctx.shadowBlur = 5;
          }
          ctx.fillText(char, x, y);
          ctx.shadowBlur = 0;
        });
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [initColumns, matrixChars]);

  useEffect(() => {
    if (tweets.length === 0) return;
    
    const interval = setInterval(() => {
      setActiveTweetIndex((prev) => (prev + 1) % tweets.length);
    }, REFETCH_INTERVALS.TWEET_ROTATION);
    
    return () => clearInterval(interval);
  }, [tweets.length]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const currentTweet = tweets[activeTweetIndex];

  if (isLoading) {
    return (
      <div 
        className="w-full h-[500px] bg-black flex items-center justify-center"
        data-testid="container-matrix-tweets-loading"
      >
        <div className="text-green-400 font-mono animate-pulse">
          Connecting to the Matrix...
        </div>
      </div>
    );
  }

  if (error || tweets.length === 0) {
    return (
      <div 
        className="w-full h-[500px] bg-black flex items-center justify-center"
        data-testid="container-matrix-tweets-error"
      >
        <div className="text-green-400/50 font-mono text-center">
          <SiX className="w-8 h-8 mx-auto mb-2" />
          <p>Unable to load tweets</p>
          <p className="text-sm">Follow @AsiNaci2 on X</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[500px] bg-black overflow-hidden rounded-lg border border-green-500/30"
      data-testid="container-matrix-tweets"
    >
      <canvas 
        ref={canvasRef}
        className="absolute inset-0"
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black pointer-events-none" />
      
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <motion.div
          key={currentTweet?.id}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ duration: 0.5 }}
          className="relative max-w-lg w-full bg-black/90 backdrop-blur-sm border border-green-500/50 rounded-xl p-6 shadow-2xl shadow-green-500/20"
          data-testid="card-current-tweet"
        >
          <div className="absolute -top-3 -right-3 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <SiX className="w-3 h-3 text-black" />
          </div>
          
          <div className="flex items-start gap-3 mb-4">
            {currentTweet?.authorImage ? (
              <img
                src={currentTweet.authorImage}
                alt={currentTweet.authorName}
                className="w-12 h-12 rounded-full border-2 border-green-500/50"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-green-500/20 border-2 border-green-500/50 flex items-center justify-center text-green-400 font-bold">
                {currentTweet?.authorName?.charAt(0) || "X"}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-white" data-testid="text-tweet-author">
                  {currentTweet?.authorName}
                </span>
                <span className="text-green-400/70 text-sm" data-testid="text-tweet-username">
                  @{currentTweet?.authorUsername}
                </span>
                <span className="text-green-400/50 text-sm">
                  · {currentTweet?.createdAt && formatDate(currentTweet.createdAt)}
                </span>
              </div>
            </div>
          </div>
          
          <p 
            className="text-white/90 text-lg leading-relaxed mb-4 font-mono"
            data-testid="text-tweet-content"
          >
            {currentTweet?.text}
          </p>
          
          <div className="flex items-center gap-6 text-green-400/70 flex-wrap">
            <div className="flex items-center gap-1.5" data-testid="stat-tweet-replies">
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm">{currentTweet?.replies || 0}</span>
            </div>
            <div className="flex items-center gap-1.5" data-testid="stat-tweet-retweets">
              <Repeat2 className="w-4 h-4" />
              <span className="text-sm">{currentTweet?.retweets || 0}</span>
            </div>
            <div className="flex items-center gap-1.5" data-testid="stat-tweet-likes">
              <Heart className="w-4 h-4" />
              <span className="text-sm">{currentTweet?.likes || 0}</span>
            </div>
            <a
              href={`https://twitter.com/${currentTweet?.authorUsername}/status/${currentTweet?.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto"
              data-testid="link-view-on-twitter"
            >
              <Button variant="ghost" size="sm" className="text-green-400 gap-1">
                <ExternalLink className="w-4 h-4" />
                <span>View</span>
              </Button>
            </a>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
        {tweets.slice(0, 10).map((_, idx) => (
          <Button
            key={idx}
            variant="ghost"
            size="icon"
            onClick={() => setActiveTweetIndex(idx)}
            className={`min-w-0 min-h-0 h-3 rounded-full p-0 ${
              idx === activeTweetIndex
                ? "bg-green-400 w-5"
                : "bg-green-400/30 w-3"
            }`}
            data-testid={`button-tweet-dot-${idx}`}
          />
        ))}
      </div>

      <div className="absolute top-3 left-3 flex items-center gap-2 text-green-400/70 text-xs font-mono">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
        </span>
        LIVE FEED
      </div>
    </div>
  );
}

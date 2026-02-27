import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";

interface Story {
  id: number;
  content: string | null;
  imageUrl: string | null;
  authorName: string;
  authorImage: string | null;
  createdAt: string | null;
  expiresAt: string;
}

interface StoriesHeaderProps {
  onStoryClick: (stories: Story[], startIndex: number) => void;
}

export default function StoriesHeader({ onStoryClick }: StoriesHeaderProps) {
  const { data: stories = [], isLoading } = useQuery<Story[]>({
    queryKey: ["/api/stories"],
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto py-4 px-2 scrollbar-hide">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col items-center gap-2 shrink-0">
            <div className="w-16 h-16 rounded-full bg-green-900/30 animate-pulse" />
            <div className="w-12 h-3 bg-green-900/30 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (stories.length === 0) {
    return null;
  }

  const groupedByAuthor = stories.reduce((acc, story) => {
    const key = story.authorName;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(story);
    return acc;
  }, {} as Record<string, Story[]>);

  return (
    <div 
      className="flex gap-3 overflow-x-auto py-3 px-2 scrollbar-hide"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      data-testid="stories-header"
    >
      {Object.entries(groupedByAuthor).map(([authorName, authorStories]) => {
        const latestStory = authorStories[authorStories.length - 1];
        const hasMultiple = authorStories.length > 1;
        
        const startIndex = stories.findIndex(s => s.id === authorStories[0].id);

        return (
          <button
            key={authorName}
            onClick={() => onStoryClick(stories, startIndex)}
            className="flex flex-col items-center gap-2 shrink-0 group"
            data-testid={`story-bubble-${authorName.replace(/\s+/g, "-").toLowerCase()}`}
          >
            <div 
              className={`relative w-14 h-14 rounded-full p-[2px] transition-all duration-300 group-hover:scale-105 ${
                hasMultiple 
                  ? "bg-gradient-to-tr from-green-400 via-green-500 to-emerald-400" 
                  : "bg-gradient-to-tr from-green-500 to-green-400"
              }`}
              style={{
                boxShadow: "0 0 12px rgba(74, 222, 128, 0.4), 0 0 24px rgba(74, 222, 128, 0.2)",
              }}
            >
              <div className="w-full h-full rounded-full bg-[#0a0a0a] p-[2px] overflow-hidden">
                {latestStory.imageUrl ? (
                  <img
                    src={latestStory.imageUrl}
                    alt={authorName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : latestStory.authorImage ? (
                  <img
                    src={latestStory.authorImage}
                    alt={authorName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-green-900/50 to-green-950 flex items-center justify-center">
                    <span className="text-green-400 font-mono text-lg font-bold">
                      {authorName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              
              {hasMultiple && (
                <div 
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-[10px] font-bold text-black border-2 border-[#0a0a0a]"
                  style={{
                    boxShadow: "0 0 8px rgba(74, 222, 128, 0.6)",
                  }}
                >
                  {authorStories.length}
                </div>
              )}
            </div>
            
            <span 
              className="text-xs font-mono text-green-400/80 truncate max-w-[70px] group-hover:text-green-300 transition-colors"
              style={{
                textShadow: "0 0 10px rgba(74, 222, 128, 0.3)",
              }}
            >
              {authorName.split(" ")[0]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

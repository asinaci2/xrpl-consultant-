import { useState } from "react";
import StoriesHeader from "./StoriesHeader";
import StoryViewer from "./StoryViewer";

interface Story {
  id: number;
  content: string | null;
  imageUrl: string | null;
  authorName: string;
  authorImage: string | null;
  createdAt: string | null;
  expiresAt: string;
}

export function Stories() {
  const [viewerState, setViewerState] = useState<{
    isOpen: boolean;
    stories: Story[];
    startIndex: number;
  }>({
    isOpen: false,
    stories: [],
    startIndex: 0,
  });

  const handleStoryClick = (stories: Story[], startIndex: number) => {
    setViewerState({
      isOpen: true,
      stories,
      startIndex,
    });
  };

  const handleCloseViewer = () => {
    setViewerState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  };

  return (
    <>
      <div 
        className="bg-gradient-to-r from-[#0a0a0a] via-[#0d1f0d] to-[#0a0a0a] border-b border-green-500/20"
        data-testid="stories-section"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <StoriesHeader onStoryClick={handleStoryClick} />
        </div>
      </div>

      {viewerState.isOpen && (
        <StoryViewer
          stories={viewerState.stories}
          startIndex={viewerState.startIndex}
          onClose={handleCloseViewer}
        />
      )}
    </>
  );
}

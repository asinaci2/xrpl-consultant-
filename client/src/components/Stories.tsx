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
      <section 
        className="py-4 bg-gradient-to-b from-[#0a0a0a] to-background border-b border-green-500/10"
        data-testid="stories-section"
      >
        <div className="container mx-auto px-4">
          <StoriesHeader onStoryClick={handleStoryClick} />
        </div>
      </section>

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

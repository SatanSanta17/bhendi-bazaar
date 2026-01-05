import { useState } from "react";

interface ShareData {
  title?: string;
  text?: string;
  url: string;
}

interface UseShareReturn {
  share: (data: ShareData) => Promise<void>;
  isSharing: boolean;
  isSupported: boolean;
  copySuccess: boolean;
}

export function useShare(): UseShareReturn {
  const [isSharing, setIsSharing] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const isSupported = typeof navigator !== "undefined" && !!navigator.share;

  const share = async (data: ShareData) => {
    setIsSharing(true);
    setCopySuccess(false);

    try {
      // Try native share first if supported
      if (navigator.share) {
        await navigator.share({
          title: data.title,
          text: data.text,
          url: data.url,
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(data.url);
        setCopySuccess(true);
        
        // Reset copy success after 2 seconds
        setTimeout(() => {
          setCopySuccess(false);
        }, 2000);
      }
    } catch (error) {
      // User cancelled or error occurred
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("Error sharing:", error);
        
        // Try clipboard as final fallback
        try {
          await navigator.clipboard.writeText(data.url);
          setCopySuccess(true);
          setTimeout(() => {
            setCopySuccess(false);
          }, 2000);
        } catch (clipboardError) {
          console.error("Error copying to clipboard:", clipboardError);
        }
      }
    } finally {
      setIsSharing(false);
    }
  };

  return {
    share,
    isSharing,
    isSupported,
    copySuccess,
  };
}
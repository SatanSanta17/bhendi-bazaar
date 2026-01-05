import { useState } from "react";

interface ShareData {
  title?: string;
  text?: string;
  url: string;
}

interface UseShareReturn {
  copyToClipboard: (url: string) => Promise<boolean>;
  isCopying: boolean;
  copySuccess: boolean;
}

export function useShare(): UseShareReturn {
  const [isCopying, setIsCopying] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const copyToClipboard = async (url: string): Promise<boolean> => {
    setIsCopying(true);
    setCopySuccess(false);

    try {
      await navigator.clipboard.writeText(url);
      setCopySuccess(true);

      // Reset copy success after 2 seconds
      setTimeout(() => {
        setCopySuccess(false);
      }, 2000);

      return true;
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      return false;
    } finally {
      setIsCopying(false);
    }
  };

  return {
    copyToClipboard,
    isCopying,
    copySuccess,
  };
}
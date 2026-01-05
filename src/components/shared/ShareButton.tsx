"use client";

import { Button } from "@/components/ui/button";
import { useShare } from "@/hooks/core/useShare";
import { Share2, Check, Copy } from "lucide-react";

interface ShareButtonProps {
  url: string;
  title?: string;
  text?: string;
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showLabel?: boolean;
}

export function ShareButton({
  url,
  title,
  text,
  variant = "outline",
  size = "sm",
  className,
  showLabel = true,
}: ShareButtonProps) {
  const { share, isSharing, isSupported, copySuccess } = useShare();

  const handleShare = async () => {
    await share({ url, title, text });
  };

  return (
    <Button
      onClick={handleShare}
      disabled={isSharing}
      variant={variant}
      size={size}
      className={className}
    >
      {copySuccess ? (
        <>
          <Check className="h-4 w-4" />
          {showLabel && <span className="ml-2">Copied!</span>}
        </>
      ) : (
        <>
          {isSupported ? (
            <Share2 className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          {showLabel && (
            <span className="ml-2">
              {isSharing ? "Sharing..." : isSupported ? "Share" : "Copy Link"}
            </span>
          )}
        </>
      )}
    </Button>
  );
}
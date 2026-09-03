import { useEffect } from "react";
import type { Attachment } from "@/lib/types";
import { sizeLabel } from "@/lib/format";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download, ExternalLink, Image as ImageIcon } from "lucide-react";

interface PhotoPreviewModalProps {
  photo: Attachment | null;
  photos?: Attachment[];
  isOpen: boolean;
  onClose: () => void;
  onSelectPhoto?: (photo: Attachment) => void;
}

export function PhotoPreviewModal({
  photo,
  photos,
  isOpen,
  onClose,
  onSelectPhoto,
}: PhotoPreviewModalProps) {
  if (!photo) return null;

  const list = photos ?? [];
  const currentIndex = list.findIndex((p) => p.id === photo.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < list.length - 1;

  const handlePrev = () => {
    if (hasPrev && onSelectPhoto && list[currentIndex - 1]) {
      onSelectPhoto(list[currentIndex - 1]!);
    }
  };

  const handleNext = () => {
    if (hasNext && onSelectPhoto && list[currentIndex + 1]) {
      onSelectPhoto(list[currentIndex + 1]!);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, currentIndex, hasPrev, hasNext]);

  const apiBase = (import.meta.env["VITE_API_URL"] || "").replace(/\/api\/?$/, "");
  const photoUrl = photo.signedUrl
    ? photo.signedUrl.startsWith("http")
      ? photo.signedUrl
      : `${apiBase}${photo.signedUrl}`
    : photo.originalUrl || photo.dataUrl;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col p-4 sm:p-6 overflow-hidden">
        <DialogHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between pr-8">
          <div className="min-w-0 flex-1">
            <DialogTitle className="truncate text-base sm:text-lg font-bold text-ink flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary shrink-0" />
              <span className="truncate">{photo.caption || photo.tag || photo.name || "Photo Preview"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
              {photo.tag ? (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
                  {photo.tag}
                </span>
              ) : null}
              {photo.size ? <span>{sizeLabel(photo.size)}</span> : null}
              {list.length > 1 ? (
                <span>
                  ({currentIndex + 1} of {list.length})
                </span>
              ) : null}
            </DialogDescription>
          </div>

          <div className="flex items-center gap-2 pt-2 sm:pt-0 shrink-0">
            <Button asChild variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <a href={photoUrl} download={photo.name || "photo.jpg"}>
                <Download className="h-3.5 w-3.5 text-primary" /> Download
              </a>
            </Button>
            <Button asChild variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <a
                href={photoUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3.5 w-3.5" /> New Tab
              </a>
            </Button>
          </div>
        </DialogHeader>

        {/* Photo Viewport */}
        <div className="relative mt-4 flex-1 min-h-[45vh] max-h-[70vh] flex items-center justify-center rounded-lg border border-border bg-ink/90 overflow-hidden select-none">
          <img
            src={photo.originalUrl || photo.dataUrl}
            alt={photo.caption || photo.tag || "Meeting Photo"}
            className="max-h-[68vh] max-w-full object-contain rounded"
          />

          {/* Previous / Next Arrow Buttons */}
          {hasPrev ? (
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white/90 backdrop-blur hover:bg-black/80 hover:text-white transition-all shadow-md"
              title="Previous photo (Left arrow)"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          ) : null}

          {hasNext ? (
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white/90 backdrop-blur hover:bg-black/80 hover:text-white transition-all shadow-md"
              title="Next photo (Right arrow)"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          ) : null}

          {/* Caption banner inside viewport if caption exists */}
          {photo.caption ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 sm:p-4 text-center text-white text-xs sm:text-sm font-medium">
              {photo.caption}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { CHAPTER, longDate } from "@/lib/format";
import { Check, Eye, EyeOff, Move, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

interface CoverPhotoSetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onApply: (croppedDataUrl: string) => void;
  meetingDate?: string;
}

export function CoverPhotoSetterModal({
  isOpen,
  onClose,
  imageSrc,
  onApply,
  meetingDate,
}: CoverPhotoSetterModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [showOverlay, setShowOverlay] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ pointerX: number; pointerY: number; startX: number; startY: number } | null>(
    null,
  );

  // Aspect ratio of the banner: 16:6 (~2.67:1)
  const BANNER_ASPECT = 16 / 6;

  // Load natural dimensions when image changes or modal opens
  useEffect(() => {
    if (!imageSrc || !isOpen) return;
    const img = new Image();
    img.onload = () => {
      setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [imageSrc, isOpen]);

  // Compute boundaries and dimensions
  const getRenderMetrics = (currentZoom: number) => {
    if (!containerRef.current || !naturalSize) return null;
    const containerRect = containerRef.current.getBoundingClientRect();
    const boxW = containerRect.width;
    const boxH = containerRect.height;

    const imgAspect = naturalSize.width / naturalSize.height;
    const boxAspect = boxW / boxH;

    let baseW: number;
    let baseH: number;

    // Image covers the box at zoom = 1
    if (imgAspect > boxAspect) {
      baseH = boxH;
      baseW = boxH * imgAspect;
    } else {
      baseW = boxW;
      baseH = boxW / imgAspect;
    }

    const currentW = baseW * currentZoom;
    const currentH = baseH * currentZoom;

    // Minimum and maximum allowed offsets so the image always covers the box
    const minX = boxW - currentW;
    const maxX = 0;
    const minY = boxH - currentH;
    const maxY = 0;

    return { boxW, boxH, currentW, currentH, minX, maxX, minY, maxY };
  };

  // Center the image initially or on reset
  const resetToCenter = (newZoom = 1) => {
    const metrics = getRenderMetrics(newZoom);
    if (!metrics) {
      setZoom(newZoom);
      setOffset({ x: 0, y: 0 });
      return;
    }
    setZoom(newZoom);
    setOffset({
      x: (metrics.boxW - metrics.currentW) / 2,
      y: (metrics.boxH - metrics.currentH) / 2,
    });
  };

  useEffect(() => {
    if (!isOpen || !naturalSize) return;
    // Delay slightly for container layout measurement
    const timer = setTimeout(() => {
      resetToCenter(1);
    }, 50);
    return () => clearTimeout(timer);
  }, [isOpen, naturalSize]);

  // Adjust zoom while keeping center anchored
  const handleZoomChange = (newZoom: number) => {
    const clampedZoom = Math.min(3, Math.max(1, newZoom));
    const oldMetrics = getRenderMetrics(zoom);
    const newMetrics = getRenderMetrics(clampedZoom);

    if (oldMetrics && newMetrics) {
      // Keep center of the box anchored
      const centerX = -offset.x + oldMetrics.boxW / 2;
      const centerY = -offset.y + oldMetrics.boxH / 2;
      const ratio = newMetrics.currentW / oldMetrics.currentW;

      const newCenterX = centerX * ratio;
      const newCenterY = centerY * ratio;

      let newX = -(newCenterX - newMetrics.boxW / 2);
      let newY = -(newCenterY - newMetrics.boxH / 2);

      newX = Math.min(newMetrics.maxX, Math.max(newMetrics.minX, newX));
      newY = Math.min(newMetrics.maxY, Math.max(newMetrics.minY, newY));

      setOffset({ x: newX, y: newY });
    }
    setZoom(clampedZoom);
  };

  // Pointer drag handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // primary click only
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      startX: offset.x,
      startY: offset.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStartRef.current) return;
    const metrics = getRenderMetrics(zoom);
    if (!metrics) return;

    const dx = e.clientX - dragStartRef.current.pointerX;
    const dy = e.clientY - dragStartRef.current.pointerY;

    let nextX = dragStartRef.current.startX + dx;
    let nextY = dragStartRef.current.startY + dy;

    // Clamp offset to ensure container is fully covered
    nextX = Math.min(metrics.maxX, Math.max(metrics.minX, nextX));
    nextY = Math.min(metrics.maxY, Math.max(metrics.minY, nextY));

    setOffset({ x: nextX, y: nextY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      dragStartRef.current = null;
    }
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    handleZoomChange(zoom + delta);
  };

  // Crop & generate final image
  const handleApply = () => {
    const metrics = getRenderMetrics(zoom);
    if (!metrics || !naturalSize) return;

    const img = new Image();
    img.onload = () => {
      // Standard target resolution for crisp banner displays
      const targetW = 1600;
      const targetH = Math.round(targetW / BANNER_ASPECT); // ~600px

      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Coordinate mapping from screen viewport to original natural image
      const scaleToNatural = naturalSize.width / metrics.currentW;
      const sourceX = -offset.x * scaleToNatural;
      const sourceY = -offset.y * scaleToNatural;
      const sourceW = metrics.boxW * scaleToNatural;
      const sourceH = metrics.boxH * scaleToNatural;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, sourceX, sourceY, sourceW, sourceH, 0, 0, targetW, targetH);

      const croppedDataUrl = canvas.toDataURL("image/jpeg", 0.88);
      onApply(croppedDataUrl);
      onClose();
    };
    img.src = imageSrc;
  };

  const metrics = getRenderMetrics(zoom);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl overflow-hidden p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold uppercase tracking-wide text-ink">
            <Move className="h-5 w-5 text-primary" /> Adjust Cover Photo
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-ink-soft">
            Drag the photo to reposition and use the zoom slider to select the exact banner area.
          </DialogDescription>
        </DialogHeader>

        {/* Viewport Frame with 16:6 banner aspect ratio */}
        <div className="space-y-4">
          <div
            ref={containerRef}
            style={{ aspectRatio: `${BANNER_ASPECT}` }}
            className="relative w-full cursor-grab overflow-hidden rounded-lg border-2 border-primary/40 bg-ink select-none shadow-inner active:cursor-grabbing"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
          >
            {naturalSize && metrics ? (
              <img
                src={imageSrc}
                alt="Crop preview"
                draggable={false}
                style={{
                  width: `${metrics.currentW}px`,
                  height: `${metrics.currentH}px`,
                  transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
                  maxWidth: "none",
                  maxHeight: "none",
                }}
                className="pointer-events-none absolute left-0 top-0 transition-transform duration-75 ease-out"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-white/50">
                Loading image preview…
              </div>
            )}

            {/* Subtle grid lines for composition */}
            <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 border border-white/10 opacity-30">
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-b border-white/20" />
              <div className="border-r border-white/20" />
              <div className="border-r border-white/20" />
              <div />
            </div>

            {/* Live Header Text Overlay Preview */}
            {showOverlay ? (
              <div className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/85 via-black/25 to-transparent p-4 sm:p-6 text-white">
                <p className="font-display text-[10px] sm:text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
                  {CHAPTER}
                </p>
                <h2 className="font-display text-base sm:text-2xl font-bold uppercase tracking-wide text-white">
                  {meetingDate ? longDate(meetingDate) : "Meeting Record"}
                </h2>
              </div>
            ) : null}

            {/* Reposition instruction hint tag */}
            <div className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white/90 backdrop-blur">
              <Move className="h-3 w-3 text-primary" /> Drag to reposition
            </div>
          </div>

          {/* Controls Bar: Zoom, Center Reset & Preview Toggle */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-lg border border-border bg-secondary/40 p-3 sm:p-4">
            <div className="flex w-full sm:w-auto items-center gap-3 flex-1 max-w-sm">
              <button
                type="button"
                onClick={() => handleZoomChange(zoom - 0.15)}
                className="rounded p-1 text-muted-foreground hover:text-ink"
                title="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <Slider
                value={[zoom]}
                min={1}
                max={3}
                step={0.05}
                onValueChange={([val]) => val && handleZoomChange(val)}
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => handleZoomChange(zoom + 0.15)}
                className="rounded p-1 text-muted-foreground hover:text-ink"
                title="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <span className="text-xs font-mono text-muted-foreground w-12 text-right">
                {(zoom * 100).toFixed(0)}%
              </span>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => resetToCenter(1)}
                className="h-8 text-xs"
              >
                <RotateCcw className="mr-1 h-3 w-3" /> Center
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowOverlay((v) => !v)}
                className="h-8 text-xs"
              >
                {showOverlay ? (
                  <>
                    <EyeOff className="mr-1 h-3 w-3" /> Hide overlay
                  </>
                ) : (
                  <>
                    <Eye className="mr-1 h-3 w-3" /> Preview overlay
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-2 flex flex-row items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleApply} className="gap-1.5">
            <Check className="h-4 w-4" /> Set as Cover Photo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useEffect, useMemo, useState } from "react";
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
import { Label } from "@/components/ui/label";

const PREVIEW_WIDTH = 200;
const PREVIEW_HEIGHT = 200;
const OUTPUT_WIDTH = 50;
const OUTPUT_HEIGHT = 50;

type ImageDimensions = {
  width: number;
  height: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

async function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = src;
  });
}

type Props = {
  open: boolean;
  imageSrc: string;
  fileName: string;
  mimeType: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: (file: File, previewUrl: string) => void;
};

export function CounterImageCropDialog({
  open,
  imageSrc,
  fileName,
  mimeType,
  onOpenChange,
  onConfirm,
}: Props) {
  const [imageDimensions, setImageDimensions] = useState<ImageDimensions | null>(
    null,
  );
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState<{
    pointerX: number;
    pointerY: number;
    startX: number;
    startY: number;
  } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!open || !imageSrc) {
      return;
    }

    let active = true;

    void loadImage(imageSrc)
      .then((image) => {
        if (!active) {
          return;
        }
        setImageDimensions({
          width: image.naturalWidth || image.width,
          height: image.naturalHeight || image.height,
        });
        setZoom(1);
        setOffset({ x: 0, y: 0 });
      })
      .catch(() => {
        if (active) {
          setImageDimensions(null);
        }
      });

    return () => {
      active = false;
    };
  }, [open, imageSrc]);

  const renderedSize = useMemo(() => {
    if (!imageDimensions) {
      return null;
    }

    const baseScale = Math.max(
      PREVIEW_WIDTH / imageDimensions.width,
      PREVIEW_HEIGHT / imageDimensions.height,
    );

    return {
      width: imageDimensions.width * baseScale * zoom,
      height: imageDimensions.height * baseScale * zoom,
    };
  }, [imageDimensions, zoom]);

  const clampedOffset = useMemo(() => {
    if (!renderedSize) {
      return offset;
    }

    const maxX = Math.max(0, (renderedSize.width - PREVIEW_WIDTH) / 2);
    const maxY = Math.max(0, (renderedSize.height - PREVIEW_HEIGHT) / 2);

    return {
      x: clamp(offset.x, -maxX, maxX),
      y: clamp(offset.y, -maxY, maxY),
    };
  }, [offset, renderedSize]);

  useEffect(() => {
    if (clampedOffset.x !== offset.x || clampedOffset.y !== offset.y) {
      setOffset(clampedOffset);
    }
  }, [clampedOffset, offset.x, offset.y]);

  useEffect(() => {
    if (!dragStart) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (!renderedSize) {
        return;
      }

      const nextOffset = {
        x: dragStart.startX + (event.clientX - dragStart.pointerX),
        y: dragStart.startY + (event.clientY - dragStart.pointerY),
      };

      const maxX = Math.max(0, (renderedSize.width - PREVIEW_WIDTH) / 2);
      const maxY = Math.max(0, (renderedSize.height - PREVIEW_HEIGHT) / 2);

      setOffset({
        x: clamp(nextOffset.x, -maxX, maxX),
        y: clamp(nextOffset.y, -maxY, maxY),
      });
    };

    const handlePointerUp = () => {
      setDragStart(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [dragStart, renderedSize]);

  const handleConfirm = async () => {
    if (!imageDimensions || !renderedSize) {
      return;
    }

    setIsExporting(true);

    try {
      const image = await loadImage(imageSrc);
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_WIDTH;
      canvas.height = OUTPUT_HEIGHT;

      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Canvas not supported");
      }

      const exportScale = OUTPUT_WIDTH / PREVIEW_WIDTH;
      const imageLeft = (PREVIEW_WIDTH - renderedSize.width) / 2 + clampedOffset.x;
      const imageTop = (PREVIEW_HEIGHT - renderedSize.height) / 2 + clampedOffset.y;

      context.drawImage(
        image,
        imageLeft * exportScale,
        imageTop * exportScale,
        renderedSize.width * exportScale,
        renderedSize.height * exportScale,
      );

      const outputType =
        mimeType === "image/png" || mimeType === "image/webp"
          ? mimeType
          : "image/jpeg";
      const extension =
        outputType === "image/png"
          ? "png"
          : outputType === "image/webp"
            ? "webp"
            : "jpg";

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (value) => {
            if (value) {
              resolve(value);
              return;
            }
            reject(new Error("Unable to export cropped image"));
          },
          outputType,
          0.92,
        );
      });

      const sanitizedName = fileName.replace(/\.[^.]+$/, "");
      const croppedFile = new File([blob], `${sanitizedName}-cropped.${extension}`, {
        type: outputType,
      });
      const previewUrl = URL.createObjectURL(blob);
      onConfirm(croppedFile, previewUrl);
      onOpenChange(false);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Crop Counter Icon</DialogTitle>
          <DialogDescription>
            Drag and zoom the image. The uploaded file will be cropped to 50 x 50
            pixels.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-center">
            <div
              className="relative overflow-hidden rounded-xl border bg-muted/30 touch-none"
              style={{ width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT }}
            >
              {renderedSize ? (
                <img
                  src={imageSrc}
                  alt="Crop preview"
                  className="absolute max-w-none select-none"
                  style={{
                    width: renderedSize.width,
                    height: renderedSize.height,
                    left:
                      (PREVIEW_WIDTH - renderedSize.width) / 2 + clampedOffset.x,
                    top:
                      (PREVIEW_HEIGHT - renderedSize.height) / 2 + clampedOffset.y,
                    cursor: dragStart ? "grabbing" : "grab",
                  }}
                  draggable={false}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    setDragStart({
                      pointerX: event.clientX,
                      pointerY: event.clientY,
                      startX: clampedOffset.x,
                      startY: clampedOffset.y,
                    });
                  }}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Loading image...
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Zoom</Label>
              <span className="text-xs text-muted-foreground">
                {zoom.toFixed(2)}x
              </span>
            </div>
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.01}
              onValueChange={([value]) => setZoom(value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleConfirm()}
            disabled={!renderedSize || isExporting}
          >
            {isExporting ? "Cropping..." : "Use Cropped Image"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

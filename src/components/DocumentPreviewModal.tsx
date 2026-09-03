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
import { Download, ExternalLink, FileText } from "lucide-react";

interface DocumentPreviewModalProps {
  document: Attachment | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentPreviewModal({
  document: doc,
  isOpen,
  onClose,
}: DocumentPreviewModalProps) {
  if (!doc) return null;

  const mime = doc.mime?.toLowerCase() || "";
  const name = doc.name?.toLowerCase() || "";

  const isPdf = mime.includes("pdf") || name.endsWith(".pdf");
  const isImage =
    mime.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(name);
  const isText =
    mime.startsWith("text/") || /\.(txt|csv|json|md|log)$/i.test(name);

  const apiBase = (import.meta.env["VITE_API_URL"] || "").replace(/\/api\/?$/, "");
  const fileUrl = doc.signedUrl
    ? doc.signedUrl.startsWith("http")
      ? doc.signedUrl
      : `${apiBase}${doc.signedUrl}`
    : doc.dataUrl;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-4 sm:p-6 overflow-hidden">
        <DialogHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between pr-8">
          <div className="min-w-0 flex-1">
            <DialogTitle className="truncate text-base sm:text-lg font-bold text-ink flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary shrink-0" />
              <span className="truncate">{doc.name}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              {sizeLabel(doc.size)} · {doc.mime || "Attached document"}
            </DialogDescription>
          </div>

          <div className="flex items-center gap-2 pt-2 sm:pt-0 shrink-0">
            <Button asChild variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <a href={fileUrl} download={doc.name}>
                <Download className="h-3.5 w-3.5 text-primary" /> Download
              </a>
            </Button>
            <Button asChild variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5" /> New Tab
              </a>
            </Button>
          </div>
        </DialogHeader>

        {/* Document Preview Area */}
        <div className="mt-4 flex-1 min-h-0 overflow-auto rounded-lg border border-border bg-secondary/20">
          {isPdf ? (
            <iframe
              src={doc.dataUrl}
              title={doc.name}
              className="w-full h-[65vh] rounded-md bg-white border-none"
            />
          ) : isImage ? (
            <div className="flex h-full min-h-[50vh] max-h-[65vh] items-center justify-center p-4">
              <img
                src={doc.dataUrl}
                alt={doc.name}
                className="max-h-full max-w-full rounded object-contain shadow-sm"
              />
            </div>
          ) : isText ? (
            <iframe
              src={doc.dataUrl}
              title={doc.name}
              className="w-full h-[65vh] rounded-md bg-card p-4 font-mono text-xs text-ink"
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="rounded-full bg-primary/10 p-4 mb-4">
                <FileText className="h-12 w-12 text-primary" />
              </div>
              <p className="font-display text-lg font-semibold text-ink break-all max-w-md">
                {doc.name}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {sizeLabel(doc.size)}
              </p>
              <p className="text-xs sm:text-sm text-ink-soft mt-3 max-w-md leading-relaxed">
                Direct in-browser preview is best suited for PDF, image, and text documents.
                You can download this file or open it with your device's default application.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 justify-center">
                <Button asChild className="gap-2">
                  <a href={doc.dataUrl} download={doc.name}>
                    <Download className="h-4 w-4" /> Download Document
                  </a>
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

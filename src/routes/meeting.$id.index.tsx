import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import type { Attachment, Meeting } from "@/lib/types";
import { deleteMeeting, getMeeting } from "@/lib/storage";
import { MeetingView } from "@/components/MeetingView";
import { SiteFooter, SiteHeader } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { downloadPpt } from "@/lib/exportPpt";
import { downloadPdf } from "@/lib/exportPdf";
import { ArrowLeft, FileDown, Loader2, Pencil, Presentation, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { CHAPTER } from "@/lib/format";

export const Route = createFileRoute("/meeting/$id/")({
  head: () => ({
    meta: [
      { title: `Meeting Record — ${CHAPTER}` },
      {
        name: "description",
        content: `A ${CHAPTER} weekly meeting record: scorecard, highlights, recognitions and photos.`,
      },
      { property: "og:title", content: `Meeting Record — ${CHAPTER}` },
      {
        property: "og:description",
        content: `A ${CHAPTER} weekly meeting record: scorecard, highlights, recognitions and photos.`,
      },
    ],
  }),
  component: MeetingPage,
});

function MeetingPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState<Meeting | null | undefined>(undefined);
  const [initialDoc, setInitialDoc] = useState<Attachment | null>(null);
  const [initialPhoto, setInitialPhoto] = useState<Attachment | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void getMeeting(id).then((m) => {
      setMeeting(m ?? null);
      if (m && typeof window !== "undefined") {
        const search = new URLSearchParams(window.location.search);
        const docId = search.get("doc");
        const photoId = search.get("photo");
        if (docId) {
          const d = m.attachments.find((a) => a.id === docId && a.kind === "doc");
          if (d) setInitialDoc(d);
        } else if (photoId) {
          const p = m.attachments.find((a) => a.id === photoId && a.kind === "photo");
          if (p) setInitialPhoto(p);
        }
      }
    });
  }, [id]);

  if (meeting === undefined) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-16 text-sm text-muted-foreground">
          Loading meeting…
        </main>
      </div>
    );
  }

  if (meeting === null) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-20 text-center">
          <h1 className="font-display text-3xl font-bold text-ink">Meeting not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This entry may have been removed, or was created in a different browser.
          </p>
          <Button asChild className="mt-6">
            <Link to="/">Back to archive</Link>
          </Button>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const m = meeting;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-3 sm:px-4 py-4 sm:py-8">
        <div className="no-print mb-4 sm:mb-6 flex flex-wrap items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="h-9 px-2 sm:px-3 text-xs sm:text-sm">
            <Link to="/">
              <ArrowLeft className="mr-1 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Archive
            </Link>
          </Button>
          <span className="flex-1" />
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-9 px-2 sm:px-3 text-xs sm:text-sm"
          >
            <Link to="/meeting/$id/edit" params={{ id: m.id }}>
              <Pencil className="mr-1 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Edit
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-2 sm:px-3 text-xs sm:text-sm"
            disabled={pdfBusy}
            onClick={async () => {
              if (!printRef.current) return;
              setPdfBusy(true);
              try {
                await toast.promise(downloadPdf(printRef.current, m), {
                  loading: "Generating PDF…",
                  success: "PDF downloaded",
                  error: "Could not generate PDF",
                });
              } catch (err) {
                console.error("PDF download failed, falling back to print dialog:", err);
                window.print();
              } finally {
                setPdfBusy(false);
              }
            }}
          >
            {pdfBusy ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
            ) : (
              <FileDown className="mr-1 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            )}
            <span className="hidden sm:inline">Download </span>PDF
          </Button>
          <Button
            size="sm"
            className="h-9 px-2.5 sm:px-3 text-xs sm:text-sm"
            onClick={() => {
              toast.promise(downloadPpt(m), {
                loading: "Building slide deck…",
                success: "PPT downloaded",
                error: "Could not build the deck",
              });
            }}
          >
            <Presentation className="mr-1 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Download </span>PPT
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-2 text-muted-foreground hover:text-destructive"
            onClick={() => {
              if (confirm("Delete this meeting record permanently?")) {
                void deleteMeeting(m.id).then(() => navigate({ to: "/" }));
              }
            }}
          >
            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
        </div>

        <div ref={printRef} className="panel overflow-hidden print-page">
          <MeetingView m={m} initialDoc={initialDoc} initialPhoto={initialPhoto} />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

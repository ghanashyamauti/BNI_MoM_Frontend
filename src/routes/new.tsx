import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { emptyMeeting, type Meeting } from "@/lib/types";
import { saveMeeting } from "@/lib/storage";
import { MeetingForm } from "@/components/MeetingForm";
import { MeetingView } from "@/components/MeetingView";
import { SiteFooter, SiteHeader } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { CHAPTER } from "@/lib/format";

export const Route = createFileRoute("/new")({
  head: () => ({
    meta: [
      { title: `New Meeting Entry — ${CHAPTER}` },
      {
        name: "description",
        content: `Record this week's ${CHAPTER} chapter meeting: scorecard, recognitions, photos and attachments.`,
      },
      { property: "og:title", content: `New Meeting Entry — ${CHAPTER}` },
      {
        property: "og:description",
        content: "Capture the week's chapter meeting and publish a shareable meeting page.",
      },
    ],
  }),
  component: NewEntry,
});

function NewEntry() {
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState<Meeting>(() => emptyMeeting());
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  const confirm = async () => {
    setSaving(true);
    try {
      const saved = await saveMeeting(meeting);
      toast.success("Meeting published to the archive");
      await navigate({ to: "/meeting/$id", params: { id: saved.id } });
    } catch {
      toast.error("Could not save this meeting");
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-3 sm:px-4 py-6 sm:py-10">
        {preview ? (
          <>
            <div className="no-print mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-primary/30 bg-accent px-4 sm:px-5 py-3 sm:py-4">
              <div>
                <p className="eyebrow">Preview</p>
                <p className="text-xs sm:text-sm text-ink-soft">
                  This is how the meeting page will look. Nothing is saved yet.
                </p>
              </div>
              <div className="flex gap-2 self-end sm:self-auto">
                <Button variant="outline" size="sm" onClick={() => setPreview(false)}>
                  Back to edit
                </Button>
                <Button size="sm" onClick={() => void confirm()} disabled={saving}>
                  {saving ? "Saving…" : "Confirm & publish"}
                </Button>
              </div>
            </div>
            <div className="panel overflow-hidden">
              <MeetingView m={meeting} />
            </div>
          </>
        ) : (
          <>
            <header className="mb-6 sm:mb-8">
              <p className="eyebrow">New Entry</p>
              <h1 className="font-display text-3xl sm:text-4xl font-bold uppercase text-ink">
                Weekly meeting record
              </h1>
              <div className="rule-red mt-3 w-32" />
              <p className="mt-3 text-xs sm:text-sm text-ink-soft">
                Fill only the sections that apply this week. Anything you skip simply won't appear
                on the published page.
              </p>
            </header>
            <MeetingForm
              value={meeting}
              onChange={setMeeting}
              onSubmit={() => {
                setPreview(true);
                window.scrollTo({ top: 0 });
              }}
              submitLabel="Preview meeting page"
              onCancel={() => void navigate({ to: "/" })}
            />
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

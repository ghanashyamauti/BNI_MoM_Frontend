import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Meeting } from "@/lib/types";
import { getMeeting, saveMeeting } from "@/lib/storage";
import { MeetingForm } from "@/components/MeetingForm";
import { SiteFooter, SiteHeader } from "@/components/Brand";
import { CHAPTER, longDate } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/meeting/$id/edit")({
  head: () => ({
    meta: [
      { title: `Edit Meeting — ${CHAPTER}` },
      { name: "description", content: `Update an existing ${CHAPTER} weekly meeting record.` },
      { property: "og:title", content: `Edit Meeting — ${CHAPTER}` },
      {
        property: "og:description",
        content: `Update an existing ${CHAPTER} weekly meeting record.`,
      },
    ],
  }),
  component: EditMeeting,
});

function EditMeeting() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState<Meeting | null>(null);

  useEffect(() => {
    void getMeeting(id).then((m) => setMeeting(m ?? null));
  }, [id]);

  const save = async () => {
    if (!meeting) return;
    await saveMeeting(meeting);
    toast.success("Meeting updated");
    await navigate({ to: "/meeting/$id", params: { id: meeting.id } });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-3 sm:px-4 py-6 sm:py-10">
        {!meeting ? (
          <p className="text-sm text-muted-foreground">Loading entry…</p>
        ) : (
          <>
            <header className="mb-6 sm:mb-8">
              <p className="eyebrow">Editing</p>
              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold uppercase text-ink">
                {longDate(meeting.date)}
              </h1>
              <div className="rule-red mt-3 w-32" />
            </header>
            <MeetingForm
              value={meeting}
              onChange={setMeeting}
              onSubmit={() => void save()}
              submitLabel="Save changes"
              onCancel={() => void navigate({ to: "/meeting/$id", params: { id: meeting.id } })}
            />
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

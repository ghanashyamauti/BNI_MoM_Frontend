import { useRef, useState } from "react";
import type { Attachment, Meeting } from "@/lib/types";
import { PHOTO_TAGS, uid } from "@/lib/types";
import { Area, Field, NumberField, RepeatList, SectionCard, Text } from "@/components/form/Fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { dayName, sizeLabel } from "@/lib/format";
import { ImagePlus, Paperclip, Plus, Star, X } from "lucide-react";

async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

async function shrinkImage(file: File): Promise<string> {
  const raw = await fileToDataUrl(file);
  try {
    const img = new Image();
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
      img.src = raw;
    });
    const max = 1600;
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    if (scale === 1 && raw.length < 900_000) return raw;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return raw;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.82);
  } catch {
    return raw;
  }
}

export function MeetingForm({
  value,
  onChange,
  onSubmit,
  submitLabel,
  onCancel,
}: {
  value: Meeting;
  onChange: (m: Meeting) => void;
  onSubmit: () => void;
  submitLabel: string;
  onCancel: () => void;
}) {
  const m = value;
  const photoInput = useRef<HTMLInputElement>(null);
  const docInput = useRef<HTMLInputElement>(null);
  const [catInput, setCatInput] = useState("");
  const [busy, setBusy] = useState(false);

  const up = (fn: (draft: Meeting) => void) => {
    const copy: Meeting = JSON.parse(JSON.stringify(m));
    fn(copy);
    onChange(copy);
  };

  const addFiles = async (files: FileList | null, kind: "photo" | "doc") => {
    if (!files || !files.length) return;
    setBusy(true);
    const added: Attachment[] = [];
    for (const f of Array.from(files)) {
      const dataUrl = kind === "photo" ? await shrinkImage(f) : await fileToDataUrl(f);
      added.push({
        id: uid(),
        kind,
        name: f.name,
        mime: f.type,
        size: f.size,
        dataUrl,
        caption: "",
        tag: kind === "photo" ? "Other" : undefined,
      });
    }
    up((d) => {
      d.attachments.push(...added);
      if (kind === "photo" && !d.attachments.some((a) => a.isCover)) {
        const first = d.attachments.find((a) => a.kind === "photo");
        if (first) first.isCover = true;
      }
    });
    setBusy(false);
  };

  const photoList = m.attachments.filter((a) => a.kind === "photo");
  const docList = m.attachments.filter((a) => a.kind === "doc");

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <SectionCard title="Meeting Basics" eyebrow="Section A" required>
        <div className="grid gap-5 md:grid-cols-3">
          <Field label="Date" hint={m.date ? dayName(m.date) : undefined}>
            <Input
              type="date"
              required
              value={m.date}
              onChange={(e) => up((d) => void (d.date = e.target.value))}
            />
          </Field>
          <Text
            label="Time"
            value={m.time}
            onChange={(v) => up((d) => void (d.time = v))}
            placeholder="7:00 – 9:00 AM"
          />
          <Text
            label="Compiled / minutes by"
            value={m.compiledBy}
            onChange={(v) => up((d) => void (d.compiledBy = v))}
            placeholder="Name"
          />
        </div>
        <Text
          label="Venue"
          value={m.venue}
          onChange={(v) => up((d) => void (d.venue = v))}
          placeholder="Hotel / hall name, city"
        />

        <div>
          <p className="eyebrow mb-3">Leadership Present</p>
          <div className="grid gap-4 md:grid-cols-2">
            {(
              [
                ["president", "President"],
                ["vicePresident", "Vice President"],
                ["secretary", "Secretary / Treasurer"],
                ["leadVisitorHost", "Lead Visitor Host"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="rounded-md border border-border bg-secondary/30 p-3">
                <Text
                  label={label}
                  value={m.leadership[key].name}
                  onChange={(v) => up((d) => void (d.leadership[key].name = v))}
                  placeholder="Name"
                />
                <div className="mt-2">
                  <Input
                    className="h-8 text-xs"
                    placeholder="Standing in for… (optional)"
                    value={m.leadership[key].standingIn ?? ""}
                    onChange={(e) =>
                      up((d) => void (d.leadership[key].standingIn = e.target.value))
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="eyebrow mb-3">Special Guests</p>
          <RepeatList
            items={m.guests}
            empty="No special guests this week."
            addLabel="Add guest"
            onAdd={() => up((d) => void d.guests.push({ id: uid(), name: "", role: "", note: "" }))}
            onRemove={(id) => up((d) => void (d.guests = d.guests.filter((g) => g.id !== id)))}
            render={(id) => {
              const i = m.guests.findIndex((g) => g.id === id);
              const g = m.guests[i]!;
              return (
                <div className="grid gap-3 md:grid-cols-3">
                  <Text
                    label="Name"
                    value={g.name}
                    onChange={(v) => up((d) => void (d.guests[i]!.name = v))}
                  />
                  <Text
                    label="Role"
                    value={g.role}
                    onChange={(v) => up((d) => void (d.guests[i]!.role = v))}
                  />
                  <Text
                    label="Note"
                    value={g.note}
                    onChange={(v) => up((d) => void (d.guests[i]!.note = v))}
                  />
                </div>
              );
            }}
          />
        </div>
      </SectionCard>

      <SectionCard title="Weekly Scorecard" eyebrow="Section B" required>
        <div className="grid gap-5 md:grid-cols-3">
          <NumberField
            label="Referrals passed"
            value={m.scorecard.referrals}
            onChange={(v) => up((d) => void (d.scorecard.referrals = v))}
          />
          <NumberField
            label="Business generated"
            prefix="₹"
            value={m.scorecard.business}
            onChange={(v) => up((d) => void (d.scorecard.business = v))}
          />
          <NumberField
            label="Visitors"
            value={m.scorecard.visitors}
            onChange={(v) => up((d) => void (d.scorecard.visitors = v))}
          />
          <NumberField
            label="Testimonials"
            value={m.scorecard.testimonials}
            onChange={(v) => up((d) => void (d.scorecard.testimonials = v))}
          />
          <NumberField
            label="1-2-1s completed"
            value={m.scorecard.oneToOnes}
            onChange={(v) => up((d) => void (d.scorecard.oneToOnes = v))}
          />
          <NumberField
            label="Average seat value"
            prefix="₹"
            value={m.scorecard.avgSeatValue}
            onChange={(v) => up((d) => void (d.scorecard.avgSeatValue = v))}
          />
        </div>
        <div className="rounded-md border border-dashed border-border p-4">
          <p className="eyebrow mb-3">Chapter-wide stats (optional)</p>
          <div className="grid gap-4 md:grid-cols-5">
            <NumberField
              label="Gold Club"
              value={m.scorecard.goldClub}
              onChange={(v) => up((d) => void (d.scorecard.goldClub = v))}
            />
            <NumberField
              label="Blue Badge"
              value={m.scorecard.blueBadge}
              onChange={(v) => up((d) => void (d.scorecard.blueBadge = v))}
            />
            <NumberField
              label="One Plus"
              value={m.scorecard.onePlus}
              onChange={(v) => up((d) => void (d.scorecard.onePlus = v))}
            />
            <NumberField
              label="CTD referrals"
              value={m.scorecard.ctdReferrals}
              onChange={(v) => up((d) => void (d.scorecard.ctdReferrals = v))}
            />
            <NumberField
              label="CTD business"
              prefix="₹"
              value={m.scorecard.ctdBusiness}
              onChange={(v) => up((d) => void (d.scorecard.ctdBusiness = v))}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Weekly Theme"
        eyebrow="Section C"
        toggle={m.toggles.theme}
        onToggle={(v) => up((d) => void (d.toggles.theme = v))}
      >
        <Text
          label="Theme"
          value={m.theme.title}
          onChange={(v) => up((d) => void (d.theme.title = v))}
        />
        <Area
          label="Summary of presentations"
          value={m.theme.summary}
          onChange={(v) => up((d) => void (d.theme.summary = v))}
        />
      </SectionCard>

      <SectionCard
        title="Education Slot"
        eyebrow="Section D"
        toggle={m.toggles.education}
        onToggle={(v) => up((d) => void (d.toggles.education = v))}
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Text
            label="Speaker"
            value={m.education.speaker}
            onChange={(v) => up((d) => void (d.education.speaker = v))}
          />
          <Text
            label="Topic"
            value={m.education.topic}
            onChange={(v) => up((d) => void (d.education.topic = v))}
          />
        </div>
        <div>
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Key takeaways
          </Label>
          <div className="mt-2 space-y-2">
            {m.education.takeaways.map((t, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={t}
                  placeholder={`Takeaway ${i + 1}`}
                  onChange={(e) => up((d) => void (d.education.takeaways[i] = e.target.value))}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    up(
                      (d) =>
                        void (d.education.takeaways = d.education.takeaways.filter(
                          (_, j) => j !== i,
                        )),
                    )
                  }
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => up((d) => void d.education.takeaways.push(""))}
            >
              <Plus className="mr-1 h-4 w-4" /> Add takeaway
            </Button>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Feature Presentation"
        eyebrow="Section E"
        toggle={m.toggles.feature}
        onToggle={(v) => up((d) => void (d.toggles.feature = v))}
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Text
            label="Presenter(s)"
            value={m.feature.presenters}
            onChange={(v) => up((d) => void (d.feature.presenters = v))}
          />
          <Text
            label="Introduced by"
            value={m.feature.introducedBy}
            onChange={(v) => up((d) => void (d.feature.introducedBy = v))}
          />
        </div>
        <Area
          label="Summary"
          value={m.feature.summary}
          onChange={(v) => up((d) => void (d.feature.summary = v))}
        />
        <Text
          label="Outcome"
          value={m.feature.outcome}
          onChange={(v) => up((d) => void (d.feature.outcome = v))}
          placeholder="e.g. 25 referrals generated"
        />
      </SectionCard>

      <SectionCard
        title="Launchpad / New Members"
        eyebrow="Section F"
        toggle={m.toggles.launchpad}
        onToggle={(v) => up((d) => void (d.toggles.launchpad = v))}
      >
        <RepeatList
          items={m.launchpad}
          empty="No launchpad entries yet."
          addLabel="Add member"
          onAdd={() =>
            up((d) => void d.launchpad.push({ id: uid(), name: "", introducedBy: "", note: "" }))
          }
          onRemove={(id) => up((d) => void (d.launchpad = d.launchpad.filter((r) => r.id !== id)))}
          render={(id) => {
            const i = m.launchpad.findIndex((r) => r.id === id);
            const r = m.launchpad[i]!;
            return (
              <div className="grid gap-3 md:grid-cols-3">
                <Text
                  label="Name"
                  value={r.name}
                  onChange={(v) => up((d) => void (d.launchpad[i]!.name = v))}
                />
                <Text
                  label="Introduced by"
                  value={r.introducedBy}
                  onChange={(v) => up((d) => void (d.launchpad[i]!.introducedBy = v))}
                />
                <Text
                  label="Note"
                  value={r.note}
                  onChange={(v) => up((d) => void (d.launchpad[i]!.note = v))}
                />
              </div>
            );
          }}
        />
      </SectionCard>

      <SectionCard
        title="Recognitions"
        eyebrow="Section G"
        toggle={m.toggles.recognitions}
        onToggle={(v) => up((d) => void (d.toggles.recognitions = v))}
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Text
            label="Golden Mike winner"
            value={m.recognitions.goldenMike}
            onChange={(v) => up((d) => void (d.recognitions.goldenMike = v))}
          />
          <Text
            label="Profile of the Month"
            value={m.recognitions.profileOfMonth}
            onChange={(v) => up((d) => void (d.recognitions.profileOfMonth = v))}
          />
          <div className="grid grid-cols-[2fr_1fr] gap-3">
            <Text
              label="Top referrer"
              value={m.recognitions.topReferrer.name}
              onChange={(v) => up((d) => void (d.recognitions.topReferrer.name = v))}
            />
            <Text
              label="Count"
              value={m.recognitions.topReferrer.count}
              onChange={(v) => up((d) => void (d.recognitions.topReferrer.count = v))}
            />
          </div>
          <div className="grid grid-cols-[2fr_1fr] gap-3">
            <Text
              label="Top business giver"
              value={m.recognitions.topBusiness.name}
              onChange={(v) => up((d) => void (d.recognitions.topBusiness.name = v))}
            />
            <Text
              label="Amount"
              value={m.recognitions.topBusiness.amount}
              onChange={(v) => up((d) => void (d.recognitions.topBusiness.amount = v))}
            />
          </div>
          <Text
            label="Star Performer"
            value={m.recognitions.starPerformer}
            onChange={(v) => up((d) => void (d.recognitions.starPerformer = v))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Text
              label="Special recognition"
              value={m.recognitions.special.name}
              onChange={(v) => up((d) => void (d.recognitions.special.name = v))}
            />
            <Text
              label="Note"
              value={m.recognitions.special.note}
              onChange={(v) => up((d) => void (d.recognitions.special.note = v))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 md:col-span-2">
            <Text
              label="New member / renewal / rejoining"
              value={m.recognitions.membership.name}
              onChange={(v) => up((d) => void (d.recognitions.membership.name = v))}
            />
            <Text
              label="Note"
              value={m.recognitions.membership.note}
              onChange={(v) => up((d) => void (d.recognitions.membership.note = v))}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Visitors"
        eyebrow="Section H"
        toggle={m.toggles.visitors}
        onToggle={(v) => up((d) => void (d.toggles.visitors = v))}
      >
        <div className="grid gap-5 md:grid-cols-2">
          <NumberField
            label="Visitor count"
            value={m.visitorsInfo.count}
            onChange={(v) => up((d) => void (d.visitorsInfo.count = v))}
          />
          <Field label="Categories represented">
            <div className="flex gap-2">
              <Input
                value={catInput}
                placeholder="Type a category and press Add"
                onChange={(e) => setCatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (catInput.trim()) {
                      up((d) => void d.visitorsInfo.categories.push(catInput.trim()));
                      setCatInput("");
                    }
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (catInput.trim()) {
                    up((d) => void d.visitorsInfo.categories.push(catInput.trim()));
                    setCatInput("");
                  }
                }}
              >
                Add
              </Button>
            </div>
            {m.visitorsInfo.categories.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {m.visitorsInfo.categories.map((c, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() =>
                      up(
                        (d) =>
                          void (d.visitorsInfo.categories = d.visitorsInfo.categories.filter(
                            (_, j) => j !== i,
                          )),
                      )
                    }
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-3 py-1 text-xs text-ink-soft hover:border-primary hover:text-primary"
                  >
                    {c} <X className="h-3 w-3" />
                  </button>
                ))}
              </div>
            ) : null}
          </Field>
        </div>
        <div className="grid gap-4 rounded-md border border-dashed border-border p-4 md:grid-cols-3">
          <Text
            label="Notable visitor / observer"
            value={m.visitorsInfo.notable.name}
            onChange={(v) => up((d) => void (d.visitorsInfo.notable.name = v))}
          />
          <Text
            label="Chapter"
            value={m.visitorsInfo.notable.chapter}
            onChange={(v) => up((d) => void (d.visitorsInfo.notable.chapter = v))}
          />
          <Text
            label="Feedback"
            value={m.visitorsInfo.notable.feedback}
            onChange={(v) => up((d) => void (d.visitorsInfo.notable.feedback = v))}
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Leadership / Term Report"
        eyebrow="Section I"
        toggle={m.toggles.termReport}
        onToggle={(v) => up((d) => void (d.toggles.termReport = v))}
      >
        <Area
          label="Term-to-date stats and milestones"
          rows={6}
          value={m.termReport}
          onChange={(v) => up((d) => void (d.termReport = v))}
        />
      </SectionCard>

      <SectionCard
        title="Announcements"
        eyebrow="Section J"
        toggle={m.toggles.announcements}
        onToggle={(v) => up((d) => void (d.toggles.announcements = v))}
      >
        <RepeatList
          items={m.announcements}
          empty="No announcements this week."
          addLabel="Add announcement"
          onAdd={() =>
            up((d) => void d.announcements.push({ id: uid(), type: "Social", text: "" }))
          }
          onRemove={(id) =>
            up((d) => void (d.announcements = d.announcements.filter((a) => a.id !== id)))
          }
          render={(id) => {
            const i = m.announcements.findIndex((a) => a.id === id);
            const a = m.announcements[i]!;
            return (
              <div className="grid gap-3 md:grid-cols-[180px_1fr]">
                <Field label="Type">
                  <Select
                    value={a.type}
                    onValueChange={(v) =>
                      up((d) => void (d.announcements[i]!.type = v as typeof a.type))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["Social", "Policy", "Open Category", "Renewal", "Other"].map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Text
                  label="Text"
                  value={a.text}
                  onChange={(v) => up((d) => void (d.announcements[i]!.text = v))}
                />
              </div>
            );
          }}
        />
      </SectionCard>

      <SectionCard title="Photos & Attachments" eyebrow="Section K">
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => photoInput.current?.click()}
            disabled={busy}
          >
            <ImagePlus className="mr-2 h-4 w-4" /> Upload photos
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => docInput.current?.click()}
            disabled={busy}
          >
            <Paperclip className="mr-2 h-4 w-4" /> Attach documents
          </Button>
          {busy ? (
            <span className="self-center text-sm text-muted-foreground">Processing…</span>
          ) : null}
          <input
            ref={photoInput}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              void addFiles(e.target.files, "photo");
              e.target.value = "";
            }}
          />
          <input
            ref={docInput}
            type="file"
            multiple
            hidden
            onChange={(e) => {
              void addFiles(e.target.files, "doc");
              e.target.value = "";
            }}
          />
        </div>

        {photoList.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {photoList.map((p) => {
              const i = m.attachments.findIndex((a) => a.id === p.id);
              return (
                <div key={p.id} className="overflow-hidden rounded-md border border-border bg-card">
                  <div className="relative">
                    <img src={p.dataUrl} alt={p.name} className="h-36 w-full object-cover" />
                    <button
                      type="button"
                      onClick={() =>
                        up((d) => {
                          d.attachments.forEach((a) => {
                            if (a.kind === "photo") a.isCover = false;
                          });
                          d.attachments[i]!.isCover = true;
                        })
                      }
                      className={
                        "absolute left-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold " +
                        (p.isCover
                          ? "bg-primary text-primary-foreground"
                          : "bg-card/90 text-ink-soft hover:bg-card")
                      }
                    >
                      <Star className="h-3 w-3" /> {p.isCover ? "Cover" : "Set cover"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        up((d) => void (d.attachments = d.attachments.filter((a) => a.id !== p.id)))
                      }
                      className="absolute right-2 top-2 rounded-full bg-card/90 p-1.5 text-ink-soft hover:text-primary"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="space-y-2 p-3">
                    <Input
                      className="h-8 text-xs"
                      placeholder="Caption (optional)"
                      value={p.caption ?? ""}
                      onChange={(e) => up((d) => void (d.attachments[i]!.caption = e.target.value))}
                    />
                    <Select
                      value={p.tag ?? "Other"}
                      onValueChange={(v) => up((d) => void (d.attachments[i]!.tag = v))}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PHOTO_TAGS.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {docList.length > 0 ? (
          <ul className="divide-y divide-border rounded-md border border-border">
            {docList.map((d0) => (
              <li
                key={d0.id}
                className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Paperclip className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate">{d0.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {sizeLabel(d0.size)}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() =>
                    up((d) => void (d.attachments = d.attachments.filter((a) => a.id !== d0.id)))
                  }
                  className="text-muted-foreground hover:text-primary"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </SectionCard>

      <div className="no-print sticky bottom-0 z-30 flex flex-wrap items-center justify-end gap-3 border-t border-border bg-card/95 p-4 backdrop-blur">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="lg" disabled={busy}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

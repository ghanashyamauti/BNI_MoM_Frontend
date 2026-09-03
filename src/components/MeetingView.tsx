import { useEffect, useState } from "react";
import type { Meeting, Attachment, Person } from "@/lib/types";
import {
  CHAPTER,
  coverPhoto,
  docs,
  fmtMoney,
  fmtNum,
  has,
  hasRecognitions,
  longDate,
  photos,
  photosByTag,
  sizeLabel,
  untaggedPhotos,
} from "@/lib/format";
import { Download, Eye, FileText } from "lucide-react";
import { BniMark } from "@/components/Brand";
import { DocumentPreviewModal } from "@/components/DocumentPreviewModal";
import { PhotoPreviewModal } from "@/components/PhotoPreviewModal";

function Stat({ label, value, big }: { label: string; value: string; big?: boolean }) {
  const missing = value === "not recorded";
  return (
    <div className="print-break border-l-2 border-primary/70 pl-3 sm:pl-4 min-w-0">
      <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground truncate">
        {label}
      </p>
      <p
        className={
          (missing
            ? "text-sm sm:text-base font-medium italic text-muted-foreground"
            : "font-display font-bold text-ink " +
              (big
                ? "text-2xl sm:text-3xl md:text-4xl lg:text-5xl"
                : "text-xl sm:text-2xl md:text-3xl")) + " mt-1 leading-tight break-words"
        }
      >
        {value}
      </p>
    </div>
  );
}

function Section({
  title,
  children,
  index,
}: {
  title: string;
  children: React.ReactNode;
  index: number;
}) {
  return (
    <section className="print-break">
      <div className="mb-3 sm:mb-4 flex items-baseline gap-2 sm:gap-3">
        <span className="font-display text-xs sm:text-sm font-bold text-primary">
          {String(index).padStart(2, "0")}
        </span>
        <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-semibold uppercase tracking-wide text-ink">
          {title}
        </h2>
        <span className="ml-2 h-px flex-1 bg-border" />
      </div>
      <div className="space-y-3 sm:space-y-4 text-sm sm:text-[15px] leading-relaxed text-ink-soft">
        {children}
      </div>
    </section>
  );
}

function PhotoGrid({
  items,
  onSelect,
}: {
  items: Attachment[];
  onSelect?: (p: Attachment) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((p) => (
        <figure
          key={p.id}
          data-photo-id={p.id}
          onClick={() => onSelect?.(p)}
          className="print-break overflow-hidden rounded-md border border-border bg-card cursor-pointer group transition-all hover:border-primary hover:shadow-md"
          title="Click to preview photo in popup card"
        >
          <div className="relative overflow-hidden">
            <img
              src={p.originalUrl || p.dataUrl}
              alt={p.caption || p.tag || "Meeting photo"}
              className="h-48 w-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black/75 px-3 py-1 text-xs font-semibold text-white backdrop-blur shadow">
                <Eye className="h-3.5 w-3.5" /> Preview
              </span>
            </div>
          </div>
          {has(p.caption) ? (
            <figcaption className="px-3 py-2 text-xs text-muted-foreground">{p.caption}</figcaption>
          ) : null}
        </figure>
      ))}
    </div>
  );
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}:{" "}
      </span>
      <span className="font-medium text-ink">{value}</span>
    </p>
  );
}

export function MeetingView({
  m,
  initialDoc,
  initialPhoto,
}: {
  m: Meeting;
  initialDoc?: Attachment | null;
  initialPhoto?: Attachment | null;
}) {
  const [previewDoc, setPreviewDoc] = useState<Attachment | null>(() => initialDoc ?? null);
  const [previewPhoto, setPreviewPhoto] = useState<Attachment | null>(() => initialPhoto ?? null);
  const [galleryPhotos, setGalleryPhotos] = useState<Attachment[]>([]);
  const cover = coverPhoto(m);

  useEffect(() => {
    if (initialDoc) setPreviewDoc(initialDoc);
  }, [initialDoc]);

  useEffect(() => {
    if (initialPhoto) {
      setPreviewPhoto(initialPhoto);
      setGalleryPhotos(photos(m) || [initialPhoto]);
    }
  }, [initialPhoto, m]);

  const openPhotoPreview = (p: Attachment, list?: Attachment[]) => {
    setPreviewPhoto(p);
    setGalleryPhotos(list ?? (photos(m) || []));
  };
  const s = m.scorecard;
  const usedTags: string[] = [];
  let n = 0;
  const idx = () => ++n;
  const lead = m.leadership;
  const leaders: [string, Person][] = [
    ["President", lead.president],
    ["Vice President", lead.vicePresident],
    ["Secretary / Treasurer", lead.secretary],
    ["Lead Visitor Host", lead.leadVisitorHost],
  ];
  const shownLeaders = leaders.filter(([, p]) => has(p.name));
  const documents = docs(m);

  const tagFor = (tag: string) => {
    usedTags.push(tag);
    return photosByTag(m, tag);
  };
  const featurePhotos = tagFor("Feature Presentation");
  const eduPhotos = tagFor("Education Slot");
  const recPhotos = tagFor("Recognitions");
  const visitorPhotos = tagFor("Visitors");
  const launchPhotos = tagFor("Launchpad");
  const rest = untaggedPhotos(m, usedTags);

  return (
    <article className="print-page mx-auto w-full max-w-4xl bg-card">
      {cover ? (
        <div
          onClick={() => openPhotoPreview(cover, [cover])}
          className="relative h-56 w-full overflow-hidden md:h-80 cursor-pointer group"
          title="Click to view full cover photo"
        >
          <img
            src={cover.originalUrl || cover.dataUrl}
            alt={cover.caption || "Meeting cover"}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-102"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
            <p className="font-display text-xs uppercase tracking-[0.28em] text-white/80">
              {CHAPTER}
            </p>
            <h1 className="font-display text-3xl font-bold uppercase text-white md:text-5xl">
              {longDate(m.date)}
            </h1>
          </div>
        </div>
      ) : null}

      <div className="space-y-8 sm:space-y-10 p-4 sm:p-6 md:p-10">
        <header className="print-break">
          <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 border-b-4 border-primary pb-4">
            <BniMark />
            <div className="text-left sm:text-right">
              <p className="eyebrow">Weekly Meeting Record</p>
              <p className="font-display text-base sm:text-lg font-semibold text-ink">
                {longDate(m.date)}
              </p>
            </div>
          </div>
          {!cover ? (
            <h1 className="mt-4 sm:mt-6 font-display text-2xl sm:text-3xl md:text-5xl font-bold uppercase leading-tight text-ink">
              {CHAPTER} · Meeting Minutes
            </h1>
          ) : null}
          <dl className="mt-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-3 text-sm">
            {has(m.time) ? (
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">Time</dt>
                <dd className="font-medium text-ink">{m.time}</dd>
              </div>
            ) : null}
            {has(m.venue) ? (
              <div className="sm:col-span-2">
                <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Venue
                </dt>
                <dd className="font-medium text-ink">{m.venue}</dd>
              </div>
            ) : null}
            {has(m.compiledBy) ? (
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Minutes by
                </dt>
                <dd className="font-medium text-ink">{m.compiledBy}</dd>
              </div>
            ) : null}
          </dl>

          {shownLeaders.length > 0 ? (
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 rounded-md bg-secondary/60 p-3 sm:p-4">
              {shownLeaders.map(([role, p]) => (
                <div key={role} className="min-w-0">
                  <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-muted-foreground truncate">
                    {role}
                  </p>
                  <p className="font-semibold text-ink text-sm sm:text-base truncate">{p.name}</p>
                  {has(p.standingIn) ? (
                    <p className="text-xs italic text-muted-foreground">
                      standing in for {p.standingIn}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          {m.guests.filter((g) => has(g.name)).length > 0 ? (
            <div className="mt-4">
              <p className="eyebrow">Special Guests</p>
              <ul className="mt-2 space-y-1 text-sm text-ink-soft">
                {m.guests
                  .filter((g) => has(g.name))
                  .map((g) => (
                    <li key={g.id}>
                      <span className="font-semibold text-ink">{g.name}</span>
                      {has(g.role) ? ` — ${g.role}` : ""}
                      {has(g.note) ? ` · ${g.note}` : ""}
                    </li>
                  ))}
              </ul>
            </div>
          ) : null}
        </header>

        <section className="print-break rounded-lg border border-border bg-secondary/40 p-4 sm:p-6">
          <p className="eyebrow mb-4 sm:mb-5">Weekly Scorecard</p>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3">
            <Stat label="Referrals Passed" value={fmtNum(s.referrals)} big />
            <Stat label="Business Generated" value={fmtMoney(s.business)} big />
            <Stat label="Visitors" value={fmtNum(s.visitors)} big />
            <Stat label="Testimonials" value={fmtNum(s.testimonials)} />
            <Stat label="1-2-1s Completed" value={fmtNum(s.oneToOnes)} />
            {s.avgSeatValue !== null ? (
              <Stat label="Average Seat Value" value={fmtMoney(s.avgSeatValue)} />
            ) : null}
          </div>
          {s.goldClub !== null ||
          s.blueBadge !== null ||
          s.onePlus !== null ||
          s.ctdReferrals !== null ||
          s.ctdBusiness !== null ? (
            <div className="mt-5 sm:mt-6 grid grid-cols-2 gap-x-4 sm:gap-x-6 gap-y-3 border-t border-border pt-4 sm:pt-5 text-sm md:grid-cols-5">
              {s.goldClub !== null ? <Pair label="Gold Club" value={fmtNum(s.goldClub)} /> : null}
              {s.blueBadge !== null ? (
                <Pair label="Blue Badge" value={fmtNum(s.blueBadge)} />
              ) : null}
              {s.onePlus !== null ? <Pair label="One Plus" value={fmtNum(s.onePlus)} /> : null}
              {s.ctdReferrals !== null ? (
                <Pair label="CTD Referrals" value={fmtNum(s.ctdReferrals)} />
              ) : null}
              {s.ctdBusiness !== null ? (
                <Pair label="CTD Business" value={fmtMoney(s.ctdBusiness)} />
              ) : null}
            </div>
          ) : null}
        </section>

        {m.toggles.theme && (has(m.theme.title) || has(m.theme.summary)) ? (
          <Section title="Weekly Theme" index={idx()}>
            {has(m.theme.title) ? (
              <p className="font-display text-2xl font-semibold text-primary">{m.theme.title}</p>
            ) : null}
            {has(m.theme.summary) ? <p className="whitespace-pre-line">{m.theme.summary}</p> : null}
          </Section>
        ) : null}

        {m.toggles.education &&
        (has(m.education.speaker) || has(m.education.topic) || m.education.takeaways.some(has)) ? (
          <Section title="Education Slot" index={idx()}>
            {has(m.education.topic) ? (
              <p className="font-display text-2xl font-semibold text-ink">{m.education.topic}</p>
            ) : null}
            {has(m.education.speaker) ? <Pair label="Speaker" value={m.education.speaker} /> : null}
            {m.education.takeaways.some(has) ? (
              <ul className="ml-5 list-disc space-y-1.5">
                {m.education.takeaways.filter(has).map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            ) : null}
            <PhotoGrid items={eduPhotos} onSelect={(p) => openPhotoPreview(p, eduPhotos)} />
          </Section>
        ) : null}

        {m.toggles.feature &&
        (has(m.feature.presenters) || has(m.feature.summary) || has(m.feature.outcome)) ? (
          <Section title="Feature Presentation" index={idx()}>
            {has(m.feature.presenters) ? (
              <p className="font-display text-2xl font-semibold text-ink">{m.feature.presenters}</p>
            ) : null}
            {has(m.feature.introducedBy) ? (
              <Pair label="Introduced by" value={m.feature.introducedBy} />
            ) : null}
            {has(m.feature.summary) ? (
              <p className="whitespace-pre-line">{m.feature.summary}</p>
            ) : null}
            {has(m.feature.outcome) ? (
              <p className="rounded-md bg-primary/10 px-4 py-3 font-semibold text-primary">
                {m.feature.outcome}
              </p>
            ) : null}
            <PhotoGrid items={featurePhotos} onSelect={(p) => openPhotoPreview(p, featurePhotos)} />
          </Section>
        ) : null}

        {m.toggles.launchpad && m.launchpad.filter((r) => has(r.name)).length > 0 ? (
          <Section title="Launchpad / New Members" index={idx()}>
            <div className="divide-y divide-border">
              {m.launchpad
                .filter((r) => has(r.name))
                .map((r) => (
                  <div key={r.id} className="py-3 print-break">
                    <p className="font-semibold text-ink">{r.name}</p>
                    {has(r.introducedBy) ? (
                      <p className="text-sm text-muted-foreground">
                        Introduced by {r.introducedBy}
                      </p>
                    ) : null}
                    {has(r.note) ? <p className="text-sm">{r.note}</p> : null}
                  </div>
                ))}
            </div>
            <PhotoGrid items={launchPhotos} onSelect={(p) => openPhotoPreview(p, launchPhotos)} />
          </Section>
        ) : null}

        {m.toggles.recognitions && hasRecognitions(m) ? (
          <Section title="Recognitions" index={idx()}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {has(m.recognitions.goldenMike) ? (
                <div className="print-break rounded-md border-l-4 border-gold bg-secondary/50 p-4">
                  <p className="eyebrow">Golden Mike</p>
                  <p className="font-display text-xl font-semibold text-ink">
                    {m.recognitions.goldenMike}
                  </p>
                </div>
              ) : null}
              {has(m.recognitions.topReferrer.name) ? (
                <div className="print-break rounded-md border-l-4 border-primary bg-secondary/50 p-4">
                  <p className="eyebrow">Top Referrer</p>
                  <p className="font-display text-xl font-semibold text-ink">
                    {m.recognitions.topReferrer.name}
                    {has(m.recognitions.topReferrer.count)
                      ? ` · ${m.recognitions.topReferrer.count} referrals`
                      : ""}
                  </p>
                </div>
              ) : null}
              {has(m.recognitions.topBusiness.name) ? (
                <div className="print-break rounded-md border-l-4 border-primary bg-secondary/50 p-4">
                  <p className="eyebrow">Top Business Giver</p>
                  <p className="font-display text-xl font-semibold text-ink">
                    {m.recognitions.topBusiness.name}
                    {has(m.recognitions.topBusiness.amount)
                      ? ` · ${m.recognitions.topBusiness.amount}`
                      : ""}
                  </p>
                </div>
              ) : null}
              {has(m.recognitions.profileOfMonth) ? (
                <div className="print-break rounded-md border-l-4 border-ink/40 bg-secondary/50 p-4">
                  <p className="eyebrow">Profile of the Month</p>
                  <p className="font-display text-xl font-semibold text-ink">
                    {m.recognitions.profileOfMonth}
                  </p>
                </div>
              ) : null}
              {has(m.recognitions.starPerformer) ? (
                <div className="print-break rounded-md border-l-4 border-ink/40 bg-secondary/50 p-4">
                  <p className="eyebrow">Star Performer</p>
                  <p className="font-display text-xl font-semibold text-ink">
                    {m.recognitions.starPerformer}
                  </p>
                </div>
              ) : null}
              {has(m.recognitions.special.name) ? (
                <div className="print-break rounded-md border-l-4 border-ink/40 bg-secondary/50 p-4">
                  <p className="eyebrow">Special Recognition</p>
                  <p className="font-display text-xl font-semibold text-ink">
                    {m.recognitions.special.name}
                  </p>
                  {has(m.recognitions.special.note) ? (
                    <p className="text-sm">{m.recognitions.special.note}</p>
                  ) : null}
                </div>
              ) : null}
              {has(m.recognitions.membership.name) ? (
                <div className="print-break rounded-md border-l-4 border-ink/40 bg-secondary/50 p-4">
                  <p className="eyebrow">New Member / Renewal</p>
                  <p className="font-display text-xl font-semibold text-ink">
                    {m.recognitions.membership.name}
                  </p>
                  {has(m.recognitions.membership.note) ? (
                    <p className="text-sm">{m.recognitions.membership.note}</p>
                  ) : null}
                </div>
              ) : null}
            </div>
            <PhotoGrid items={recPhotos} onSelect={(p) => openPhotoPreview(p, recPhotos)} />
          </Section>
        ) : null}

        {m.toggles.visitors &&
        (m.visitorsInfo.count !== null ||
          m.visitorsInfo.categories.length > 0 ||
          has(m.visitorsInfo.notable.name)) ? (
          <Section title="Visitors" index={idx()}>
            {m.visitorsInfo.count !== null ? (
              <Pair label="Visitors present" value={fmtNum(m.visitorsInfo.count)} />
            ) : null}
            {m.visitorsInfo.categories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {m.visitorsInfo.categories.map((c, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-ink-soft"
                  >
                    {c}
                  </span>
                ))}
              </div>
            ) : null}
            {has(m.visitorsInfo.notable.name) ? (
              <blockquote className="print-break border-l-4 border-primary pl-4">
                <p className="font-semibold text-ink">
                  {m.visitorsInfo.notable.name}
                  {has(m.visitorsInfo.notable.chapter)
                    ? ` — ${m.visitorsInfo.notable.chapter}`
                    : ""}
                </p>
                {has(m.visitorsInfo.notable.feedback) ? (
                  <p className="italic">“{m.visitorsInfo.notable.feedback}”</p>
                ) : null}
              </blockquote>
            ) : null}
            <PhotoGrid items={visitorPhotos} onSelect={(p) => openPhotoPreview(p, visitorPhotos)} />
          </Section>
        ) : null}

        {m.toggles.termReport && has(m.termReport) ? (
          <Section title="Leadership / Term Report" index={idx()}>
            <p className="whitespace-pre-line">{m.termReport}</p>
          </Section>
        ) : null}

        {m.toggles.announcements && m.announcements.filter((a) => has(a.text)).length > 0 ? (
          <Section title="Announcements" index={idx()}>
            <ul className="space-y-3">
              {m.announcements
                .filter((a) => has(a.text))
                .map((a) => (
                  <li key={a.id} className="print-break flex gap-3">
                    <span className="mt-0.5 h-fit shrink-0 rounded-sm bg-primary/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
                      {a.type}
                    </span>
                    <span>{a.text}</span>
                  </li>
                ))}
            </ul>
          </Section>
        ) : null}

        {rest.length > 0 ? (
          <Section title="Photo Gallery" index={idx()}>
            <PhotoGrid items={rest} onSelect={(p) => openPhotoPreview(p, rest)} />
          </Section>
        ) : null}

        {documents.length > 0 ? (
          <Section title="Attached Documents" index={idx()}>
            <ul className="divide-y divide-border rounded-md border border-border">
              {documents.map((d) => (
                <li
                  key={d.id}
                  data-doc-id={d.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 px-3 sm:px-4 py-3 hover:bg-secondary/30 transition-colors rounded-md border border-transparent hover:border-border/60"
                >
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(d)}
                    className="flex min-w-0 items-center gap-2 sm:gap-3 text-left flex-1 cursor-pointer group"
                    title="Click to preview document in popup card"
                  >
                    <FileText className="h-4 w-4 shrink-0 text-primary group-hover:scale-110 transition-transform" />
                    <span className="truncate font-medium text-ink text-sm sm:text-base group-hover:text-primary group-hover:underline transition-colors">
                      {d.name}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {sizeLabel(d.size)}
                    </span>
                    <span className="shrink-0 text-[10px] uppercase font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full hidden sm:inline-block">
                      Preview
                    </span>
                    <span className="hidden print:inline-block text-[11px] font-semibold text-primary underline shrink-0 ml-auto">
                      [Click to view document]
                    </span>
                  </button>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setPreviewDoc(d)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary bg-secondary/80 hover:bg-secondary px-2.5 py-1.5 rounded-md border border-border/80 transition-colors"
                      title="Preview document"
                    >
                      <Eye className="h-3.5 w-3.5" /> Preview
                    </button>
                    <a
                      href={d.dataUrl}
                      download={d.name}
                      className="no-print inline-flex shrink-0 items-center gap-1 text-xs sm:text-sm font-semibold text-primary hover:underline px-2 py-1"
                    >
                      <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Download
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        <footer className="border-t border-border pt-6 text-center">
          <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            {CHAPTER} · Givers Gain
          </p>
        </footer>
      </div>

      {previewDoc ? (
        <DocumentPreviewModal
          document={previewDoc}
          isOpen={Boolean(previewDoc)}
          onClose={() => setPreviewDoc(null)}
        />
      ) : null}

      {previewPhoto ? (
        <PhotoPreviewModal
          photo={previewPhoto}
          photos={galleryPhotos}
          isOpen={Boolean(previewPhoto)}
          onClose={() => setPreviewPhoto(null)}
          onSelectPhoto={setPreviewPhoto}
        />
      ) : null}
    </article>
  );
}

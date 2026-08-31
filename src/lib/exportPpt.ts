import type pptxgen from "pptxgenjs";
import type { Meeting } from "./types";
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
} from "./format";

const RED = "CF2030";
const INK = "1C1F26";
const GREY = "6B7280";
const LIGHT = "F4F4F5";

export async function downloadPpt(m: Meeting) {
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "LW", width: 13.333, height: 7.5 });
  pptx.layout = "LW";
  pptx.author = CHAPTER;
  pptx.title = `${CHAPTER} — ${longDate(m.date)}`;

  const brandBar = (slide: pptxgen.Slide) => {
    slide.addShape("rect", { x: 0, y: 0, w: 13.333, h: 0.32, fill: { color: RED } });
    slide.addText(CHAPTER.toUpperCase(), {
      x: 0.5,
      y: 6.85,
      w: 6,
      h: 0.3,
      fontSize: 11,
      color: GREY,
      charSpacing: 2,
      fontFace: "Arial",
    });
    slide.addText(longDate(m.date), {
      x: 6.8,
      y: 6.85,
      w: 6,
      h: 0.3,
      fontSize: 11,
      color: GREY,
      align: "right",
      fontFace: "Arial",
    });
  };

  const sectionSlide = (title: string) => {
    const s = pptx.addSlide();
    brandBar(s);
    s.addText(title.toUpperCase(), {
      x: 0.6,
      y: 0.7,
      w: 12,
      h: 0.7,
      fontSize: 34,
      bold: true,
      color: INK,
      fontFace: "Arial",
    });
    s.addShape("rect", { x: 0.6, y: 1.45, w: 1.6, h: 0.06, fill: { color: RED } });
    return s;
  };

  // Title slide
  const t = pptx.addSlide();
  t.background = { color: INK };
  const cover = coverPhoto(m);
  if (cover) {
    t.addImage({
      data: cover.dataUrl,
      x: 6.9,
      y: 0,
      w: 6.433,
      h: 7.5,
      sizing: { type: "cover", w: 6.433, h: 7.5 },
    });
  }
  t.addShape("rect", { x: 0, y: 0, w: 0.28, h: 7.5, fill: { color: RED } });
  t.addText("BNI ELITES", {
    x: 0.8,
    y: 2.1,
    w: 6,
    h: 0.6,
    fontSize: 20,
    bold: true,
    color: "FFFFFF",
    charSpacing: 6,
    fontFace: "Arial",
  });
  t.addText("Weekly Meeting Record", {
    x: 0.8,
    y: 2.8,
    w: 6,
    h: 1.4,
    fontSize: 44,
    bold: true,
    color: "FFFFFF",
    fontFace: "Arial",
  });
  t.addText(longDate(m.date), {
    x: 0.8,
    y: 4.2,
    w: 6,
    h: 0.5,
    fontSize: 22,
    color: "F3B7BC",
    fontFace: "Arial",
  });
  const meta = [m.time, m.venue].filter(has).join("  ·  ");
  if (meta)
    t.addText(meta, {
      x: 0.8,
      y: 4.8,
      w: 5.6,
      h: 0.8,
      fontSize: 15,
      color: "D4D4D8",
      fontFace: "Arial",
    });
  if (has(m.compiledBy))
    t.addText(`Minutes by ${m.compiledBy}`, {
      x: 0.8,
      y: 5.6,
      w: 5.6,
      h: 0.4,
      fontSize: 13,
      color: "9CA3AF",
      fontFace: "Arial",
    });

  // Scorecard slide
  const sc = sectionSlide("Weekly Scorecard");
  const cards: [string, string][] = [
    ["Referrals Passed", fmtNum(m.scorecard.referrals)],
    ["Business Generated", fmtMoney(m.scorecard.business)],
    ["Visitors", fmtNum(m.scorecard.visitors)],
    ["Testimonials", fmtNum(m.scorecard.testimonials)],
    ["1-2-1s Completed", fmtNum(m.scorecard.oneToOnes)],
    ["Average Seat Value", fmtMoney(m.scorecard.avgSeatValue)],
  ];
  cards.forEach(([label, value], i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.6 + col * 4.15;
    const y = 2.0 + row * 2.1;
    sc.addShape("rect", { x, y, w: 3.85, h: 1.75, fill: { color: LIGHT } });
    sc.addShape("rect", { x, y, w: 0.07, h: 1.75, fill: { color: RED } });
    sc.addText(label.toUpperCase(), {
      x: x + 0.3,
      y: y + 0.2,
      w: 3.4,
      h: 0.3,
      fontSize: 11,
      color: GREY,
      charSpacing: 1.5,
      fontFace: "Arial",
    });
    const missing = value === "not recorded";
    sc.addText(value, {
      x: x + 0.3,
      y: y + 0.6,
      w: 3.4,
      h: 0.9,
      fontSize: missing ? 16 : 30,
      bold: !missing,
      italic: missing,
      color: missing ? GREY : INK,
      fontFace: "Arial",
    });
  });

  const bullets = (s: pptxgen.Slide, lines: { text: string; bold?: boolean }[]) => {
    s.addText(
      lines.map((l) => ({
        text: l.text,
        options: {
          bullet: true,
          fontSize: l.bold ? 20 : 16,
          bold: !!l.bold,
          color: INK,
          valign: "top",
          breakLine: true,
        },
      })),
      {
        x: 0.7,
        y: 1.9,
        w: 11.9,
        h: Math.min(4.6, Math.max(0.5, lines.length * 0.55)),
        valign: "top",
        fontFace: "Arial",
        lineSpacingMultiple: 1.3,
      },
    );
  };

  if (m.toggles.theme && (has(m.theme.title) || has(m.theme.summary))) {
    const s = sectionSlide("Weekly Theme");
    if (has(m.theme.title))
      s.addText(m.theme.title, {
        x: 0.6,
        y: 1.9,
        w: 12,
        h: 0.7,
        fontSize: 28,
        bold: true,
        color: RED,
        fontFace: "Arial",
      });
    if (has(m.theme.summary))
      s.addText(m.theme.summary, {
        x: 0.6,
        y: 2.8,
        w: 12,
        h: 3.5,
        valign: "top",
        fontSize: 16,
        color: INK,
        fontFace: "Arial",
      });
  }

  if (m.toggles.education && (has(m.education.topic) || m.education.takeaways.some(has))) {
    const s = sectionSlide("Education Slot");
    const lines: { text: string; bold?: boolean }[] = [];
    if (has(m.education.topic)) lines.push({ text: m.education.topic, bold: true });
    if (has(m.education.speaker)) lines.push({ text: `Speaker: ${m.education.speaker}` });
    m.education.takeaways.filter(has).forEach((tk) => lines.push({ text: tk }));
    bullets(s, lines);
  }

  if (m.toggles.feature && (has(m.feature.presenters) || has(m.feature.summary))) {
    const s = sectionSlide("Feature Presentation");
    const lines: { text: string; bold?: boolean }[] = [];
    if (has(m.feature.presenters)) lines.push({ text: m.feature.presenters, bold: true });
    if (has(m.feature.introducedBy))
      lines.push({ text: `Introduced by ${m.feature.introducedBy}` });
    if (has(m.feature.summary)) lines.push({ text: m.feature.summary });
    if (has(m.feature.outcome)) lines.push({ text: m.feature.outcome, bold: true });
    bullets(s, lines);
  }

  if (m.toggles.launchpad && m.launchpad.some((r) => has(r.name))) {
    const s = sectionSlide("Launchpad / New Members");
    bullets(
      s,
      m.launchpad
        .filter((r) => has(r.name))
        .map((r) => ({
          text: [r.name, has(r.introducedBy) ? `introduced by ${r.introducedBy}` : "", r.note]
            .filter(has)
            .join(" — "),
        })),
    );
  }

  if (m.toggles.recognitions && hasRecognitions(m)) {
    const s = sectionSlide("Recognitions");
    const r = m.recognitions;
    const lines: { text: string; bold?: boolean }[] = [];
    if (has(r.goldenMike)) lines.push({ text: `Golden Mike — ${r.goldenMike}`, bold: true });
    if (has(r.topReferrer.name))
      lines.push({ text: `Top Referrer — ${r.topReferrer.name} ${r.topReferrer.count}`.trim() });
    if (has(r.topBusiness.name))
      lines.push({
        text: `Top Business Giver — ${r.topBusiness.name} ${r.topBusiness.amount}`.trim(),
      });
    if (has(r.profileOfMonth)) lines.push({ text: `Profile of the Month — ${r.profileOfMonth}` });
    if (has(r.starPerformer)) lines.push({ text: `Star Performer — ${r.starPerformer}` });
    if (has(r.special.name))
      lines.push({ text: `Special Recognition — ${r.special.name} ${r.special.note}`.trim() });
    if (has(r.membership.name))
      lines.push({
        text: `New Member / Renewal — ${r.membership.name} ${r.membership.note}`.trim(),
      });
    bullets(s, lines);
  }

  if (
    m.toggles.visitors &&
    (m.visitorsInfo.count !== null ||
      m.visitorsInfo.categories.length > 0 ||
      has(m.visitorsInfo.notable.name))
  ) {
    const s = sectionSlide("Visitors");
    const lines: { text: string; bold?: boolean }[] = [];
    if (m.visitorsInfo.count !== null)
      lines.push({ text: `${fmtNum(m.visitorsInfo.count)} visitors present`, bold: true });
    if (m.visitorsInfo.categories.length)
      lines.push({ text: `Categories: ${m.visitorsInfo.categories.join(", ")}` });
    if (has(m.visitorsInfo.notable.name))
      lines.push({
        text: `${m.visitorsInfo.notable.name}${
          has(m.visitorsInfo.notable.chapter) ? ` (${m.visitorsInfo.notable.chapter})` : ""
        }${has(m.visitorsInfo.notable.feedback) ? `: “${m.visitorsInfo.notable.feedback}”` : ""}`,
      });
    bullets(s, lines);
  }

  if (m.toggles.termReport && has(m.termReport)) {
    const s = sectionSlide("Leadership / Term Report");
    s.addText(m.termReport, {
      x: 0.7,
      y: 1.95,
      w: 11.9,
      h: 4.5,
      valign: "top",
      fontSize: 16,
      color: INK,
      fontFace: "Arial",
    });
  }

  if (m.toggles.announcements && m.announcements.some((a) => has(a.text))) {
    const s = sectionSlide("Announcements");
    bullets(
      s,
      m.announcements.filter((a) => has(a.text)).map((a) => ({ text: `[${a.type}] ${a.text}` })),
    );
  }

  const gallery = photos(m).filter((p) => !p.isCover);
  for (let i = 0; i < gallery.length; i += 4) {
    const chunk = gallery.slice(i, i + 4);
    const s = sectionSlide(i === 0 ? "Photo Gallery" : "Photo Gallery (cont.)");
    chunk.forEach((p, j) => {
      const col = j % 2;
      const row = Math.floor(j / 2);
      s.addImage({
        data: p.dataUrl,
        x: 0.7 + col * 6.2,
        y: 1.9 + row * 2.5,
        w: 5.8,
        h: 2.3,
        sizing: { type: "cover", w: 5.8, h: 2.3 },
      });
      if (has(p.caption))
        s.addText(p.caption!, {
          x: 0.7 + col * 6.2,
          y: 4.2 + row * 2.5 - (row === 0 ? 0 : 0),
          w: 5.8,
          h: 0.25,
          fontSize: 10,
          color: GREY,
          fontFace: "Arial",
        });
    });
  }

  const documents = docs(m);
  if (documents.length) {
    const s = sectionSlide("Attached Documents");
    bullets(
      s,
      documents.map((d) => ({ text: d.name })),
    );
  }

  await pptx.writeFile({ fileName: `BNI-Elites-${m.date}.pptx` });
}

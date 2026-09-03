import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";
import type { Meeting } from "./types";
import { CHAPTER } from "./format";

/**
 * Captures the meeting detail DOM element and exports it as a high-resolution,
 * cleanly paginated A4 PDF with balanced header, footer, and side margins.
 */
export async function downloadPdf(node: HTMLElement, m: Meeting): Promise<void> {
  if (!node) {
    throw new Error("Meeting view element not found for PDF export");
  }

  // A4 dimensions in millimeters
  const PDF_WIDTH_MM = 210;
  const PDF_HEIGHT_MM = 297;

  // Standard elegant margins
  const MARGIN_TOP_MM = 12;
  const MARGIN_BOTTOM_MM = 12;
  const MARGIN_SIDE_MM = 10;

  const PRINTABLE_WIDTH_MM = PDF_WIDTH_MM - MARGIN_SIDE_MM * 2; // 190mm
  const PRINTABLE_HEIGHT_MM = PDF_HEIGHT_MM - MARGIN_TOP_MM - MARGIN_BOTTOM_MM; // 273mm

  // 1. Measure positions of all atomic content blocks relative to container before capture
  const nodeRect = node.getBoundingClientRect();
  const rawElements = Array.from(
    node.querySelectorAll<HTMLElement>(
      "header, section, .print-break, figure, footer, dl, blockquote, .divide-y > div, li",
    ),
  );

  const elements = rawElements.filter(
    (el) => el !== node && el.offsetHeight > 0 && el.offsetWidth > 0,
  );

  const elementTops = elements.map((el) => {
    const rect = el.getBoundingClientRect();
    return {
      top: rect.top - nodeRect.top,
      bottom: rect.bottom - nodeRect.top,
      height: rect.height,
    };
  });

  // 2. High-resolution canvas capture (scale: 3 for 300 DPI ultra-crisp vector-like fonts)
  const canvas = await html2canvas(node, {
    scale: 3,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: "#ffffff",
    windowWidth: 1200,
  });

  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;

  if (canvasWidth === 0 || canvasHeight === 0) {
    throw new Error("Failed to render canvas for PDF export");
  }

  // Exact maximum slice height in canvas pixels that fits in printable area
  const maxPageHeightPx = Math.floor((canvasWidth * PRINTABLE_HEIGHT_MM) / PRINTABLE_WIDTH_MM);

  // Coordinate multiplier between DOM pixels and canvas pixels
  const scaleRatio = canvasHeight / node.scrollHeight;

  // Convert DOM element positions to canvas coordinates
  const canvasBoxes = elementTops.map((b) => ({
    top: Math.round(b.top * scaleRatio),
    bottom: Math.round(b.bottom * scaleRatio),
    height: Math.round(b.height * scaleRatio),
  }));

  // 3. Smart page-break calculation
  const slices: { startY: number; endY: number }[] = [];
  let currentY = 0;

  while (currentY < canvasHeight) {
    const remainingHeight = canvasHeight - currentY;

    if (remainingHeight <= maxPageHeightPx) {
      // Last page fits entirely
      slices.push({ startY: currentY, endY: canvasHeight });
      break;
    }

    const idealEndY = currentY + maxPageHeightPx;

    // Find any block element that crosses the ideal page boundary
    const crossingElements = canvasBoxes.filter(
      (b) => b.top < idealEndY && b.bottom > idealEndY && b.top > currentY,
    );

    let splitY = idealEndY;

    if (crossingElements.length > 0) {
      // Pick the highest element top that starts on this page
      const minTop = Math.min(...crossingElements.map((b) => b.top));

      // Check that pushing it does not leave page unnaturally empty
      if (minTop - currentY >= maxPageHeightPx * 0.35) {
        splitY = Math.max(currentY + 100, minTop - Math.round(8 * scaleRatio));
      }
    } else {
      const nearbyTops = canvasBoxes
        .filter((b) => b.top > idealEndY - maxPageHeightPx * 0.15 && b.top <= idealEndY)
        .map((b) => b.top);

      if (nearbyTops.length > 0) {
        splitY = Math.min(...nearbyTops) - Math.round(8 * scaleRatio);
      }
    }

    if (splitY <= currentY) {
      splitY = idealEndY;
    }

    slices.push({ startY: currentY, endY: splitY });
    currentY = splitY;
  }

  // 4. Construct high-resolution multi-page PDF with consistent margins
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const apiBase = (import.meta.env["VITE_API_URL"] || "").replace(/\/api\/?$/, "");

  const getAttachmentUrl = (attachmentId: string) => {
    const att = m.attachments?.find((a) => a.id === attachmentId);
    if (att?.signedUrl) {
      return att.signedUrl.startsWith("http") ? att.signedUrl : `${apiBase}${att.signedUrl}`;
    }
    return `${apiBase}/api/meetings/${encodeURIComponent(m.id)}/attachments/${encodeURIComponent(attachmentId)}`;
  };

  for (let i = 0; i < slices.length; i++) {
    const slice = slices[i];
    if (!slice) continue;
    const { startY, endY } = slice;
    const sliceHeight = endY - startY;
    const pageHeightMm = (sliceHeight * PRINTABLE_WIDTH_MM) / canvasWidth;

    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = canvasWidth;
    pageCanvas.height = sliceHeight;

    const ctx = pageCanvas.getContext("2d");
    if (ctx) {
      // Crisp white background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvasWidth, sliceHeight);

      // Draw the exact slice from master canvas
      ctx.drawImage(canvas, 0, startY, canvasWidth, sliceHeight, 0, 0, canvasWidth, sliceHeight);

      if (i > 0) {
        pdf.addPage();
      }

      // Lossless PNG for razor-sharp typography placed within margins
      const pageImgData = pageCanvas.toDataURL("image/png");
      pdf.addImage(
        pageImgData,
        "PNG",
        MARGIN_SIDE_MM,
        MARGIN_TOP_MM,
        PRINTABLE_WIDTH_MM,
        pageHeightMm,
      );

      // 4.1. Inject clickable links for documents on this page (secure signed link)
      const docEls = Array.from(node.querySelectorAll<HTMLElement>("[data-doc-id]"));
      for (const el of docEls) {
        const docId = el.getAttribute("data-doc-id");
        if (!docId) continue;
        const rect = el.getBoundingClientRect();
        const topInCanvas = (rect.top - nodeRect.top) * scaleRatio;
        const bottomInCanvas = (rect.bottom - nodeRect.top) * scaleRatio;

        if (topInCanvas >= startY && topInCanvas < endY) {
          const leftInCanvas = (rect.left - nodeRect.left) * scaleRatio;
          const xMm = MARGIN_SIDE_MM + (leftInCanvas * PRINTABLE_WIDTH_MM) / canvasWidth;
          const yMm = MARGIN_TOP_MM + ((topInCanvas - startY) * PRINTABLE_WIDTH_MM) / canvasWidth;
          const wMm = (rect.width * scaleRatio * PRINTABLE_WIDTH_MM) / canvasWidth;
          const hMm = ((Math.min(bottomInCanvas, endY) - topInCanvas) * PRINTABLE_WIDTH_MM) / canvasWidth;

          pdf.setPage(i + 1);
          pdf.link(xMm, yMm, wMm, hMm, {
            url: getAttachmentUrl(docId),
          });
        }
      }

      // 4.2. Inject clickable links for photos on this page (secure signed link)
      const photoEls = Array.from(node.querySelectorAll<HTMLElement>("[data-photo-id]"));
      for (const el of photoEls) {
        const photoId = el.getAttribute("data-photo-id");
        if (!photoId) continue;
        const rect = el.getBoundingClientRect();
        const topInCanvas = (rect.top - nodeRect.top) * scaleRatio;
        const bottomInCanvas = (rect.bottom - nodeRect.top) * scaleRatio;

        if (topInCanvas >= startY && topInCanvas < endY) {
          const leftInCanvas = (rect.left - nodeRect.left) * scaleRatio;
          const xMm = MARGIN_SIDE_MM + (leftInCanvas * PRINTABLE_WIDTH_MM) / canvasWidth;
          const yMm = MARGIN_TOP_MM + ((topInCanvas - startY) * PRINTABLE_WIDTH_MM) / canvasWidth;
          const wMm = (rect.width * scaleRatio * PRINTABLE_WIDTH_MM) / canvasWidth;
          const hMm = ((Math.min(bottomInCanvas, endY) - topInCanvas) * PRINTABLE_WIDTH_MM) / canvasWidth;

          pdf.setPage(i + 1);
          pdf.link(xMm, yMm, wMm, hMm, {
            url: getAttachmentUrl(photoId),
          });
        }
      }
    }
  }

  // 5. Append dedicated full-resolution photo appendix pages in the PDF
  const attachedPhotos = m.attachments.filter((a) => a.kind === "photo");
  if (attachedPhotos.length > 0) {
    for (const photo of attachedPhotos) {
      const src = photo.originalUrl || photo.dataUrl;
      if (!src) continue;

      pdf.addPage();

      // Title & Tag
      pdf.setFontSize(13);
      pdf.setTextColor(28, 31, 38);
      const title = photo.caption || photo.tag || "Meeting Photo";
      pdf.text(title, MARGIN_SIDE_MM, MARGIN_TOP_MM + 4);

      if (photo.tag) {
        pdf.setFontSize(9);
        pdf.setTextColor(207, 32, 48); // BNI Red
        pdf.text(photo.tag.toUpperCase(), MARGIN_SIDE_MM, MARGIN_TOP_MM + 10);
      }

      // Draw photo centered within printable bounds
      try {
        const dims = await new Promise<{ w: number; h: number }>((resolve) => {
          const img = new Image();
          img.onload = () => resolve({ w: img.naturalWidth || 800, h: img.naturalHeight || 600 });
          img.onerror = () => resolve({ w: 800, h: 600 });
          img.src = src;
        });

        const maxW = PRINTABLE_WIDTH_MM;
        const maxH = PRINTABLE_HEIGHT_MM - 28;
        const ratio = Math.min(maxW / dims.w, maxH / dims.h);
        const drawW = dims.w * ratio;
        const drawH = dims.h * ratio;
        const drawX = MARGIN_SIDE_MM + (PRINTABLE_WIDTH_MM - drawW) / 2;
        const drawY = MARGIN_TOP_MM + 14 + (maxH - drawH) / 2;

        pdf.addImage(src, "JPEG", drawX, drawY, drawW, drawH, undefined, "FAST");

        // Link on the photo to open raw photo directly in browser
        pdf.link(drawX, drawY, drawW, drawH, {
          url: getAttachmentUrl(photo.id),
        });
      } catch (err) {
        console.warn("Could not embed full photo into PDF appendix:", err);
      }

      // Footer with direct photo link
      pdf.setFontSize(8);
      pdf.setTextColor(156, 163, 175);
      pdf.text(
        `${CHAPTER} · ${m.date || ""}`,
        MARGIN_SIDE_MM,
        PDF_HEIGHT_MM - MARGIN_BOTTOM_MM,
      );

      const linkText = "[Click to open photo in browser]";
      pdf.setTextColor(207, 32, 48);
      const linkX = PDF_WIDTH_MM - MARGIN_SIDE_MM - 55;
      const linkY = PDF_HEIGHT_MM - MARGIN_BOTTOM_MM;
      pdf.text(linkText, linkX, linkY);
      pdf.link(linkX, linkY - 3, 55, 4, {
        url: getAttachmentUrl(photo.id),
      });
    }
  }

  const safeChapter = (CHAPTER || "meeting").replace(/[^a-zA-Z0-9_-]/g, "-");
  const filename = `${safeChapter}-${m.date || "meeting"}.pdf`;
  pdf.save(filename);
}

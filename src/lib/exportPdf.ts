import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";
import type { Meeting } from "./types";

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
    }
  }

  const filename = `BNI-Elites-${m.date || "meeting"}.pdf`;
  pdf.save(filename);
}

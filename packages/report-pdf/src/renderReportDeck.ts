import { renderStyledDeckReportHtml } from "../../report-html/src/renderReportDeck";

export function renderStyledDeckReportPdfPlan(deck: Parameters<typeof renderStyledDeckReportHtml>[0]) {
  return {
    format: "pdf-static-report-plan",
    html: renderStyledDeckReportHtml(deck),
    effects: "static-only",
  };
}

export const anredeTypValues = ["HERR", "FRAU", "FIRMA"] as const;

export const ANREDE_LABELS: Record<(typeof anredeTypValues)[number], string> = {
  HERR: "Herr",
  FRAU: "Frau",
  FIRMA: "Firma",
};

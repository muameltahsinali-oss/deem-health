/** DH-20260927-0001 */
export function formatOrderNumber(compactDate: string, sequence: number): string {
  if (!/^\d{8}$/.test(compactDate)) throw new Error("compactDate must be YYYYMMDD");
  if (!Number.isInteger(sequence) || sequence < 1) throw new Error("sequence must be a positive integer");
  return `DH-${compactDate}-${String(sequence).padStart(4, "0")}`;
}

export const ORDER_NUMBER_PATTERN = /^DH-\d{8}-\d{4,}$/;

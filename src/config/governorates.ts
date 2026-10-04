/**
 * Iraqi governorates. Used to seed ShippingRate rows.
 * Fees here are DEMO defaults only — the live fees are managed in Admin → Settings → Shipping
 * and read from the database at checkout.
 */
export const IRAQ_GOVERNORATES = [
  { code: "BGD", name: "بغداد", demoFee: 5000 },
  { code: "BSR", name: "البصرة", demoFee: 7000 },
  { code: "NIN", name: "نينوى", demoFee: 7000 },
  { code: "ERB", name: "أربيل", demoFee: 7000 },
  { code: "SUL", name: "السليمانية", demoFee: 7000 },
  { code: "DUH", name: "دهوك", demoFee: 7000 },
  { code: "KRK", name: "كركوك", demoFee: 7000 },
  { code: "ANB", name: "الأنبار", demoFee: 7000 },
  { code: "BBL", name: "بابل", demoFee: 6000 },
  { code: "KRB", name: "كربلاء", demoFee: 6000 },
  { code: "NJF", name: "النجف", demoFee: 6000 },
  { code: "WST", name: "واسط", demoFee: 6000 },
  { code: "DYL", name: "ديالى", demoFee: 6000 },
  { code: "SLD", name: "صلاح الدين", demoFee: 7000 },
  { code: "QAD", name: "القادسية", demoFee: 6000 },
  { code: "MYS", name: "ميسان", demoFee: 7000 },
  { code: "DHQ", name: "ذي قار", demoFee: 7000 },
  { code: "MTH", name: "المثنى", demoFee: 7000 },
  { code: "HLB", name: "حلبجة", demoFee: 7000 },
] as const;

export type GovernorateCode = (typeof IRAQ_GOVERNORATES)[number]["code"];

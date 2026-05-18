// Data model for กวป. monitoring dashboard
// 4 ยุทธศาสตร์ (Strategic Pillars) ตามกระทรวงสาธารณสุข

const PILLARS = [
  { id: "ppp",  code: "P1", name: "ส่งเสริม ป้องกัน คุ้มครอง", en: "PP&P Excellence",        accent: "#2F8F7A" },
  { id: "svc",  code: "P2", name: "บริการเป็นเลิศ",            en: "Service Excellence",     accent: "#3F7BD9" },
  { id: "ppl",  code: "P3", name: "บุคลากรเป็นเลิศ",           en: "People Excellence",      accent: "#B5722B" },
  { id: "gov",  code: "P4", name: "บริหารเป็นเลิศ",            en: "Governance Excellence",  accent: "#6B5BC4" },
];

// Status thresholds: green ≥ 80% of target, yellow ≥ 60%, red < 60% (some inverted)
function classify(v, target, invert = false) {
  const r = invert ? target / Math.max(v, 0.0001) : v / target;
  if (r >= 0.95) return "g";
  if (r >= 0.75) return "y";
  return "r";
}

// 16 indicators across 4 pillars — realistic MoPH-style KPIs
const RAW_KPIS = []; // We will load dynamic KPIs from api.jsx instead

const KPIS = []; // Will be populated dynamically

// Districts (อำเภอ) for the regional drill-down
const DISTRICTS = [
  "อุบลราชธานี", "ศรีสะเกษ", "ยโสธร", "มุกดาหาร", "อำนาจเจริญ"
];

Object.assign(window, { PILLARS, KPIS, DISTRICTS });

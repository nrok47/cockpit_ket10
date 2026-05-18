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
const RAW_KPIS = [
  // PP&P
  { code: "KPI-01", pillar: "ppp", name: "หญิงตั้งครรภ์ได้รับการฝากครรภ์ครบ 5 ครั้งตามเกณฑ์",                 en: "ANC 5 visits quality",            v: 78.4, target: 85,  unit: "%", trend: [72,74,75,77,78.4], owner: "กลุ่มงานส่งเสริมสุขภาพ", regions: 13 },
  { code: "KPI-02", pillar: "ppp", name: "เด็ก 0–5 ปี สูงดีสมส่วน",                                          en: "Child growth standard",            v: 64.2, target: 66,  unit: "%", trend: [60,61,62,63,64.2], owner: "กลุ่มงานส่งเสริมสุขภาพ", regions: 13 },
  { code: "KPI-03", pillar: "ppp", name: "ความครอบคลุมการได้รับวัคซีน MMR เด็กอายุ 1 ปี",                    en: "MMR vaccine coverage",             v: 93.6, target: 95,  unit: "%", trend: [90,91,92,93,93.6], owner: "กลุ่มงานควบคุมโรค",     regions: 13 },
  { code: "KPI-04", pillar: "ppp", name: "ร้อยละการคัดกรองมะเร็งปากมดลูกหญิง 30–60 ปี",                       en: "Cervical CA screening",            v: 48.7, target: 80,  unit: "%", trend: [42,44,46,47,48.7], owner: "กลุ่มงาน NCD",          regions: 13 },

  // Service
  { code: "KPI-05", pillar: "svc", name: "ผู้ป่วยเบาหวานที่ควบคุมระดับน้ำตาลในเลือดได้ดี",                  en: "DM controlled (HbA1c<7)",          v: 37.9, target: 40,  unit: "%", trend: [35,36,36,37,37.9], owner: "เครือข่ายบริการ NCD",   regions: 13 },
  { code: "KPI-06", pillar: "svc", name: "ผู้ป่วยความดันโลหิตสูงที่ควบคุมระดับ BP ได้",                     en: "HT controlled",                    v: 56.2, target: 60,  unit: "%", trend: [50,52,54,55,56.2], owner: "เครือข่ายบริการ NCD",   regions: 13 },
  { code: "KPI-07", pillar: "svc", name: "อัตราการเสียชีวิตในผู้ป่วยโรคหลอดเลือดสมอง (Stroke)",            en: "Stroke fatality rate",             v: 6.8,  target: 7,   unit: "%", trend: [8.4,8.0,7.5,7.0,6.8], owner: "กลุ่มงานบริการทุติยภูมิ", regions: 12, invert: true },
  { code: "KPI-08", pillar: "svc", name: "ระยะเวลารอคอย ER ผู้ป่วยฉุกเฉินวิกฤต < 30 นาที",                 en: "ER wait < 30 min",                 v: 86.4, target: 80,  unit: "%", trend: [78,80,82,85,86.4], owner: "EMS",                  regions: 13 },
  { code: "KPI-09", pillar: "svc", name: "ผู้ป่วยที่รับบริการ One Day Surgery",                            en: "One day surgery uptake",           v: 71.0, target: 80,  unit: "%", trend: [55,60,65,68,71], owner: "ศัลยกรรม",              regions: 8  },

  // People
  { code: "KPI-10", pillar: "ppl", name: "อัตราคงอยู่ของบุคลากรสาธารณสุข",                                  en: "Workforce retention",              v: 88.2, target: 90,  unit: "%", trend: [85,86,87,88,88.2], owner: "กลุ่มงานบริหารทรัพยากรบุคคล", regions: 13 },
  { code: "KPI-11", pillar: "ppl", name: "ดัชนีความสุขของบุคลากร (Happinometer ≥ 60)",                    en: "Staff happiness index",            v: 72.5, target: 70,  unit: "%", trend: [66,68,70,71,72.5], owner: "HRD",                  regions: 13 },
  { code: "KPI-12", pillar: "ppl", name: "บุคลากรได้รับการพัฒนาความรู้ ≥ 20 ชม./ปี",                       en: "Learning hours ≥20",               v: 63.1, target: 80,  unit: "%", trend: [50,55,58,61,63.1], owner: "HRD",                  regions: 13 },

  // Governance
  { code: "KPI-13", pillar: "gov", name: "หน่วยงานในสังกัดผ่านการประเมิน ITA ≥ 95 คะแนน",                  en: "ITA pass rate ≥95",                v: 92.0, target: 90,  unit: "%", trend: [82,85,88,90,92], owner: "ตรวจสอบภายใน",          regions: 13 },
  { code: "KPI-14", pillar: "gov", name: "ร้อยละการเบิกจ่ายงบประมาณภาพรวม",                              en: "Budget disbursement",              v: 67.3, target: 80,  unit: "%", trend: [40,52,60,65,67.3], owner: "กลุ่มงานบริหาร",        regions: 13 },
  { code: "KPI-15", pillar: "gov", name: "หน่วยบริการลดสถานะวิกฤติด้านการเงิน (ระดับ 7)",                 en: "Financial risk reduction",         v: 81.5, target: 75,  unit: "%", trend: [60,68,72,78,81.5], owner: "กลุ่มงานประกันสุขภาพ", regions: 13 },
  { code: "KPI-16", pillar: "gov", name: "โรงพยาบาลผ่าน Smart Hospital ระดับ 2 ขึ้นไป",                   en: "Smart Hospital L2+",               v: 44.6, target: 70,  unit: "%", trend: [25,30,35,40,44.6], owner: "ดิจิทัลสุขภาพ",         regions: 13 },
];

const KPIS = RAW_KPIS.map(k => ({ ...k, status: classify(k.v, k.target, k.invert) }));

// Districts (อำเภอ) for the regional drill-down
const DISTRICTS = [
  "เมือง","แม่ริม","สันทราย","สันกำแพง","หางดง","สารภี","ดอยสะเก็ด",
  "แม่แตง","พร้าว","ฝาง","ไชยปราการ","แม่อาย","อมก๋อย"
];

Object.assign(window, { PILLARS, KPIS, DISTRICTS });

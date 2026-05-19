// API Data Fetcher for กวป. Dashboard — Health Region 10
// ปีงบประมาณไทย: ต.ค.–ก.ย. → คำนวณอัตโนมัติ ไม่ต้องแก้ทุกปี

function getThaiYear() {
  const now = new Date();
  const add = now.getMonth() + 1 >= 10 ? 544 : 543;
  return now.getFullYear() + add;
}
const _Y = getThaiYear();
const CURRENT_YEAR = String(_Y);
const PREV_YEAR    = String(_Y - 1);
const PREV2_YEAR   = String(_Y - 2);
const SHEET_ID     = "1RlIRo8vZ0fgQOj-vVZ72P9ioUgxIY_WWQw4AfjNV_Pg";
const SHEET_URL    = `https://docs.google.com/spreadsheets/d/${SHEET_ID}`;
const gvizBase     = `${SHEET_URL}/gviz/tq?tqx=out:csv&sheet=`;

// ---------------------------------------------------------
// KPI CONFIG
// yearCol: 0 = คอลัมน์ "year" (เพิ่มโดย moph_sync.gs)
// sourceUrl: URL ต้นทางข้อมูลจริง → ใช้ใน "เปิดรายงานเต็ม" button
// ---------------------------------------------------------
const MOPH_OD_BASE = "https://opendata.moph.go.th/th/services/summary-table";
const ANAMAI_BASE  = "https://dashboard.anamai.moph.go.th/dashboard";

const KPI_CONFIG = [
  // ── ข้อมูลจริงจาก s_dm_ht_control ────────────────────────
  {
    code: "NCD-03",
    pillar: "ppp",
    name: "ผู้ป่วยเบาหวานควบคุมระดับน้ำตาลได้ดี",
    en: "DM Good Control",
    target: 40,
    owner: "เครือข่าย NCD",
    csvUrl: gvizBase + "s_dm_ht_control",
    yearCol: 0,
    targetColIndex: 6,
    resultColIndex: 7,
    sourceUrl: `${MOPH_OD_BASE}/1ed90bc32310b503b7ca9b32af425ae5/s_dm_ht_control/4164a7c49fcb2b8c3ccca67dcdf28bd0`,
    startRow: 1
  },
  {
    code: "NCD-04",
    pillar: "svc",
    name: "ผู้ป่วยความดันโลหิตสูงควบคุมความดันได้ดี",
    en: "HT Good Control",
    target: 60,
    owner: "เครือข่าย NCD",
    csvUrl: gvizBase + "s_dm_ht_control",
    yearCol: 0,
    targetColIndex: 8,
    resultColIndex: 9,
    sourceUrl: `${MOPH_OD_BASE}/1ed90bc32310b503b7ca9b32af425ae5/s_dm_ht_control/4164a7c49fcb2b8c3ccca67dcdf28bd0`,
    startRow: 1
  },

  // ── ข้อมูลจริงจาก s_aged10 ────────────────────────────────
  {
    code: "ELD-01",
    pillar: "ppp",
    name: "ผู้สูงอายุ ADL ≥ 12 คะแนน (ช่วยเหลือตัวเองได้)",
    en: "Elderly Good Functional Status",
    target: 80,
    owner: "กลุ่มงานส่งเสริมสุขภาพ",
    csvUrl: gvizBase + "s_aged10",
    yearCol: 0,
    targetColIndex: 6,
    resultColIndex: 21,
    sourceUrl: `${MOPH_OD_BASE}/1ed90bc32310b503b7ca9b32af425ae5/s_aged10/018f84aea4b077c2b2747b038011a384`,
    startRow: 1
  },

  // ── s_child = ทารกแรกเกิดน้ำหนัก < 2,500 กรัม ─────────────
  {
    code: "CHD-02",
    pillar: "ppp",
    name: "ทารกแรกเกิดน้ำหนักน้อยกว่า 2,500 กรัม",
    en: "Low Birth Weight < 2,500g",
    target: 7,
    owner: "กลุ่มงานอนามัยแม่และเด็ก",
    csvUrl: gvizBase + "s_child",
    yearCol: 0,
    targetColIndex: 6,
    resultColIndex: 7,
    inv: true,
    sourceUrl: `${MOPH_OD_BASE}/1ed90bc32310b503b7ca9b32af425ae5/s_child/ce4f9fcd9cd41b6cb2f79b2440a6f4cc`,
    startRow: 1
  },

  // ── s_early_anc = ฝากครรภ์ครั้งแรก < 12 สัปดาห์ ──────────
  {
    code: "MCH-01",
    pillar: "ppp",
    name: "ฝากครรภ์ครั้งแรก ก่อน 12 สัปดาห์",
    en: "Early ANC (< 12 weeks)",
    target: 75,
    owner: "กลุ่มงานอนามัยแม่และเด็ก",
    csvUrl: gvizBase + "s_early_anc",
    yearCol: 0,
    targetColIndex: 6,
    resultColIndex: 7,
    fallbackV: 76.2,
    fallbackPrev: 73.1,
    sourceUrl: `${MOPH_OD_BASE}/1ed90bc32310b503b7ca9b32af425ae5/s_early_anc/c46937050a3fa5198e5cd139578a3732`,
    startRow: 1
  },

  // ── MCH-02: อัตราคลอดวัยรุ่น 15–19 ปี → Anamai (link-to-source) ──
  // นิยาม: ต่อ 1,000 หญิงอายุ 15-19 ปี, เป้า ≤21/พัน
  // ผล 2568 เขต10: 16.36/พัน (บรรลุ ✅) — ใช้เป็น fallback คงที่
  // "เปิดรายงานเต็ม" → Anamai dashboard โดยตรง
  {
    code: "MCH-02",
    pillar: "ppp",
    name: "อัตราคลอดวัยรุ่น 15–19 ปี",
    en: "Adolescent Birth Rate (15-19)",
    target: 21,
    unit: "/พัน",
    owner: "กลุ่มงานอนามัยแม่และเด็ก",
    csvUrl: null,          // ไม่ sync ผ่าน Sheets — ใช้ link-to-source
    fallbackV: 16.36,
    fallbackPrev: 17.50,
    inv: true,
    sourceUrl: "https://dashboard.anamai.moph.go.th/dashboard/labor1519n/changwat?year=2025&kid=229&rg=10"
  },

  // ── s_kpi_food = เด็กแรกเกิด-6 เดือน กินนมแม่อย่างเดียว (MCH-03) ──
  // ชื่อจริง: "ร้อยละของเด็กแรกเกิด - ต่ำกว่า 6 เดือน กินนมแม่อย่างเดียว"
  // target (col6) = เด็กอายุครบ 6 เดือนที่ถูกสอบถามเรื่องการกินนมแม่
  // result (col7) = กินนมแม่อย่างเดียว 6 เดือน
  // Anamai kid=9 เป้า 50%
  {
    code: "MCH-03",
    pillar: "ppp",
    name: "เด็กแรกเกิด-6 เดือน กินนมแม่อย่างเดียว",
    en: "Exclusive Breastfeeding < 6 months",
    target: 50,
    owner: "กลุ่มงานอนามัยแม่และเด็ก",
    csvUrl: gvizBase + "s_kpi_food",
    yearCol: 0,
    targetColIndex: 6,
    resultColIndex: 7,
    sourceUrl: `${MOPH_OD_BASE}/bebf866fceaef84c4078965eaf619565/s_kpi_food/4164a7c49fcb2b8c3ccca67dcdf28bd0`,
    startRow: 1
  },

  // ── Mock / Fallback + link-to-source ───────────────────────
  {
    code: "NCD-01",
    pillar: "ppp",
    name: "ร้อยละการคัดกรองโรคเบาหวาน (DM) กลุ่มเสี่ยง",
    en: "DM Screening Rate",
    target: 80,
    owner: "เครือข่าย NCD",
    csvUrl: null,
    fallbackV: 78.4,
    fallbackPrev: 74.1,
    sourceUrl: `${ANAMAI_BASE}/indicatordoh?year=2025&kid=4270`
  },
  {
    code: "NCD-02",
    pillar: "ppp",
    name: "ร้อยละการคัดกรองโรคความดันโลหิตสูง (HT) กลุ่มเสี่ยง",
    en: "HT Screening Rate",
    target: 80,
    owner: "เครือข่าย NCD",
    csvUrl: null,
    fallbackV: 82.1,
    fallbackPrev: 79.3,
    sourceUrl: `${ANAMAI_BASE}/indicatordoh?year=2025&kid=4270`
  }
];

// ---------------------------------------------------------
// CSV Parser
// ---------------------------------------------------------
function parseCSV(str) {
  const arr = [];
  let quote = false, row = [], col = "", c;
  for (let i = 0; i < str.length; i++) {
    c = str[i];
    if (c === '"' && str[i + 1] === '"') { col += '"'; i++; }
    else if (c === '"') { quote = !quote; }
    else if (c === ',' && !quote) { row.push(col.trim()); col = ""; }
    else if (c === '\n' && !quote) {
      if (str[i - 1] === '\r') col = col.slice(0, -1);
      row.push(col.trim()); arr.push(row);
      col = ""; row = [];
    } else { col += c; }
  }
  if (col !== "") row.push(col.trim());
  if (row.length > 0) arr.push(row);
  return arr;
}

window.HealthData = { kpis: [], isLoaded: false };

// ---------------------------------------------------------
// Main fetch
// ---------------------------------------------------------
async function fetchHealthData() {
  try {
    // 1. จัดกลุ่ม URL ที่ต้องดึง (ไม่ซ้ำ)
    const urlMap = {};
    for (const cfg of KPI_CONFIG) {
      if (cfg.csvUrl && !urlMap[cfg.csvUrl]) {
        urlMap[cfg.csvUrl] = { promise: fetch(cfg.csvUrl).then(r => r.text()), data: null };
      }
    }
    await Promise.all(Object.keys(urlMap).map(async url => {
      urlMap[url].data = parseCSV(await urlMap[url].promise);
    }));

    // 2. ประมวลผลแต่ละ KPI
    const calcPct = (res, tar) => tar > 0 ? Number(((res / tar) * 100).toFixed(1)) : 0;
    const sumRows  = (rows, cfg) => {
      let tar = 0, res = 0;
      rows.forEach(r => {
        tar += parseInt(r[cfg.targetColIndex]) || 0;
        res += parseInt(r[cfg.resultColIndex]) || 0;
      });
      return { tar, res };
    };
    const dynamicKpis = [];

    for (const cfg of KPI_CONFIG) {
      let v69 = null, v68 = null, v67 = null; // 2569, 2568, 2567
      let dataYear = CURRENT_YEAR;             // ปีที่แสดงจริง (fallback ถ้า 2569 ไม่มี)
      let isMock = !cfg.csvUrl;

      if (!cfg.csvUrl) {
        // Fallback mode
        v69 = cfg.fallbackV;
        v68 = cfg.fallbackPrev ?? null;
        v67 = null;
      } else {
        const rows     = urlMap[cfg.csvUrl].data;
        const start    = cfg.startRow ?? 1;
        const dataRows = rows.slice(start).filter(r => r.length > 1 && r[1]);

        const useY     = cfg.yearOverride?.current ?? CURRENT_YEAR;
        const usePrev  = cfg.yearOverride?.prev    ?? PREV_YEAR;
        const usePrev2 = cfg.yearOverride?.prev2   ?? PREV2_YEAR;

        if (cfg.yearCol !== undefined) {
          const r69 = dataRows.filter(r => r[cfg.yearCol] === useY);
          const r68 = dataRows.filter(r => r[cfg.yearCol] === usePrev);
          const r67 = dataRows.filter(r => r[cfg.yearCol] === usePrev2);

          const s69 = sumRows(r69, cfg);
          const s68 = sumRows(r68, cfg);
          const s67 = sumRows(r67, cfg);

          v69 = s69.tar > 0 ? calcPct(s69.res, s69.tar) : null;
          v68 = s68.tar > 0 ? calcPct(s68.res, s68.tar) : null;
          v67 = s67.tar > 0 ? calcPct(s67.res, s67.tar) : null;
        } else {
          const s = sumRows(dataRows, cfg);
          v69 = s.tar > 0 ? calcPct(s.res, s.tar) : null;
        }

        // ถ้า 2569 ไม่มีข้อมูล ใช้ปีล่าสุดที่มีแทน
        if (v69 === null && v68 !== null) { v69 = v68; v68 = v67; v67 = null; dataYear = PREV_YEAR; isMock = true; }
        else if (v69 === null && v67 !== null) { v69 = v67; v68 = null; v67 = null; dataYear = PREV2_YEAR; isMock = true; }

        // ถ้า Sheet ว่างหมด (API 404 ชั่วคราว) → ใช้ fallback ถ้ามี
        if (v69 === null && v68 === null && v67 === null && cfg.fallbackV != null) {
          v69 = cfg.fallbackV;
          v68 = cfg.fallbackPrev ?? null;
          isMock = true;
          dataYear = "fallback";
        }
      }

      const currV = v69 ?? 0;
      // Fix: รองรับ inv=true (ยิ่งน้อยยิ่งดี) → ratio = target/v แทน v/target
      const ratio  = cfg.inv ? cfg.target / Math.max(currV, 0.001) : currV / cfg.target;
      const status = ratio >= 0.95 ? "g" : ratio >= 0.75 ? "y" : "r";

      // trend 3 จุด [2567, 2568, 2569] — ใช้ currV แทนปีที่ null
      const trend = [v67 ?? currV, v68 ?? currV, currV];

      dynamicKpis.push({
        code:     cfg.code,
        pillar:   cfg.pillar,
        name:     cfg.name,
        en:       cfg.en,
        v:        currV,
        v67, v68, v69,
        dataYear,          // ปีที่ใช้แสดง (อาจไม่ใช่ 2569 ถ้าไม่มีข้อมูล)
        target:   cfg.target,
        unit:     cfg.unit ?? "%",
        trend,             // [2567, 2568, 2569]
        owner:    cfg.owner,
        regions:  5,
        status,
        isMock,
        inv:       cfg.inv ?? false,
        sourceUrl: cfg.sourceUrl ?? (cfg.csvUrl ? `${SHEET_URL}/edit` : null),
      });
    }

    window.HealthData.kpis = dynamicKpis;
    window.HealthData.isLoaded = true;
    return dynamicKpis;

  } catch (err) {
    console.error("fetchHealthData failed:", err);
    return [];
  }
}

// Expose config globally so report.html can use it
window.KPI_CONFIG = KPI_CONFIG;
window.PROVINCES  = { "33":"ศรีสะเกษ", "34":"อุบลราชธานี", "35":"ยโสธร", "37":"อำนาจเจริญ", "49":"มุกดาหาร" };
window.getThaiYear = getThaiYear;

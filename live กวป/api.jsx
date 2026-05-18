// API Data Fetcher for กวป. Dashboard (Health Region 10)

// ---------------------------------------------------------
// การตั้งค่า KPI (สามารถแก้ไข/เพิ่ม KPI และระบุคอลัมน์ได้ที่นี่)
// ---------------------------------------------------------
const KPI_CONFIG = [
  { 
    code: "NCD-01", 
    pillar: "ppp", 
    name: "ร้อยละการคัดกรองโรคเบาหวาน (DM)", 
    en: "DM Screening Rate", 
    target: 80, 
    owner: "เครือข่าย NCD",
    // ลิงก์ CSV ของชีตที่ต้องการ (สังเกต gid=... ต้องตรงกับชีตนั้นๆ)
    csvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRU7rUCn-Exwho6C8WnGSiU1jim7j5diGaBEma6e3zpVHzWuK8KHwu5EYaDwgu6lW41jglgsfrUK8vK/pub?gid=1659552790&single=true&output=csv",
    targetColIndex: 2, // คอลัมน์ เป้า_คัดกรอง_DM (เริ่มนับ 0 จากซ้าย)
    resultColIndex: 3, // คอลัมน์ ผลงาน_คัดกรอง_DM
    startRow: 1 // ข้าม Header แถวแรก
  },
  { 
    code: "NCD-02", 
    pillar: "ppp", 
    name: "ร้อยละการคัดกรองโรคความดันโลหิตสูง (HT)", 
    en: "HT Screening Rate", 
    target: 80, 
    owner: "เครือข่าย NCD",
    csvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRU7rUCn-Exwho6C8WnGSiU1jim7j5diGaBEma6e3zpVHzWuK8KHwu5EYaDwgu6lW41jglgsfrUK8vK/pub?gid=1659552790&single=true&output=csv",
    targetColIndex: 4, 
    resultColIndex: 5, 
    startRow: 1
  },
  { 
    code: "NCD-03", 
    pillar: "svc", 
    name: "ผู้ป่วยเบาหวานควบคุมระดับน้ำตาลได้ดี (Good Control)", 
    en: "DM Good Control", 
    target: 40, 
    owner: "เครือข่ายบริการ NCD",
    csvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRU7rUCn-Exwho6C8WnGSiU1jim7j5diGaBEma6e3zpVHzWuK8KHwu5EYaDwgu6lW41jglgsfrUK8vK/pub?gid=1659552790&single=true&output=csv",
    targetColIndex: 12, 
    resultColIndex: 13, 
    startRow: 1
  },
  { 
    code: "NCD-04", 
    pillar: "svc", 
    name: "ผู้ป่วยความดันโลหิตสูงควบคุมความดันได้ดี (Good Control)", 
    en: "HT Good Control", 
    target: 60, 
    owner: "เครือข่ายบริการ NCD",
    csvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRU7rUCn-Exwho6C8WnGSiU1jim7j5diGaBEma6e3zpVHzWuK8KHwu5EYaDwgu6lW41jglgsfrUK8vK/pub?gid=1659552790&single=true&output=csv",
    targetColIndex: 14, 
    resultColIndex: 15, 
    startRow: 1
  }
  // สามารถ copy โครงสร้างด้านบนเพื่อเพิ่ม KPI ตัวอื่นๆ ได้
];

// Helper to parse simple CSV
function parseCSV(str) {
  const arr = [];
  let quote = false;
  let row = [], col = "", c;
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

// Global state for dynamic data
window.HealthData = {
  kpis: [],
  isLoaded: false
};

// Fetch and aggregate data dynamically based on config
async function fetchHealthData() {
  try {
    // 1. จัดกลุ่ม URL ที่ซ้ำกัน เพื่อจะได้ไม่ต้องดึงข้อมูลชีตเดียวกันหลายรอบ
    const urlMap = {};
    for (const config of KPI_CONFIG) {
      if (!urlMap[config.csvUrl]) {
        urlMap[config.csvUrl] = { fetchPromise: fetch(config.csvUrl).then(r => r.text()), data: null };
      }
    }

    // 2. ดึงข้อมูล CSV ทั้งหมดแบบคู่ขนาน (Parallel)
    const fetchKeys = Object.keys(urlMap);
    await Promise.all(fetchKeys.map(async url => {
      const text = await urlMap[url].fetchPromise;
      urlMap[url].data = parseCSV(text);
    }));

    // 3. ประมวลผลและสร้าง KPI
    const calcPercent = (res, tar) => tar > 0 ? Number(((res / tar) * 100).toFixed(1)) : 0;
    const dynamicKpis = [];

    for (const config of KPI_CONFIG) {
      const rows = urlMap[config.csvUrl].data;
      let totalTarget = 0;
      let totalResult = 0;

      // รวมผลรวมจากทุกแถว (ข้าม Header ตาม startRow)
      const start = config.startRow !== undefined ? config.startRow : 1;
      for (let i = start; i < rows.length; i++) {
        const row = rows[i];
        if (row.length === 0 || !row[0]) continue; // ข้ามบรรทัดว่าง
        
        // บวกค่า (ถ้าไม่มีข้อมูลให้เป็น 0)
        totalTarget += parseInt(row[config.targetColIndex]) || 0;
        totalResult += parseInt(row[config.resultColIndex]) || 0;
      }

      const percent = calcPercent(totalResult, totalTarget);
      
      // คำนวณสีสถานะ (Status classify logic)
      let status = "r";
      const r = percent / config.target;
      if (r >= 0.95) status = "g";
      else if (r >= 0.75) status = "y";

      // สร้าง Object KPI สำหรับ Dashboard
      dynamicKpis.push({
        code: config.code,
        pillar: config.pillar,
        name: config.name,
        en: config.en,
        v: percent,
        target: config.target,
        unit: "%",
        // จำลอง Trend ชั่วคราว (หากมีข้อมูลย้อนหลังสามารถดึงมาคำนวณได้)
        trend: [percent-5, percent-3, percent-1, percent, percent], 
        owner: config.owner,
        regions: 5,
        status: status
      });
    }

    window.HealthData.kpis = dynamicKpis;
    window.HealthData.isLoaded = true;

    return dynamicKpis;

  } catch (err) {
    console.error("Failed to fetch health data", err);
    return [];
  }
}

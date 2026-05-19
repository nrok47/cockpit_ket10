/**
 * MOPH Open Data API to Google Sheets Sync (Multi-Table)
 * 
 * 1. วางโค้ดนี้ใน Google Apps Script (ส่วนขยาย > Apps Script) ของ Google Sheet
 * 2. สามารถเพิ่มหรือลดชื่อตารางในตัวแปร TABLE_NAMES ได้ตามต้องการ
 * 3. กดรันฟังก์ชัน fetchMophApi() โค้ดจะสร้าง/เขียนทับ Sheet ตามชื่อตารางให้อัตโนมัติ
 * 4. สามารถตั้ง Trigger ให้รันอัตโนมัติทุกวันได้
 */

const API_URL = "https://opendata.moph.go.th/api/report_data";
// 📋 วิธีดูชื่อตาราง + column definitions:
//    เปิด https://opendata.moph.go.th → Summary Table → ค้นหาตาราง
//    หน้าตารางจะแสดง: ชื่อรายงาน, โครงสร้างตาราง (column comment), ปีที่มีข้อมูล, ตัวอย่างข้อมูล
//    URI Service ในหน้านั้นจะบอกชื่อ tableName ที่ถูกต้องสำหรับ API call

// รหัสจังหวัดในเขตสุขภาพที่ 10
// 33 = ศรีสะเกษ, 34 = อุบลราชธานี, 35 = ยโสธร, 37 = อำนาจเจริญ, 49 = มุกดาหาร
const PROVINCES = ["33", "34", "35", "37", "49"];

// ปีงบประมาณ — เพิ่ม "2566" ไว้เผื่อตารางบางตัวล็อก data ปีก่อน
// ปีงบประมาณไทย: ต.ค.–ก.ย. → เดือน ≥ 10 ขยับปีถัดไป
function getThaiYear() {
  const now = new Date();
  const add = now.getMonth() + 1 >= 10 ? 544 : 543;
  return now.getFullYear() + add;
}
const THIS_YEAR      = getThaiYear();
const YEARS_DEFAULT  = [String(THIS_YEAR - 2), String(THIS_YEAR - 1), String(THIS_YEAR)];
const YEARS_EXTENDED = [String(THIS_YEAR - 3), String(THIS_YEAR - 2), String(THIS_YEAR - 1), String(THIS_YEAR)];

// ── TABLE CONFIG ────────────────────────────────────────────────────────────
// years: override ปีที่จะดึง (ถ้าไม่ระบุ ใช้ YEARS_DEFAULT)
// ────────────────────────────────────────────────────────────────────────────
const TABLES = [
  // ── ข้อมูลจริงที่ใช้อยู่แล้ว ──────────────────────────────
  { name: "s_dm_ht_control" },
  { name: "s_aged10"        },
  { name: "s_child"         },
  { name: "s_early_anc",  years: YEARS_EXTENDED },
  { name: "s_labor1519",  years: YEARS_EXTENDED },

  // ── Phase 1: confirmed new tables ──────────────────────────
  // CHD-03: workload คัดกรองพัฒนาการเด็ก 0-5 ปี (c_1=9m, c_2=18m, c_3=30m, c_4=42m, c_5=60m)
  // หมายเหตุ: ข้อมูลปี 2569 ยังว่าง → ใช้ 2568 เป็นปีล่าสุด
  { name: "s_child0_5_pshyche_develop_workload", years: [String(THIS_YEAR-2), String(THIS_YEAR-1)] },

  // ── MCH-03: เด็กแรกเกิด-6 เดือน กินนมแม่อย่างเดียว ──────────
  // ชื่อจริง: "ร้อยละของเด็กแรกเกิด - ต่ำกว่า 6 เดือน กินนมแม่อย่างเดียว"
  { name: "s_kpi_food" },

  // ── CHD-04: ภาวะโลหิตจางในเด็กอายุครบ 5 ปี ──────────────────
  // ชื่อจริง: "ร้อยละเด็กอายุครบ 5 ปีในเขตรับผิดชอบ มีภาวะโลหิตจาง (Coverage)"
  // inv=true (ยิ่งน้อยยิ่งดี) → col mapping ยืนยันหลัง probeTable
  { name: "s_child4_hct" },

  // ── WRA-01: s_hct1549 → 404 ทุก province/year → ใช้ Pattern B (link-only)
  // { name: "s_hct1549" },  // comment out — API ไม่พร้อม
];

// ────────────────────────────────────────────────────────────────────────────
// MAIN
// ────────────────────────────────────────────────────────────────────────────
function fetchMophApi() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  for (const table of TABLES) {
    const tableName = table.name;
    const years     = table.years || YEARS_DEFAULT;

    Logger.log("=========================================");
    Logger.log("Table: " + tableName + " | Years: " + years.join(", "));

    let sheet = ss.getSheetByName(tableName);
    if (!sheet) sheet = ss.insertSheet(tableName);
    sheet.clear();

    let isHeaderWritten = false;
    let totalRows = 0;

    for (const year of years) {
      Logger.log("--- Year: " + year + " ---");

      for (const provinceCode of PROVINCES) {
        try {
          const payload = { tableName, year, province: provinceCode, type: "json" };
          const options = {
            method: "post",
            headers: { "Content-Type": "application/json" },
            payload: JSON.stringify(payload),
            muteHttpExceptions: true
          };

          // retry สูงสุด 5 รอบ ห่างกัน 13 วิ — ถ้าไม่ผ่านทุกรอบ skip
          const MAX_RETRY = 5;
          let response, statusCode;
          for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
            response   = UrlFetchApp.fetch(API_URL, options);
            statusCode = response.getResponseCode();
            if (statusCode === 200 || statusCode === 201) break;
            if (attempt < MAX_RETRY) {
              Logger.log("  [" + attempt + "/" + MAX_RETRY + "] รอ 13s แล้วลองใหม่ (" + provinceCode + "/" + year + ")...");
              Utilities.sleep(13000);
            }
          }

          if (statusCode !== 200 && statusCode !== 201) {
            Logger.log("  ❌ ปล่อยไป " + provinceCode + "/" + year + " หลัง " + MAX_RETRY + " รอบ → HTTP " + statusCode);
            continue;
          }

          const json = JSON.parse(response.getContentText());
          const dataArray = json.data || json;

          if (!Array.isArray(dataArray) || dataArray.length === 0) {
            Logger.log("  Empty: " + provinceCode + "/" + year);
            continue;
          }

          const headers = Object.keys(dataArray[0]);
          if (!isHeaderWritten) {
            sheet.appendRow(["year", ...headers]);
            isHeaderWritten = true;
          }

          const rows = dataArray.map(item => [year, ...headers.map(h => item[h])]);
          sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
          totalRows += rows.length;
          Logger.log("  OK: " + provinceCode + "/" + year + " → " + rows.length + " rows");

        } catch (e) {
          Logger.log("  Exception " + provinceCode + "/" + year + ": " + e.toString());
        }
      }
    }

    Logger.log("Done: " + tableName + " → " + totalRows + " total rows");
  }
}

// ────────────────────────────────────────────────────────────────────────────
// ADMIN WEB APP
// Deploy → New Deployment → Web App → Execute as Me → Anyone with link
// ────────────────────────────────────────────────────────────────────────────
function doGet() {
  return HtmlService.createHtmlOutputFromFile("admin")
    .setTitle("Admin Sync — KPI ศอ.10")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ดึงข้อมูลตารางเดียว — เรียกจาก admin.html ผ่าน google.script.run
function fetchSingleTable(tableName) {
  const tableConfig = TABLES.find(t => t.name === tableName);
  if (!tableConfig) throw new Error("ไม่พบตาราง: " + tableName);

  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const years = tableConfig.years || YEARS_DEFAULT;

  let sheet = ss.getSheetByName(tableName);
  if (!sheet) sheet = ss.insertSheet(tableName);
  sheet.clear();

  let isHeaderWritten = false, totalRows = 0, skipped = 0;
  const MAX_RETRY = 5;

  for (const year of years) {
    for (const prov of PROVINCES) {
      const payload = { tableName, year, province: prov, type: "json" };
      const options = {
        method: "post",
        headers: { "Content-Type": "application/json" },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      };

      let response, statusCode;
      for (let i = 1; i <= MAX_RETRY; i++) {
        response   = UrlFetchApp.fetch(API_URL, options);
        statusCode = response.getResponseCode();
        if (statusCode === 200 || statusCode === 201) break;
        if (i < MAX_RETRY) Utilities.sleep(13000);
      }

      if (statusCode !== 200 && statusCode !== 201) { skipped++; continue; }

      const json      = JSON.parse(response.getContentText());
      const dataArray = json.data || json;
      if (!Array.isArray(dataArray) || dataArray.length === 0) continue;

      const headers = Object.keys(dataArray[0]);
      if (!isHeaderWritten) { sheet.appendRow(["year", ...headers]); isHeaderWritten = true; }

      const rows = dataArray.map(item => [year, ...headers.map(h => item[h])]);
      sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
      totalRows += rows.length;
    }
  }

  return { rows: totalRows, skipped, table: tableName };
}

// ดึงทุกตารางพร้อมกัน (เรียกจาก admin หรือ trigger)
function fetchAllTables() {
  const results = [];
  for (const table of TABLES) {
    try {
      const r = fetchSingleTable(table.name);
      results.push(r);
    } catch(e) {
      results.push({ table: table.name, rows: 0, skipped: -1, error: e.message });
    }
  }
  return results;
}

// ────────────────────────────────────────────────────────────────────────────
// DEBUG: ทดสอบตารางเดียว — รันฟังก์ชันนี้เพื่อดู columns + ตัวอย่างข้อมูล
// เปลี่ยน TABLE_TO_PROBE และ PROBE_YEAR ตามต้องการ
// ────────────────────────────────────────────────────────────────────────────
// ── เปลี่ยน TABLE_TO_PROBE แล้วรัน probeTable() ──────────────
// Phase 1 probe list (ทดสอบทีละตัว):
//   "s_tb"           → วัณโรค (TB-01)
//   "s_mental"       → สุขภาพจิต ซึมเศร้า (MH-01)
//   "s_breastfeed"   → นมแม่อย่างเดียว (MCH-03)
//   "s_dengue"       → ไข้เลือดออก (DEN-01)
const TABLE_TO_PROBE = "s_child4_hct"; // CHD-04 ภาวะโลหิตจางเด็ก → ลอง probe ก่อน
// ถัดไปลอง: "s_hct1549"  (WRA-01 หญิงวัยเจริญพันธุ์)
const PROBE_YEAR     = String(THIS_YEAR);
const PROBE_PROVINCE = "34"; // อุบล

function probeTable() {
  // ถ้าได้ 400 "Parameter Invalid" → ลองเปลี่ยน province หลายค่า
  const PROBE_PROVINCES = ["34", "11", "10", "33", "49"]; // "11"=นนทบุรี ตัวอย่างจาก MOPH
  const PROBE_YEARS     = [PROBE_YEAR, String(THIS_YEAR - 1), String(THIS_YEAR - 2), "2566"];

  for (const yr of PROBE_YEARS) {
    for (const pv of PROBE_PROVINCES) {
      const payload = { tableName: TABLE_TO_PROBE, year: yr, province: pv, type: "json" };
      const options = {
        method: "post",
        headers: { "Content-Type": "application/json" },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      };
      const response = UrlFetchApp.fetch(API_URL, options);
      const status   = response.getResponseCode();
      const body     = response.getContentText();

      Logger.log(`year=${yr} province="${pv}" → HTTP ${status}`);

      if (status === 200 || status === 201) {
        try {
          const json = JSON.parse(body);
          const arr  = json.data || json;
          if (Array.isArray(arr) && arr.length > 0) {
            Logger.log("✅ SUCCESS! Columns: " + Object.keys(arr[0]).join(", "));
            Logger.log("Row 0: " + JSON.stringify(arr[0]));
            return; // หยุดทันทีเมื่อได้ข้อมูล
          } else {
            Logger.log("  → Empty response");
          }
        } catch(e) { Logger.log("  → Parse error: " + e); }
      } else {
        Logger.log("  → " + body.substring(0, 80));
      }
    }
  }
  Logger.log("❌ ไม่พบ parameter ที่ใช้ได้สำหรับ " + TABLE_TO_PROBE);
}

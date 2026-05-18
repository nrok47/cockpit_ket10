/**
 * MOPH Open Data API to Google Sheets Sync (Multi-Table)
 * 
 * 1. วางโค้ดนี้ใน Google Apps Script (ส่วนขยาย > Apps Script) ของ Google Sheet
 * 2. สามารถเพิ่มหรือลดชื่อตารางในตัวแปร TABLE_NAMES ได้ตามต้องการ
 * 3. กดรันฟังก์ชัน fetchMophApi() โค้ดจะสร้าง/เขียนทับ Sheet ตามชื่อตารางให้อัตโนมัติ
 * 4. สามารถตั้ง Trigger ให้รันอัตโนมัติทุกวันได้
 */

const API_URL = "https://opendata.moph.go.th/api/report_data";

// รหัสจังหวัดในเขตสุขภาพที่ 10
// 33 = ศรีสะเกษ, 34 = อุบลราชธานี, 35 = ยโสธร, 37 = อำนาจเจริญ, 49 = มุกดาหาร
const PROVINCES = ["33", "34", "35", "37", "49"];
const YEAR = "2568";

// เพิ่มตารางที่ต้องการดึงข้อมูลที่นี่
const TABLE_NAMES = [
  "s_early_anc", 
  "s_labor1519", 
  "s_dm_ht_control", 
  "s_aged10"
]; 

function fetchMophApi() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  for (const tableName of TABLE_NAMES) {
    Logger.log("=========================================");
    Logger.log("Processing table: " + tableName);
    
    // ค้นหา Sheet ที่ชื่อตรงกับ Table ถ้าไม่มีให้สร้างใหม่
    let sheet = ss.getSheetByName(tableName);
    if (!sheet) {
      sheet = ss.insertSheet(tableName);
    }
    sheet.clear(); // ล้างข้อมูลเก่า
    
    let isHeaderWritten = false;
    let totalRows = 0;

    for (const provinceCode of PROVINCES) {
      try {
        const payload = {
          "tableName": tableName,
          "year": YEAR,
          "province": provinceCode,
          "type": "json"
        };

        const options = {
          "method": "post",
          "headers": {
            "Content-Type": "application/json"
          },
          "payload": JSON.stringify(payload),
          "muteHttpExceptions": true
        };
        
        const response = UrlFetchApp.fetch(API_URL, options);
        const statusCode = response.getResponseCode();
        
        if (statusCode !== 200 && statusCode !== 201) {
          if (statusCode === 404) {
            Logger.log("Info: No data available on server (404) for province " + provinceCode);
          } else {
            Logger.log("Error for province " + provinceCode + ": API returned status " + statusCode);
          }
          continue;
        }
        
        const json = JSON.parse(response.getContentText());
        const dataArray = json.data || json; 
        
        if (!Array.isArray(dataArray) || dataArray.length === 0) {
          Logger.log("No data found for province: " + provinceCode);
          continue;
        }
        
        // ดึง Header จาก Keys ของ Object แรก (ทำแค่ครั้งเดียวต่อ Sheet)
        const headers = Object.keys(dataArray[0]);
        if (!isHeaderWritten) {
          sheet.appendRow(headers);
          isHeaderWritten = true;
        }
        
        // เตรียมข้อมูลแถว
        const rows = dataArray.map(item => {
          return headers.map(header => item[header]);
        });
        
        // เขียนข้อมูลลง Sheet ต่อจากบรรทัดสุดท้าย
        const startRow = sheet.getLastRow() + 1;
        sheet.getRange(startRow, 1, rows.length, headers.length).setValues(rows);
        totalRows += rows.length;
        
      } catch (e) {
        Logger.log("Exception occurred for province " + provinceCode + ": " + e.toString());
      }
    }
    
    Logger.log("Successfully updated " + tableName + " with total " + totalRows + " rows.");
  }
}

/**
 * ZettBOT - Setup Master Database
 * Jalankan fungsi setupMasterDatabase() ini satu kali saja.
 */

function setupMasterDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = "Users";
  let sheet = ss.getSheetByName(sheetName);
  
  // Jika sheet Users belum ada, buat baru
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    
    // Setup Header
    const headers = [
      "Timestamp", 
      "ID_User", 
      "Username", 
      "Password", 
      "Sheet_ID"
    ];
    
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#d0e0e3");
    
    // Bekukan baris pertama
    sheet.setFrozenRows(1);
    
    SpreadsheetApp.getUi().alert("Setup Selesai!", "Tab 'Users' berhasil dibuat. Master Database siap digunakan.", SpreadsheetApp.getUi().ButtonSet.OK);
  } else {
    SpreadsheetApp.getUi().alert("Info", "Tab 'Users' sudah ada. Setup tidak diperlukan lagi.", SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

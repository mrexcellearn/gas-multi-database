/**
 * ZettBOT - Main Backend Script
 */

function doGet(e) {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('ZettBOT - Keuangan Pribadi')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function extractSheetId(url) {
  try {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return (match && match[1]) ? match[1] : null;
  } catch (e) {
    return null;
  }
}

function registerUser(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const userSheet = ss.getSheetByName("Users");
    const dataUsers = userSheet.getDataRange().getValues();
    const inputUser = data.username.toString().trim().toLowerCase();
    
    for (let i = 1; i < dataUsers.length; i++) {
      if (dataUsers[i][2].toString().trim().toLowerCase() === inputUser) {
        throw new Error("Username sudah digunakan.");
      }
    }
    
    const sheetId = extractSheetId(data.sheetUrl);
    if (!sheetId) throw new Error("URL tidak valid.");
    
    try {
      const testOpen = SpreadsheetApp.openById(sheetId);
      if (!testOpen.getSheetByName("Transaksi") || !testOpen.getSheetByName("Kategori") || !testOpen.getSheetByName("Akun")) {
         throw new Error("Format Template Sheet salah.");
      }
    } catch (openErr) {
      throw new Error("Akses ditolak! Pastikan akses 'Anyone with the link' -> 'Editor'.");
    }
    
    const timestamp = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');
    const idUser = "USR-" + new Date().getTime();
    
    userSheet.appendRow([timestamp, idUser, data.username.trim(), data.password.toString(), sheetId]);
    SpreadsheetApp.flush(); 
    return { status: "success", message: "Registrasi berhasil! Silakan login." };
  } catch (err) {
    return { status: "error", message: err.message };
  }
}

function loginUser(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const userSheet = ss.getSheetByName("Users");
    const dataUsers = userSheet.getDataRange().getValues();
    
    const inputUser = data.username.toString().trim().toLowerCase();
    const inputPass = data.password.toString();
    
    for (let i = 1; i < dataUsers.length; i++) {
      if (dataUsers[i][2].toString().trim().toLowerCase() === inputUser && dataUsers[i][3].toString() === inputPass) {
        return { status: "success", user: { idUser: dataUsers[i][1], username: dataUsers[i][2], sheetId: dataUsers[i][4] } };
      }
    }
    throw new Error("Username atau Password salah.");
  } catch (err) {
    return { status: "error", message: err.message };
  }
}

function getDashboardData(sheetId) {
  try {
    const userSs = SpreadsheetApp.openById(sheetId);
    
    const catSheet = userSs.getSheetByName("Kategori");
    const catData = catSheet.getRange(2, 2, catSheet.getLastRow() || 2, 2).getValues().filter(r => r[0] !== "");
    
    const accSheet = userSs.getSheetByName("Akun");
    const accData = accSheet.getRange(2, 2, accSheet.getLastRow() || 2, 1).getValues().filter(r => r[0] !== "");
    
    return { status: "success", kategori: catData, akun: accData.map(r => r[0]) };
  } catch (err) {
    return { status: "error", message: "Gagal mengambil data: " + err.message };
  }
}

function addTransaction(sheetId, data) {
  try {
    const userSs = SpreadsheetApp.openById(sheetId);
    const transSheet = userSs.getSheetByName("Transaksi");
    
    const timestamp = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');
    const idTrans = "TRX-" + new Date().getTime();
    
    transSheet.appendRow([timestamp, idTrans, data.akun, data.kategori, data.tipe, data.nominal, data.keterangan]);
    SpreadsheetApp.flush(); 
    return { status: "success", message: "Transaksi disimpan!" };
  } catch (err) {
    return { status: "error", message: "Gagal menyimpan: " + err.message };
  }
}

/**
 * FITUR BARU: KELOLA MASTER DATA (AKUN & KATEGORI)
 */
function manageMasterData(sheetId, action, type, data) {
  try {
    const userSs = SpreadsheetApp.openById(sheetId);
    const sheetName = type === 'akun' ? 'Akun' : 'Kategori';
    const sheet = userSs.getSheetByName(sheetName);
    
    if (action === 'add') {
      const idStr = (type === 'akun' ? 'AKN-' : 'KAT-') + new Date().getTime();
      if (type === 'akun') {
        sheet.appendRow([idStr, data.nama, data.saldo || 0]);
      } else {
        sheet.appendRow([idStr, data.nama, data.tipe]);
      }
    } 
    else if (action === 'delete') {
      const allData = sheet.getDataRange().getValues();
      for (let i = 1; i < allData.length; i++) {
        // Asumsi nama selalu di kolom B (indeks 1)
        if (allData[i][1].toString() === data.nama) {
          sheet.deleteRow(i + 1); // +1 karena getValues array mulai dari 0, row google sheet mulai 1
          break;
        }
      }
    }
    
    SpreadsheetApp.flush();
    return { status: "success", message: "Data master diperbarui!" };
  } catch (err) {
    return { status: "error", message: "Gagal update master data: " + err.message };
  }
}

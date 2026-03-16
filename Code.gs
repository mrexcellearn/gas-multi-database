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

/**
 * UTILITY: Ekstrak ID dari URL Google Sheet
 */
function extractSheetId(url) {
  try {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return (match && match[1]) ? match[1] : null;
  } catch (e) {
    return null;
  }
}

/**
 * REGISTER USER
 */
function registerUser(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const userSheet = ss.getSheetByName("Users");
    
    // Cek apakah username sudah ada (Anti spasi & Case Insensitive)
    const dataUsers = userSheet.getDataRange().getValues();
    const inputUser = data.username.toString().trim().toLowerCase();
    
    for (let i = 1; i < dataUsers.length; i++) {
      if (dataUsers[i][2].toString().trim().toLowerCase() === inputUser) {
        throw new Error("Username sudah digunakan. Silakan pilih yang lain.");
      }
    }
    
    // Ekstrak ID
    const sheetId = extractSheetId(data.sheetUrl);
    if (!sheetId) {
      throw new Error("URL tidak valid. Pastikan Anda menyalin URL Google Sheet yang benar.");
    }
    
    // TES AKSES
    try {
      const testOpen = SpreadsheetApp.openById(sheetId);
      if (!testOpen.getSheetByName("Transaksi") || !testOpen.getSheetByName("Kategori") || !testOpen.getSheetByName("Akun")) {
         throw new Error("File Sheet Anda tidak memiliki tab 'Transaksi', 'Kategori', atau 'Akun'. Pastikan Template sudah disalin dengan benar.");
      }
    } catch (openErr) {
      throw new Error("Akses ditolak! Pastikan Anda sudah mengubah akses share menjadi 'Anyone with the link' (Siapa saja yang memiliki link) -> 'Editor'.");
    }
    
    // Simpan data
    const timestamp = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');
    const idUser = "USR-" + new Date().getTime();
    
    userSheet.appendRow([
      timestamp,
      idUser,
      data.username.trim(), // Simpan username yang sudah di-trim
      data.password.toString(), // Paksa simpan sebagai string
      sheetId
    ]);
    
    SpreadsheetApp.flush(); // Anti-Delay Sync
    
    return { status: "success", message: "Registrasi berhasil! Silakan login." };
  } catch (err) {
    return { status: "error", message: err.message };
  }
}

/**
 * LOGIN USER (FIXED)
 */
function loginUser(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const userSheet = ss.getSheetByName("Users");
    const dataUsers = userSheet.getDataRange().getValues();
    
    // Standarisasi Input User (Hapus spasi, jadikan huruf kecil, jadikan string)
    const inputUser = data.username.toString().trim().toLowerCase();
    const inputPass = data.password.toString();
    
    for (let i = 1; i < dataUsers.length; i++) {
      const row = dataUsers[i];
      // Standarisasi Data Database (Mencegah bug tipe data Number vs String)
      const dbUser = row[2].toString().trim().toLowerCase();
      const dbPass = row[3].toString();
      
      if (dbUser === inputUser && dbPass === inputPass) {
        return {
          status: "success",
          user: {
            idUser: row[1],
            username: row[2], // Tampilkan username asli dari database
            sheetId: row[4]
          }
        };
      }
    }
    throw new Error("Username atau Password salah. Periksa kembali ketikan Anda.");
  } catch (err) {
    return { status: "error", message: err.message };
  }
}

/**
 * AMBIL DATA KATEGORI & AKUN
 */
function getDashboardData(sheetId) {
  try {
    const userSs = SpreadsheetApp.openById(sheetId);
    
    const catSheet = userSs.getSheetByName("Kategori");
    const catData = catSheet.getRange(2, 2, catSheet.getLastRow() || 2, 2).getValues().filter(r => r[0] !== "");
    
    const accSheet = userSs.getSheetByName("Akun");
    const accData = accSheet.getRange(2, 2, accSheet.getLastRow() || 2, 1).getValues().filter(r => r[0] !== "");
    
    return {
      status: "success",
      kategori: catData, 
      akun: accData.map(r => r[0]) 
    };
  } catch (err) {
    return { status: "error", message: "Gagal mengambil master data: " + err.message };
  }
}

/**
 * TAMBAH TRANSAKSI
 */
function addTransaction(sheetId, data) {
  try {
    const userSs = SpreadsheetApp.openById(sheetId);
    const transSheet = userSs.getSheetByName("Transaksi");
    
    const timestamp = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');
    const idTrans = "TRX-" + new Date().getTime();
    
    const rowData = [
      timestamp,
      idTrans,
      data.akun,
      data.kategori,
      data.tipe,
      data.nominal,
      data.keterangan
    ];
    
    transSheet.appendRow(rowData);
    SpreadsheetApp.flush(); 
    
    return { status: "success", message: "Transaksi berhasil dicatat!" };
  } catch (err) {
    return { status: "error", message: "Gagal menyimpan transaksi: " + err.message };
  }
}

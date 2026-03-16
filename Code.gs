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
 * Menerima data dari frontend, ekstrak ID, tes akses, lalu simpan ke Master Sheet
 */
function registerUser(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const userSheet = ss.getSheetByName("Users");
    
    // Cek apakah username sudah ada
    const dataUsers = userSheet.getDataRange().getValues();
    for (let i = 1; i < dataUsers.length; i++) {
      if (dataUsers[i][2].toString().toLowerCase() === data.username.toLowerCase()) {
        throw new Error("Username sudah digunakan. Silakan pilih yang lain.");
      }
    }
    
    // Ekstrak ID dari URL
    const sheetId = extractSheetId(data.sheetUrl);
    if (!sheetId) {
      throw new Error("URL tidak valid. Pastikan Anda menyalin URL Google Sheet yang benar.");
    }
    
    // TES AKSES: Coba buka sheet user untuk memastikan permission sudah 'Anyone with link can edit'
    try {
      const testOpen = SpreadsheetApp.openById(sheetId);
      // Validasi tambahan: Pastikan sheet template memiliki tab yang dibutuhkan
      if (!testOpen.getSheetByName("Transaksi") || !testOpen.getSheetByName("Kategori") || !testOpen.getSheetByName("Akun")) {
         throw new Error("File Sheet Anda tidak memiliki tab 'Transaksi', 'Kategori', atau 'Akun'. Pastikan Anda menggunakan Template yang benar.");
      }
    } catch (openErr) {
      throw new Error("Akses ditolak! Pastikan Anda sudah mengubah akses share menjadi 'Anyone with the link can edit' (Siapa saja yang memiliki link dapat mengedit).");
    }
    
    // Simpan data
    const timestamp = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');
    const idUser = "USR-" + new Date().getTime(); // ID Unik simpel
    
    userSheet.appendRow([
      timestamp,
      idUser,
      data.username,
      data.password, // Untuk uji coba ini plaintext, real app harus di-hash
      sheetId
    ]);
    
    SpreadsheetApp.flush(); // Anti-Delay Sync
    
    return { status: "success", message: "Registrasi berhasil! Silakan login." };
  } catch (err) {
    return { status: "error", message: err.message };
  }
}

/**
 * LOGIN USER
 */
function loginUser(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const userSheet = ss.getSheetByName("Users");
    const dataUsers = userSheet.getDataRange().getValues();
    
    for (let i = 1; i < dataUsers.length; i++) {
      const row = dataUsers[i];
      if (row[2] === data.username && row[3] === data.password) {
        return {
          status: "success",
          user: {
            idUser: row[1],
            username: row[2],
            sheetId: row[4]
          }
        };
      }
    }
    throw new Error("Username atau Password salah.");
  } catch (err) {
    return { status: "error", message: err.message };
  }
}

/**
 * AMBIL DATA KATEGORI & AKUN UNTUK DROPDOWN (Batch Processing)
 */
function getDashboardData(sheetId) {
  try {
    const userSs = SpreadsheetApp.openById(sheetId);
    
    // Ambil Kategori (Asumsi Kolom B adalah Nama Kategori, Kolom C adalah Tipe)
    const catSheet = userSs.getSheetByName("Kategori");
    const catData = catSheet.getRange(2, 2, catSheet.getLastRow() || 2, 2).getValues().filter(r => r[0] !== "");
    
    // Ambil Akun (Asumsi Kolom B adalah Nama Akun)
    const accSheet = userSs.getSheetByName("Akun");
    const accData = accSheet.getRange(2, 2, accSheet.getLastRow() || 2, 1).getValues().filter(r => r[0] !== "");
    
    return {
      status: "success",
      kategori: catData, // Array of [Nama_Kategori, Tipe]
      akun: accData.map(r => r[0]) // Array of Nama_Akun
    };
  } catch (err) {
    return { status: "error", message: "Gagal mengambil master data: " + err.message };
  }
}

/**
 * TAMBAH TRANSAKSI KE SHEET USER
 */
function addTransaction(sheetId, data) {
  try {
    const userSs = SpreadsheetApp.openById(sheetId);
    const transSheet = userSs.getSheetByName("Transaksi");
    
    const timestamp = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');
    const idTrans = "TRX-" + new Date().getTime();
    
    // Struktur: Tanggal | ID_Transaksi | Akun | Kategori | Tipe | Nominal | Keterangan
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
    SpreadsheetApp.flush(); // Anti-Delay Sync
    
    return { status: "success", message: "Transaksi berhasil dicatat!" };
  } catch (err) {
    return { status: "error", message: "Gagal menyimpan transaksi: " + err.message };
  }
}

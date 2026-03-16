/**
 * ZettBOT - Setup User Template
 * * CARA PENGGUNAAN:
 * 1. Buat file Google Sheet KOSONG BARU (ini yang akan jadi template user).
 * 2. Buka Extensions > Apps Script di file baru tersebut.
 * 3. Salin kode ini ke dalamnya, lalu jalankan fungsi `setupUserTemplate()`.
 * 4. File template siap dibagikan/disalin oleh user!
 */

function setupUserTemplate() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const ui = SpreadsheetApp.getUi();
    
    // Konfirmasi sebelum reset (Mencegah salah klik di file penting)
    const response = ui.alert(
      "Peringatan Reset Data", 
      "Skrip ini akan mereset dan memformat ulang file ini menjadi Template Database User.\n\nLanjutkan?", 
      ui.ButtonSet.YES_NO
    );
    
    if (response !== ui.Button.YES) return;

    // ==========================================
    // 1. SETUP TAB 'Akun'
    // Logika Code.gs: Ambil data dari Kolom B (Nama Akun)
    // ==========================================
    let akunSheet = ss.getSheetByName("Akun");
    if (!akunSheet) akunSheet = ss.insertSheet("Akun");
    
    akunSheet.clear(); // Reset Data
    const akunHeaders = ["ID_Akun", "Nama_Akun", "Saldo_Awal"];
    const akunDummy = [
      ["AKN-001", "Dompet Utama", 500000],
      ["AKN-002", "BCA", 1500000],
      ["AKN-003", "GoPay", 200000]
    ];
    
    // Batch Insert Header & Dummy Data
    akunSheet.getRange(1, 1, 1, akunHeaders.length).setValues([akunHeaders]).setFontWeight("bold").setBackground("#d0e0e3");
    akunSheet.getRange(2, 1, akunDummy.length, akunHeaders.length).setValues(akunDummy);
    akunSheet.setFrozenRows(1);
    akunSheet.autoResizeColumns(1, akunHeaders.length);


    // ==========================================
    // 2. SETUP TAB 'Kategori'
    // Logika Code.gs: Ambil data dari Kolom B (Nama) & Kolom C (Tipe)
    // ==========================================
    let katSheet = ss.getSheetByName("Kategori");
    if (!katSheet) katSheet = ss.insertSheet("Kategori");
    
    katSheet.clear(); // Reset Data
    const katHeaders = ["ID_Kategori", "Nama_Kategori", "Tipe"];
    const katDummy = [
      ["KAT-001", "Gaji Bulanan", "Pemasukan"],
      ["KAT-002", "Bonus / Freelance", "Pemasukan"],
      ["KAT-003", "Makan & Minum", "Pengeluaran"],
      ["KAT-004", "Transportasi", "Pengeluaran"],
      ["KAT-005", "Tagihan & Utilitas", "Pengeluaran"]
    ];
    
    // Batch Insert Header & Dummy Data
    katSheet.getRange(1, 1, 1, katHeaders.length).setValues([katHeaders]).setFontWeight("bold").setBackground("#fff2cc");
    katSheet.getRange(2, 1, katDummy.length, katHeaders.length).setValues(katDummy);
    katSheet.setFrozenRows(1);
    katSheet.autoResizeColumns(1, katHeaders.length);


    // ==========================================
    // 3. SETUP TAB 'Transaksi'
    // Logika Code.gs: Tanggal | ID_Transaksi | Akun | Kategori | Tipe | Nominal | Keterangan
    // ==========================================
    let trxSheet = ss.getSheetByName("Transaksi");
    if (!trxSheet) trxSheet = ss.insertSheet("Transaksi");
    
    trxSheet.clear(); // Reset Data
    const trxHeaders = ["Tanggal", "ID_Transaksi", "Akun", "Kategori", "Tipe", "Nominal", "Keterangan"];
    
    // Batch Insert Header (Tanpa Dummy agar form kosong saat user pakai)
    trxSheet.getRange(1, 1, 1, trxHeaders.length).setValues([trxHeaders]).setFontWeight("bold").setBackground("#e6b8af");
    trxSheet.setFrozenRows(1);
    trxSheet.autoResizeColumns(1, trxHeaders.length);

    
    // ==========================================
    // 4. CLEANUP (Hapus Sheet1 bawaan jika ada)
    // ==========================================
    const defaultSheet = ss.getSheetByName("Sheet1");
    if (defaultSheet && ss.getSheets().length > 1) {
      ss.deleteSheet(defaultSheet);
    }
    
    // Susun ulang posisi tab agar rapi (Transaksi di awal)
    ss.setActiveSheet(trxSheet);
    ss.moveActiveSheet(1);

    // Anti-Delay Sync
    SpreadsheetApp.flush();
    
    ui.alert("Sukses!", "Template Database berhasil disiapkan dan diformat.\nSekarang Anda bisa membagikan link file ini ke User Anda.", ui.ButtonSet.OK);

  } catch (error) {
    SpreadsheetApp.getUi().alert("Error", "Gagal melakukan setup: " + error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

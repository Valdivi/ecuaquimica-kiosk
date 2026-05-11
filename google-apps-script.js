/**
 * ECUAQUÍMICA — Google Apps Script
 * Recibe leads del kiosko y los escribe en Google Sheets
 *
 * INSTRUCCIONES DE CONFIGURACIÓN:
 * ─────────────────────────────────
 * 1. Ve a https://sheets.new y crea una hoja con estos encabezados en la fila 1:
 *    Fecha | Nombre | Apellido | Teléfono | Email | Catálogo
 *
 * 2. En el menú: Extensiones → Apps Script
 *
 * 3. Pega este código completo (reemplaza todo lo que hay)
 *
 * 4. Cambia SPREADSHEET_ID por el ID de tu hoja
 *    (está en la URL: docs.google.com/spreadsheets/d/ESTE_ES_EL_ID/edit)
 *
 * 5. Menú superior: Implementar → Nueva implementación
 *    - Tipo: Aplicación web
 *    - Ejecutar como: Yo (tu cuenta)
 *    - Quién puede acceder: Cualquier usuario (Anyone)
 *    → Copia la URL que te da y pégala en app.js como SHEETS_URL
 *
 * 6. Cada vez que cambies el código, crea una NUEVA implementación
 */

const SPREADSHEET_ID = '1Zx-dGUKU-bJ15f7hy_YtqkQIf6fdjSEuu6WvSywqi1Q';
const SHEET_NAME     = 'Leads';

// ── GET: recibe datos del kiosko (no-cors) ──
function doGet(e) {
  try {
    const p     = e.parameter;
    const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet   = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(['Fecha', 'Nombre', 'Apellido', 'Teléfono', 'Email', 'Catálogo']);
      sheet.setFrozenRows(1);
      const header = sheet.getRange(1, 1, 1, 6);
      header.setBackground('#0b6e36');
      header.setFontColor('#ffffff');
      header.setFontWeight('bold');
    }

    sheet.appendRow([
      p.fecha    || new Date().toLocaleString('es-EC'),
      p.nombre   || '',
      p.apellido || '',
      p.telefono || '',
      p.email    || '',
      p.catalogo || '',
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── POST: respaldo ──
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet   = ss.getSheetByName(SHEET_NAME);

    // Crea la hoja y encabezados si no existe
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(['Fecha', 'Nombre', 'Apellido', 'Teléfono', 'Email', 'Catálogo']);
      sheet.setFrozenRows(1);

      // Formato encabezados
      const header = sheet.getRange(1, 1, 1, 6);
      header.setBackground('#0b6e36');
      header.setFontColor('#ffffff');
      header.setFontWeight('bold');
    }

    sheet.appendRow([
      data.fecha    || new Date().toLocaleString('es-EC'),
      data.nombre   || '',
      data.apellido || '',
      data.telefono || '',
      data.email    || '',
      data.catalogo || '',
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Test manual (ejecutar desde Apps Script para probar)
function testPost() {
  const testData = {
    postData: {
      contents: JSON.stringify({
        nombre:   'Test',
        apellido: 'Lead',
        telefono: '0991234567',
        email:    'test@test.com',
        catalogo: 'El maíz que fortalece',
        fecha:    new Date().toLocaleString('es-EC'),
      })
    }
  };
  console.log(doPost(testData).getContent());
}
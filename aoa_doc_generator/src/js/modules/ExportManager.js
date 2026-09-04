/**
 * ExportManager.js
 * Handles JSON backup import/export, standalone self-contained HTML generation,
 * and browser print triggers.
 */

import { stateManager } from './StateManager.js';

class ExportManager {

  /* -----------------------------------------------------------------
   * 1. JSON IMPORT & EXPORT
   * ----------------------------------------------------------------- */

  /**
   * Exports current StateManager data as a downloadable JSON file.
   */
  exportJSON() {
    const state = stateManager.getState();
    const jsonString = JSON.stringify(state, null, 2);
    
    // Sanitize organization name for filename
    const orgName = (state.metadata.orgName || 'bylaws')
      .replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_');
    const fileName = `${orgName}_bylaws_backup.json`;

    this.downloadFile(fileName, jsonString, 'application/json');
  }

  /**
   * Reads and parses a JSON backup file uploaded by the user.
   * @param {File} file 
   * @returns {Promise<boolean>}
   */
  importJSON(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error("لم يتم اختيار أي ملف."));
        return;
      }

      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const parsedState = JSON.parse(event.target.result);

          // Validate required root structure
          if (!parsedState.metadata || !Array.isArray(parsedState.sections)) {
            throw new Error("بنية ملف JSON غير صالحة. يجب أن يتضمن metadata و sections.");
          }

          stateManager.setState(parsedState);
          resolve(true);
        } catch (err) {
          console.error("[ExportManager] Error parsing JSON file:", err);
          reject(err);
        }
      };

      reader.onerror = () => reject(new Error("حدث خطأ أثناء قراءة الملف."));
      reader.readAsText(file);
    });
  }

  /* -----------------------------------------------------------------
   * 2. STANDALONE SELF-CONTAINED HTML GENERATION
   * ----------------------------------------------------------------- */

  /**
   * Generates and downloads a complete, self-contained HTML document.
   */
  exportStandaloneHTML() {
    const state = stateManager.getState();
    const viewportHtml = document.getElementById('a4-paper')?.innerHTML || '';

    const standaloneHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(state.metadata.docTitle || 'اللائحة الداخلية')} - ${this.escapeHtml(state.metadata.orgName || 'المأتم')}</title>
    
    <!-- Fonts & Icons -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

    <style>
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: 'Tajawal', sans-serif;
        background-color: #f1f5f9;
        color: #1e293b;
        direction: rtl;
        padding: 2rem 0;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      
      .a4-container {
        display: flex;
        flex-direction: column;
        gap: 2rem;
      }

      .doc-page {
        width: 210mm;
        min-height: 297mm;
        padding: 25mm 20mm;
        background-color: #ffffff;
        color: #1e293b;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        box-sizing: border-box;
      }

      /* Cover Page */
      .doc-cover-page {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        text-align: center;
      }
      .doc-cover-header { margin-top: 3rem; }
      .doc-cover-logo { max-width: 130px; max-height: 130px; margin-bottom: 1.5rem; }
      .doc-cover-logo-placeholder { font-size: 5rem; color: #d97706; margin-bottom: 1.5rem; }
      .doc-org-name { font-size: 2rem; font-weight: 800; color: #0f172a; }
      .doc-cover-body { margin: auto 0; }
      .doc-main-title { font-size: 2.25rem; font-weight: 800; color: #0369a1; margin-bottom: 1rem; }
      .doc-title-divider { width: 100px; height: 4px; background-color: #d97706; margin: 0 auto 1.5rem auto; border-radius: 2px; }
      .doc-subtitle { font-size: 1.2rem; color: #64748b; }
      .doc-cover-footer { border-top: 2px solid #e2e8f0; padding-top: 1.5rem; display: flex; justify-content: space-around; font-size: 0.95rem; }
      .meta-label { color: #64748b; margin-left: 0.4rem; }
      .meta-value { font-weight: 700; color: #0f172a; }

      /* Table of Contents */
      .toc-heading { font-size: 1.5rem; font-weight: 800; color: #0f172a; border-bottom: 2px solid #0369a1; padding-bottom: 0.5rem; margin-bottom: 1.5rem; }
      .toc-list { list-style: none; display: flex; flex-direction: column; gap: 0.75rem; }
      .toc-section-item, .toc-article-item { display: flex; align-items: baseline; }
      .toc-section-item { font-weight: 700; font-size: 1.05rem; color: #0f172a; margin-top: 0.5rem; }
      .toc-article-item { font-size: 0.95rem; color: #334155; padding-right: 1rem; }
      .toc-title { white-space: nowrap; }
      .toc-dots { flex: 1; border-bottom: 2px dotted #cbd5e1; margin: 0 0.5rem; }

      /* Body Content */
      .doc-section { margin-bottom: 2rem; }
      .doc-chapter-title { font-size: 1.35rem; font-weight: 800; color: #0369a1; background-color: #f1f5f9; padding: 0.6rem 1rem; border-right: 4px solid #d97706; margin-bottom: 1.25rem; }
      .doc-article { margin-bottom: 1.5rem; }
      .doc-article-title { font-size: 1.1rem; font-weight: 700; color: #0f172a; margin-bottom: 0.5rem; }
      .doc-article-body { font-size: 1rem; line-height: 1.8; color: #334155; text-align: justify; }

      @media print {
        body { background: #ffffff !important; padding: 0 !important; }
        .doc-page { box-shadow: none !important; width: 100% !important; page-break-after: always; }
      }
    </style>
</head>
<body>
    <div class="a4-container">
        ${viewportHtml}
    </div>
</body>
</html>`;

    const orgName = (state.metadata.orgName || 'bylaws')
      .replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_');
    const fileName = `${orgName}_bylaws.html`;

    this.downloadFile(fileName, standaloneHtml, 'text/html');
  }

  /* -----------------------------------------------------------------
   * 3. PRINT TRIGGER
   * ----------------------------------------------------------------- */

  /**
   * Invokes native window.print() dialog.
   */
  printDocument() {
    window.print();
  }

  /* -----------------------------------------------------------------
   * HELPER & UTILITY METHODS
   * ----------------------------------------------------------------- */

  /**
   * Creates a blob URL and triggers a synthetic browser file download.
   */
  downloadFile(filename, content, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    // Clean up DOM node and object URL reference
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

// Singleton Export
export const exportManager = new ExportManager();
/**
 * RenderEngine.js
 * Generates HTML layouts for cover pages, Table of Contents, and articles.
 * Manages DOM updates for live editor view and Paged.js preview.
 */

import { stateManager } from './StateManager.js';

class RenderEngine {
  constructor() {
    this.isPagedRendering = false;
  }

  /**
   * Main render trigger called when StateManager updates.
   * @param {Object} state 
   */
  renderAll(state = stateManager.getState()) {
    this.renderLiveView(state);
    this.renderOutlineTree(state);
    this.renderFormInputs(state);
  }

  /* -----------------------------------------------------------------
   * 1. LIVE A4 VIEWPORT RENDER
   * ----------------------------------------------------------------- */

  /**
   * Renders raw HTML into the #a4-paper DOM node for flicker-free editing.
   */
  renderLiveView(state) {
    const container = document.getElementById('a4-paper');
    if (!container) return;

    const metadata = state.metadata || {};
    const sections = state.sections || [];

    container.innerHTML = `
      ${this.generateCoverHTML(metadata)}
      ${this.generateTOCHTML(sections)}
      ${this.generateContentHTML(sections)}
    `;
  }

  generateCoverHTML(metadata) {
    const logoHTML = metadata.logoUrl
      ? `<img src="${this.escapeHtml(metadata.logoUrl)}" alt="Logo" class="doc-cover-logo" />`
      : `<div class="doc-cover-logo-placeholder"><i class="fa-solid fa-building-columns"></i></div>`;

    return `
      <section class="doc-page doc-cover-page">
        <div class="doc-cover-header">
          ${logoHTML}
          <h1 class="doc-org-name">${this.escapeHtml(metadata.orgName || 'اسم المؤسسة / المأتم')}</h1>
        </div>

        <div class="doc-cover-body">
          <h2 class="doc-main-title">${this.escapeHtml(metadata.docTitle || 'اللائحة التنظيمية الداخلية')}</h2>
          <div class="doc-title-divider"></div>
          <p class="doc-subtitle">${this.escapeHtml(metadata.docSubtitle || 'القواعد والأحكام العامة')}</p>
        </div>

        <div class="doc-cover-footer">
          <div>
            <span class="meta-label">تاريخ الإصدار:</span>
            <span class="meta-value">${this.escapeHtml(metadata.issueDate || '-')}</span>
          </div>
          <div>
            <span class="meta-label">رقم الإصدار:</span>
            <span class="meta-value">${this.escapeHtml(metadata.version || '1.0')}</span>
          </div>
        </div>
      </section>
    `;
  }

  generateTOCHTML(sections) {
    if (!sections.length) return '';

    let itemsHtml = '';
    sections.forEach((sec, sIdx) => {
      itemsHtml += `
        <li class="toc-section-item">
          <span class="toc-title">الفصل ${sIdx + 1}: ${this.escapeHtml(sec.title)}</span>
          <span class="toc-dots"></span>
        </li>
      `;
      (sec.articles || []).forEach((art, aIdx) => {
        itemsHtml += `
          <li class="toc-article-item">
            <span class="toc-title">مادة (${aIdx + 1}): ${this.escapeHtml(art.title)}</span>
            <span class="toc-dots"></span>
          </li>
        `;
      });
    });

    return `
      <section class="doc-page doc-toc-page">
        <h3 class="toc-heading"><i class="fa-solid fa-list-ol"></i> جدول المحتويات</h3>
        <ul class="toc-list">
          ${itemsHtml}
        </ul>
      </section>
    `;
  }

  generateContentHTML(sections) {
    if (!sections.length) {
      return `
        <section class="doc-page doc-empty-state">
          <p style="text-align: center; color: #94a3b8; padding: 4rem 0;">
            لا توجد فصول أو مواد مضافة حتى الآن. استخدم القائمة الجانبية لإضافة بنود.
          </p>
        </section>
      `;
    }

    return sections.map((sec, sIdx) => `
      <section class="doc-page doc-section" id="section-${sec.id}">
        <h3 class="doc-chapter-title">الفصل ${sIdx + 1}: ${this.escapeHtml(sec.title)}</h3>
        ${(sec.articles || []).map((art, aIdx) => `
          <article class="doc-article" id="article-${art.id}">
            <h4 class="doc-article-title">مادة (${aIdx + 1}): ${this.escapeHtml(art.title)}</h4>
            <div class="doc-article-body">${art.content || ''}</div>
          </article>
        `).join('')}
      </section>
    `).join('');
  }

  /* -----------------------------------------------------------------
   * 2. EDITOR SIDEBAR OUTLINE TREE
   * ----------------------------------------------------------------- */

  renderOutlineTree(state) {
    const container = document.getElementById('outline-tree');
    if (!container) return;

    const sections = state.sections || [];

    if (!sections.length) {
      container.innerHTML = `<p class="text-sm text-gray-400 p-2">لا توجد عناصر. أضف فصل جديد للبدء.</p>`;
      return;
    }

    container.innerHTML = sections.map((sec, sIdx) => `
      <div class="tree-section-item mb-3 p-2 bg-slate-800 rounded border border-slate-700">
        <div class="flex items-center justify-between font-bold text-slate-200 mb-2">
          <span>الفصل ${sIdx + 1}: ${this.escapeHtml(sec.title)}</span>
          <div class="flex items-center gap-1">
            <button data-action="move-section-up" data-section-id="${sec.id}" class="btn-xs" title="أعلى"><i class="fa-solid fa-chevron-up"></i></button>
            <button data-action="move-section-down" data-section-id="${sec.id}" class="btn-xs" title="أسفل"><i class="fa-solid fa-chevron-down"></i></button>
            <button data-action="edit-section" data-section-id="${sec.id}" class="btn-xs" title="تعديل"><i class="fa-solid fa-pen"></i></button>
            <button data-action="delete-section" data-section-id="${sec.id}" class="btn-xs text-red-400" title="حذف"><i class="fa-solid fa-trash"></i></button>
            <button data-action="add-article" data-section-id="${sec.id}" class="btn-xs text-green-400" title="إضافة مادة"><i class="fa-solid fa-plus"></i></button>
          </div>
        </div>

        <div class="tree-articles-list pr-3 border-r-2 border-slate-600 flex flex-col gap-1">
          ${(sec.articles || []).map((art, aIdx) => `
            <div class="flex items-center justify-between text-xs text-slate-300 py-1 hover:bg-slate-700/50 px-1 rounded">
              <span class="truncate max-w-[150px]">مادة (${aIdx + 1}): ${this.escapeHtml(art.title)}</span>
              <div class="flex items-center gap-1">
                <button data-action="move-article-up" data-section-id="${sec.id}" data-article-id="${art.id}" class="btn-xs"><i class="fa-solid fa-arrow-up"></i></button>
                <button data-action="move-article-down" data-section-id="${sec.id}" data-article-id="${art.id}" class="btn-xs"><i class="fa-solid fa-arrow-down"></i></button>
                <button data-action="edit-article" data-section-id="${sec.id}" data-article-id="${art.id}" class="btn-xs"><i class="fa-solid fa-pen"></i></button>
                <button data-action="delete-article" data-section-id="${sec.id}" data-article-id="${art.id}" class="btn-xs text-red-400"><i class="fa-solid fa-trash"></i></button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  /* -----------------------------------------------------------------
   * 3. FORM INPUTS SYNC
   * ----------------------------------------------------------------- */

  renderFormInputs(state) {
    const meta = state.metadata || {};

    const orgInput = document.getElementById('input-org-name');
    const titleInput = document.getElementById('input-doc-title');
    const subtitleInput = document.getElementById('input-doc-subtitle');
    const dateInput = document.getElementById('input-issue-date');
    const versionInput = document.getElementById('input-version');

    if (orgInput && document.activeElement !== orgInput) orgInput.value = meta.orgName || '';
    if (titleInput && document.activeElement !== titleInput) titleInput.value = meta.docTitle || '';
    if (subtitleInput && document.activeElement !== subtitleInput) subtitleInput.value = meta.docSubtitle || '';
    if (dateInput && document.activeElement !== dateInput) dateInput.value = meta.issueDate || '';
    if (versionInput && document.activeElement !== versionInput) versionInput.value = meta.version || '';
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
export const renderEngine = new RenderEngine();
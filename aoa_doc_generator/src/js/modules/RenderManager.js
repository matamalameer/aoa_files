/**
 * RenderManager.js
 * Synchronizes StateManager changes with the Live A4 Viewport and Sidebar Outline Tree.
 */

import { stateManager } from './StateManager.js';
import { quillManager } from './QuillManager.js';

class RenderManager {
  constructor() {
    this.viewportContainer = null;
    this.outlineTreeContainer = null;
    this.activeSectionInfoContainer = null;
    this.initialized = false;
    this.selectedArticleId = null;
  }

  /**
   * Binds DOM container elements and initializes state subscribers.
   */
  init() {
    if (this.initialized) {
      return;
    }

    this.initialized = true;
    this.viewportContainer = document.getElementById('a4-paper');
    this.outlineTreeContainer = document.getElementById('outline-tree-container');
    this.activeSectionInfoContainer = document.getElementById('editor-active-section-info');
    this.selectedArticleId = null;

    // Subscribe to all state mutations
    stateManager.subscribe((state, eventType, payload) => {
      this.renderAll(state);
    });

    // Initial render pass
    this.renderAll(stateManager.getState());
  }

  /**
   * Complete render cycle for both the document viewport and sidebar navigation tree.
   * @param {Object} state 
   */
  renderAll(state) {
    if (this.viewportContainer) {
      this.renderDocumentViewport(state);
    }
    if (this.outlineTreeContainer) {
      this.renderOutlineTree(state);
    }
    this.renderEditorPanel(state);
  }

  renderEditorPanel(state) {
    const container = document.getElementById('sidebar-editors-container');
    if (!container) return;

    const selectedArticleId = this.selectedArticleId || state.sections[0]?.articles[0]?.id || null;
    const sectionInfo = document.getElementById('editor-active-section-info');

    const activeEditorRootId = selectedArticleId ? `quill-editor-${selectedArticleId}` : null;
    const existingEditorRoot = activeEditorRootId ? document.getElementById(activeEditorRootId) : null;
    if (existingEditorRoot && quillManager.getInstance(selectedArticleId)) {
      if (sectionInfo) {
        const article = (() => {
          for (const section of state.sections) {
            const match = section.articles.find((item) => item.id === selectedArticleId);
            if (match) return match;
          }
          return null;
        })();

        if (article) {
          sectionInfo.textContent = `جاري تحرير: ${article.title}`;
        }
      }
      return;
    }

    if (!selectedArticleId) {
      container.innerHTML = '<p class="panel-description">لا توجد مواد متاحة حتى الآن.</p>';
      if (sectionInfo) sectionInfo.textContent = 'لا يوجد عنصر محدد';
      return;
    }

    let article = null;
    for (const section of state.sections) {
      article = section.articles.find((item) => item.id === selectedArticleId) || article;
    }

    if (!article) {
      container.innerHTML = '<p class="panel-description">لم يتم العثور على المادة المحددة.</p>';
      if (sectionInfo) sectionInfo.textContent = 'لا يوجد عنصر محدد';
      return;
    }

    if (sectionInfo) {
      sectionInfo.textContent = `جاري تحرير: ${article.title}`;
    }

    container.innerHTML = `
      <div class="editor-panel">
        <div class="editor-toolbar-meta">
          <span>المادة الحالية</span>
          <strong>${this.escapeHtml(article.title)}</strong>
        </div>
        <div class="editor-content" id="quill-editor-${article.id}"></div>
      </div>
    `;

    const editorRoot = document.getElementById(`quill-editor-${article.id}`);
    if (editorRoot) {
      quillManager.createInstance(article.id, editorRoot, article.content || '');
    }
  }

  selectArticle(articleId) {
    this.selectedArticleId = articleId;
    const state = stateManager.getState();
    this.renderEditorPanel(state);
  }

  /* -----------------------------------------------------------------
   * LIVE A4 DOCUMENT VIEWPORT RENDERER
   * ----------------------------------------------------------------- */

  /**
   * Renders the complete A4 document (Cover Page, TOC, and Articles Body).
   * @param {Object} state 
   */
  renderDocumentViewport(state) {
    const { metadata, sections } = state;

    // Cover Page HTML
    const logoHtml = metadata.logoDataUri
      ? `<img src="${metadata.logoDataUri}" alt="Logo" class="doc-cover-logo">`
      : `<div class="doc-cover-logo-placeholder"><i class="fa-solid fa-mosque"></i></div>`;

    const coverPageHtml = `
      <section class="doc-page doc-cover-page">
        <div class="doc-cover-header">
          ${logoHtml}
             <h1 class="doc-org-name">${this.escapeHtml(this.toModernDigits(metadata.orgName || 'اسم المأتم / الحسينية'))}</h1>
        </div>
        <div class="doc-cover-body">
             <h2 class="doc-main-title">${this.escapeHtml(this.toModernDigits(metadata.docTitle || 'اللائحة الداخلية'))}</h2>
          <div class="doc-title-divider"></div>
        </div>
        <div class="doc-cover-footer">
          <div class="doc-meta-item">
            <span class="meta-label">رقم الإصدار:</span>
               <span class="meta-value">${this.escapeHtml(this.toModernDigits(metadata.docVersion || '1.0'))}</span>
          </div>
          <div class="doc-meta-item">
            <span class="meta-label">تاريخ الاعتماد:</span>
               <span class="meta-value">${this.formatDate(metadata.approvalDate)}</span>
          </div>
        </div>
      </section>
    `;

    // Table of Contents (TOC) HTML
    let tocItemsHtml = '';
    sections.forEach((sec, sIdx) => {
      tocItemsHtml += `
        <li class="toc-section-item">
          <span class="toc-title">${this.escapeHtml(this.toModernDigits(sec.title))}</span>
          <span class="toc-dots"></span>
        </li>
      `;
      sec.articles.forEach(art => {
        tocItemsHtml += `
          <li class="toc-article-item">
            <span class="toc-title">${this.escapeHtml(this.toModernDigits(art.title))}</span>
            <span class="toc-dots"></span>
          </li>
        `;
      });
    });

    const tocPageHtml = `
      <section class="doc-page doc-toc-page">
        <h2 class="doc-section-heading toc-heading">فهرس المحتويات</h2>
        <ul class="toc-list">
          ${tocItemsHtml || '<li class="toc-empty">لا توجد أجزاء مضافة بعد</li>'}
        </ul>
      </section>
    `;

    // Main Content Sections HTML
    let contentBodyHtml = '';
    sections.forEach((section) => {
      let articlesHtml = '';
      section.articles.forEach((article) => {
        articlesHtml += `
          <article class="doc-article" id="doc-art-${article.id}">
            <h4 class="doc-article-title">${this.escapeHtml(this.toModernDigits(article.title))}</h4>
            <div class="doc-article-body">
              ${this.normalizeHtmlDigits(article.content || '<p class="placeholder-text">نص المادة فارغ...</p>')}
            </div>
          </article>
        `;
      });

      contentBodyHtml += `
        <section class="doc-section" id="doc-sec-${section.id}">
          <h3 class="doc-chapter-title">${this.escapeHtml(this.toModernDigits(section.title))}</h3>
          <div class="doc-chapter-articles">
            ${articlesHtml || '<p class="empty-section-notice">لا توجد مواد في هذا الباب.</p>'}
          </div>
        </section>
      `;
    });

    const contentPageHtml = `
      <section class="doc-page doc-body-page">
        ${contentBodyHtml}
      </section>
    `;

    // Inject into Viewport Container
    this.viewportContainer.innerHTML = coverPageHtml + tocPageHtml + contentPageHtml;
  }

  /* -----------------------------------------------------------------
   * SIDEBAR OUTLINE TREE RENDERER
   * ----------------------------------------------------------------- */

  /**
   * Renders the interactive outline tree in the sidebar.
   * @param {Object} state 
   */
  renderOutlineTree(state) {
    const { sections } = state;

    if (sections.length === 0) {
      this.outlineTreeContainer.innerHTML = `
        <div class="empty-tree-state">
          <p>لم يتم إضافة أي أبواب حتى الآن.</p>
        </div>
      `;
      return;
    }

    let treeHtml = '';

    sections.forEach((sec, secIdx) => {
      const isFirstSec = secIdx === 0;
      const isLastSec = secIdx === sections.length - 1;

      let articlesTreeHtml = '';
      sec.articles.forEach((art, artIdx) => {
        const isFirstArt = artIdx === 0;
        const isLastArt = artIdx === sec.articles.length - 1;

        // Dropdown options for section transfers
        let transferOptionsHtml = state.sections
          .filter(s => s.id !== sec.id)
          .map(s => `<option value="${s.id}">${this.escapeHtml(s.title)}</option>`)
          .join('');

        articlesTreeHtml += `
          <div class="tree-article-item" data-art-id="${art.id}">
            <div class="tree-article-header">
              <i class="fa-solid fa-file-lines article-icon"></i>
              <span class="tree-article-title" data-action="select-article" data-art-id="${art.id}">
                   ${this.escapeHtml(this.toModernDigits(art.title))}
              </span>
              <div class="tree-item-actions">
                <button class="btn-tree-action" data-action="move-art-up" data-art-id="${art.id}" ${isFirstArt ? 'disabled' : ''} title="تحريك لأعلى">
                  <i class="fa-solid fa-chevron-up"></i>
                </button>
                <button class="btn-tree-action" data-action="move-art-down" data-art-id="${art.id}" ${isLastArt ? 'disabled' : ''} title="تحريك لأسفل">
                  <i class="fa-solid fa-chevron-down"></i>
                </button>
                ${transferOptionsHtml ? `
                  <select class="select-transfer-section" data-action="transfer-article" data-art-id="${art.id}" title="نقل إلى باب آخر">
                    <option value="" disabled selected>نقل...</option>
                    ${transferOptionsHtml}
                  </select>
                ` : ''}
                <button class="btn-tree-action btn-danger" data-action="delete-article" data-art-id="${art.id}" title="حذف المادة">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </div>
            </div>
          </div>
        `;
      });

      treeHtml += `
        <div class="tree-section-item" data-sec-id="${sec.id}">
          <div class="tree-section-header">
            <input type="text" class="input-inline-edit section-title-input" 
                   value="${this.escapeHtml(sec.title)}" 
                   data-sec-id="${sec.id}" 
                   data-action="update-sec-title" />
            
            <div class="tree-item-actions">
              <button class="btn-tree-action" data-action="add-article" data-sec-id="${sec.id}" title="إضافة مادة للباب">
                <i class="fa-solid fa-plus"></i> مادة
              </button>
              <button class="btn-tree-action" data-action="move-sec-up" data-sec-id="${sec.id}" ${isFirstSec ? 'disabled' : ''} title="تحريك الباب لأعلى">
                <i class="fa-solid fa-chevron-up"></i>
              </button>
              <button class="btn-tree-action" data-action="move-sec-down" data-sec-id="${sec.id}" ${isLastSec ? 'disabled' : ''} title="تحريك الباب لأسفل">
                <i class="fa-solid fa-chevron-down"></i>
              </button>
              <button class="btn-tree-action btn-danger" data-action="delete-sec" data-sec-id="${sec.id}" title="حذف الباب">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>

          <div class="tree-articles-container">
            ${articlesTreeHtml || '<div class="tree-empty-notice">لا توجد مواد مضافة في هذا الباب</div>'}
          </div>
        </div>
      `;
    });

    this.outlineTreeContainer.innerHTML = treeHtml;

    if (!this.selectedArticleId && sections.length && sections[0].articles.length) {
      this.selectedArticleId = sections[0].articles[0].id;
    }
  }

  /* -----------------------------------------------------------------
   * UTILITY SANITIZATION AND FORMATTING
   * ----------------------------------------------------------------- */

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  formatDate(dateString) {
    if (!dateString) return '---';
    try {
      const date = new Date(dateString);
      return this.toModernDigits(date.toLocaleDateString('ar-BH-u-nu-latn', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }));
    } catch (e) {
      return this.toModernDigits(dateString);
    }
  }

  toModernDigits(value) {
    return String(value ?? '')
      .replace(/[٠-٩]/g, digit => String(digit.charCodeAt(0) - 0x0660))
      .replace(/[۰-۹]/g, digit => String(digit.charCodeAt(0) - 0x06F0));
  }

  normalizeHtmlDigits(html) {
    return String(html).replace(/>([^<]*)</g, (_, text) => `>${this.toModernDigits(text)}<`);
  }
}

// Singleton Export
export const renderManager = new RenderManager();
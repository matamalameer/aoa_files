/**
 * UIManager.js
 * Controls DOM interactions, theme/view modes, modal lifecycle, 
 * zoom viewport controls, and event bindings.
 */

import { stateManager } from './StateManager.js';
import { renderManager } from './RenderManager.js';
import { exportManager } from './ExportManager.js';

class UIManager {
  constructor() {
    this.currentZoom = 100;
    this.activeModal = null;
  }

  /**
   * Initializes all event listeners and renders the initial UI state.
   */
  init() {
    this.bindMetadataInputs();
    this.bindOutlineEvents();
    this.bindActionButtons();
    this.bindZoomControls();
    this.bindModalEvents();
    this.bindLogoUpload();
    this.bindImportExport();

    // Initialize render manager once so it subscribes to state updates and renders once.
    renderManager.init();
  }

  /* -----------------------------------------------------------------
   * 1. METADATA INPUT BINDINGS
   * ----------------------------------------------------------------- */

  /**
   * Binds two-way syncing between metadata input fields and StateManager.
   */
  bindMetadataInputs() {
    const orgInput = document.getElementById('input-org-name');
    const titleInput = document.getElementById('input-doc-title');
    const dateInput = document.getElementById('input-doc-date');
    const versionInput = document.getElementById('input-doc-version');

    if (orgInput) {
      orgInput.addEventListener('input', (e) => stateManager.updateMetadata({ orgName: e.target.value }));
    }
    if (titleInput) {
      titleInput.addEventListener('input', (e) => stateManager.updateMetadata({ docTitle: e.target.value }));
    }
    if (dateInput) {
      dateInput.addEventListener('change', (e) => stateManager.updateMetadata({ approvalDate: e.target.value }));
    }
    if (versionInput) {
      versionInput.addEventListener('input', (e) => stateManager.updateMetadata({ docVersion: e.target.value }));
    }
  }

  /* -----------------------------------------------------------------
   * 2. OUTLINE / TREE ACTION EVENTS
   * ----------------------------------------------------------------- */

  /**
   * Delegates tree outline actions (add, edit, delete, move up/down).
   */
  bindOutlineEvents() {
    const treeContainer = document.getElementById('outline-tree-container');
    if (!treeContainer) return;

    treeContainer.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;

      const action = target.dataset.action;
      const sectionId = target.dataset.secId || target.dataset.sectionId;
      const articleId = target.dataset.artId || target.dataset.articleId;

      const normalizedAction = action === 'move-art-up' ? 'move-article-up'
        : action === 'move-art-down' ? 'move-article-down'
        : action === 'move-sec-up' ? 'move-section-up'
        : action === 'move-sec-down' ? 'move-section-down'
        : action;

      switch (normalizedAction) {
        case 'add-section':
          this.openSectionModal();
          break;
        case 'edit-section':
          this.openSectionModal(sectionId);
          break;
        case 'delete-section':
        case 'delete-sec':
          if (confirm('هل أنت تأكد من حذف هذا الفصل بجميع مواده؟')) {
            stateManager.deleteSection(sectionId);
          }
          break;
        case 'move-section-up':
        case 'move-sec-up':
          stateManager.reorderSection(sectionId, 'up');
          break;
        case 'move-section-down':
        case 'move-sec-down':
          stateManager.reorderSection(sectionId, 'down');
          break;
        case 'add-article':
          this.openArticleModal(sectionId);
          break;
        case 'edit-article':
          this.openArticleModal(sectionId, articleId);
          break;
        case 'delete-article':
          if (confirm('هل أنت تأكد من حذف هذه المادة؟')) {
            stateManager.deleteArticle(articleId);
          }
          break;
        case 'move-article-up':
        case 'move-art-up':
          stateManager.reorderArticle(sectionId, articleId, 'up');
          break;
        case 'move-article-down':
        case 'move-art-down':
          stateManager.reorderArticle(sectionId, articleId, 'down');
          break;
        case 'transfer-article':
          break;
      }
    });

    const addSectionBtn = document.getElementById('btn-add-section');
    if (addSectionBtn) {
      addSectionBtn.addEventListener('click', () => this.openSectionModal());
    }
  }

  /* -----------------------------------------------------------------
   * 3. LOGO UPLOAD BINDING
   * ----------------------------------------------------------------- */

  bindLogoUpload() {
    const logoInput = document.getElementById('input-logo-file');
    const removeLogoBtn = document.getElementById('btn-remove-logo');

    if (logoInput) {
      logoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
          alert('يرجى اختيار ملف صورة صالح.');
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          stateManager.updateMetadata({ logoDataUri: event.target.result });
        };
        reader.readAsDataURL(file);
      });
    }

    if (removeLogoBtn) {
      removeLogoBtn.addEventListener('click', () => {
        stateManager.updateMetadata({ logoDataUri: null });
        if (logoInput) logoInput.value = '';
      });
    }
  }

  /* -----------------------------------------------------------------
   * 4. VIEWPORT ZOOM CONTROLS
   * ----------------------------------------------------------------- */

  bindZoomControls() {
    const btnZoomIn = document.getElementById('btn-zoom-in');
    const btnZoomOut = document.getElementById('btn-zoom-out');
    const btnZoomReset = document.getElementById('btn-reset-zoom');
    const zoomLabel = document.getElementById('zoom-level-label');

    const updateZoom = (newZoom) => {
      this.currentZoom = Math.min(Math.max(newZoom, 50), 150);
      const viewport = document.getElementById('a4-paper');
      if (viewport) {
        viewport.style.transform = `scale(${this.currentZoom / 100})`;
        viewport.style.transformOrigin = 'top center';
      }
      if (zoomLabel) {
        zoomLabel.textContent = `${this.currentZoom}%`;
      }
    };

    if (btnZoomIn) btnZoomIn.addEventListener('click', () => updateZoom(this.currentZoom + 10));
    if (btnZoomOut) btnZoomOut.addEventListener('click', () => updateZoom(this.currentZoom - 10));
    if (btnZoomReset) btnZoomReset.addEventListener('click', () => updateZoom(100));
  }

  /* -----------------------------------------------------------------
   * 5. ACTION BUTTONS (PRINT, EXPORT, TOGGLES)
   * ----------------------------------------------------------------- */

  bindActionButtons() {
    const btnPrint = document.getElementById('btn-print-doc');
    if (btnPrint) {
      btnPrint.addEventListener('click', () => exportManager.printDocument());
    }

    const btnExportHtml = document.getElementById('btn-export-html');
    if (btnExportHtml) {
      btnExportHtml.addEventListener('click', () => exportManager.exportStandaloneHTML());
    }

    const btnExportJson = document.getElementById('btn-export-json');
    if (btnExportJson) {
      btnExportJson.addEventListener('click', () => exportManager.exportJSON());
    }
  }

  /* -----------------------------------------------------------------
   * 6. IMPORT / EXPORT HANDLERS
   * ----------------------------------------------------------------- */

  bindImportExport() {
    const importInput = document.getElementById('input-import-json');
    if (importInput) {
      importInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
          await exportManager.importJSON(file);
          alert('تم استيراد البيانات بنجاح!');
        } catch (err) {
          alert(`فشل الاستيراد: ${err.message}`);
        } finally {
          importInput.value = '';
        }
      });
    }
  }

  /* -----------------------------------------------------------------
   * 7. MODALS MANAGER
   * ----------------------------------------------------------------- */

  bindModalEvents() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach((modal) => {
      const closeBtns = modal.querySelectorAll('[data-modal-close]');
      closeBtns.forEach((btn) => {
        btn.addEventListener('click', () => this.closeModal(modal));
      });

      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal(modal);
      });
    });

    // Save Section Modal Form
    const formSection = document.getElementById('form-modal-section');
    if (formSection) {
      formSection.addEventListener('submit', (e) => {
        e.preventDefault();
        const sectionId = document.getElementById('modal-section-id').value;
        const title = document.getElementById('modal-section-title').value.trim();

        if (!title) return;

        if (sectionId) {
          stateManager.updateSection(sectionId, title);
        } else {
          stateManager.addSection(title);
        }

        this.closeModal(document.getElementById('modal-section'));
      });
    }

    // Save Article Modal Form
    const formArticle = document.getElementById('form-modal-article');
    if (formArticle) {
      formArticle.addEventListener('submit', (e) => {
        e.preventDefault();
        const sectionId = document.getElementById('modal-article-section-id').value;
        const articleId = document.getElementById('modal-article-id').value;
        const title = document.getElementById('modal-article-title').value.trim();
        const content = document.getElementById('modal-article-content').value.trim();

        if (!title || !sectionId) return;

        if (articleId) {
          stateManager.updateArticle(sectionId, articleId, title, content);
        } else {
          stateManager.addArticle(sectionId, title, content);
        }

        this.closeModal(document.getElementById('modal-article'));
      });
    }
  }

  openSectionModal(sectionId = null) {
    const modal = document.getElementById('modal-section');
    const inputId = document.getElementById('modal-section-id');
    const inputTitle = document.getElementById('modal-section-title');
    const modalHeading = document.getElementById('modal-section-heading');

    if (!modal) return;

    if (sectionId) {
      const state = stateManager.getState();
      const section = state.sections.find((s) => s.id === sectionId);
      if (!section) return;

      inputId.value = section.id;
      inputTitle.value = section.title;
      if (modalHeading) modalHeading.textContent = 'تعديل فصل';
    } else {
      inputId.value = '';
      inputTitle.value = '';
      if (modalHeading) modalHeading.textContent = 'إضافة فصل جديد';
    }

    this.openModal(modal);
  }

  openArticleModal(sectionId, articleId = null) {
    const modal = document.getElementById('modal-article');
    const inputSectionId = document.getElementById('modal-article-section-id');
    const inputArticleId = document.getElementById('modal-article-id');
    const inputTitle = document.getElementById('modal-article-title');
    const inputContent = document.getElementById('modal-article-content');
    const modalHeading = document.getElementById('modal-article-heading');

    if (!modal) return;

    inputSectionId.value = sectionId;

    if (articleId) {
      const state = stateManager.getState();
      const section = state.sections.find((s) => s.id === sectionId);
      const article = section?.articles.find((a) => a.id === articleId);
      if (!article) return;

      inputArticleId.value = article.id;
      inputTitle.value = article.title;
      inputContent.value = article.content;
      if (modalHeading) modalHeading.textContent = 'تعديل مادة';
    } else {
      inputArticleId.value = '';
      inputTitle.value = '';
      inputContent.value = '';
      if (modalHeading) modalHeading.textContent = 'إضافة مادة جديدة';
    }

    this.openModal(modal);
  }

  openModal(modal) {
    if (!modal) return;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    this.activeModal = modal;
  }

  closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    this.activeModal = null;
  }
}

// Singleton Export
export const uiManager = new UIManager();
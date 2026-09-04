/**
 * QuillManager.js
 * Registry and lifecycle manager for dynamic Quill.js rich text editor instances.
 */

import { stateManager } from './StateManager.js';

class QuillManager {
  constructor() {
    /** @type {Map<string, Quill>} Registry mapping articleId -> Quill instance */
    this.instances = new Map();

    // Default Quill toolbar configuration optimized for legal document editing
    this.toolbarOptions = [
      [{ 'header': [2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['clean']
    ];
  }

  /**
   * Initializes a Quill instance inside a target DOM container for a given article.
   * @param {string} articleId - The unique ID of the article (e.g., 'art_1')
   * @param {HTMLElement|string} container - The DOM element or query selector
   * @param {string} initialContent - HTML content to hydrate into Quill
   * @returns {Quill} The created Quill instance
   */
  createInstance(articleId, container, initialContent = '') {
    // Destroy existing instance if present to prevent memory leaks
    if (this.instances.has(articleId)) {
      this.destroyInstance(articleId);
    }

    const targetElement = typeof container === 'string' 
      ? document.querySelector(container) 
      : container;

    if (!targetElement) {
      console.error(`[QuillManager] Target container not found for article: ${articleId}`);
      return null;
    }

    // Ensure the container is empty before Quill initialization
    targetElement.innerHTML = '';

    // Initialize Quill with RTL options
    const quill = new Quill(targetElement, {
      theme: 'snow',
      modules: {
        toolbar: this.toolbarOptions
      },
      placeholder: 'اكتب نص المادة هنا...'
    });

    // Set RTL direction and Arabic text alignment at the editor level
    quill.format('direction', 'rtl');
    quill.format('align', 'right');

    // Load initial HTML content safely
    if (initialContent) {
      quill.clipboard.dangerouslyPasteHTML(initialContent);
    }

    // Attach event listener for text changes with debounce
    let debounceTimer = null;
    quill.on('text-change', (delta, oldDelta, source) => {
      if (source === 'user') {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          const htmlContent = this.getCleanHTML(quill);
          stateManager.updateArticleContent(articleId, htmlContent);
        }, 300);
      }
    });

    // Store in active registry
    this.instances.set(articleId, quill);
    return quill;
  }

  /**
   * Retrieves an active Quill instance by article ID.
   * @param {string} articleId 
   * @returns {Quill|undefined}
   */
  getInstance(articleId) {
    return this.instances.get(articleId);
  }

  /**
   * Extracts clean HTML from a Quill instance.
   * @param {Quill} quill 
   * @returns {string} Clean HTML string
   */
  getCleanHTML(quill) {
    if (!quill) return '';
    const rawHtml = quill.root.innerHTML;
    // Normalize empty Quill markup
    if (rawHtml === '<p><br></p>') return '';
    return rawHtml;
  }

  /**
   * Syncs active Quill content back to StateManager before DOM teardown.
   * @param {string} articleId 
   */
  flushToState(articleId) {
    const quill = this.instances.get(articleId);
    if (quill) {
      const htmlContent = this.getCleanHTML(quill);
      stateManager.updateArticleContent(articleId, htmlContent);
    }
  }

  /**
   * Destroys a single Quill instance and cleans up its DOM references.
   * @param {string} articleId 
   */
  destroyInstance(articleId) {
    const quill = this.instances.get(articleId);
    if (quill) {
      // Flush unsaved edits to state first
      this.flushToState(articleId);

      // Disable editor and turn off listeners
      quill.off('text-change');
      quill.enable(false);

      // Clear toolbar and editor DOM markup if attached
      const container = quill.container;
      if (container) {
        const toolbar = container.previousSibling;
        if (toolbar && toolbar.classList && toolbar.classList.contains('ql-toolbar')) {
          toolbar.remove();
        }
        container.innerHTML = '';
      }

      this.instances.delete(articleId);
    }
  }

  /**
   * Safely flushes and destroys all registered Quill instances.
   */
  destroyAll() {
    this.instances.forEach((quill, articleId) => {
      this.destroyInstance(articleId);
    });
    this.instances.clear();
  }
}

// Singleton Export
export const quillManager = new QuillManager();
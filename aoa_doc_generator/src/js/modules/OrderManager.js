/**
 * OrderManager.js
 * Handles ordering, reordering, and cross-section transfers for Sections and Articles.
 */

import { stateManager } from './StateManager.js';
import { quillManager } from './QuillManager.js';

class OrderManager {

  /* -----------------------------------------------------------------
   * SECTION (أبواب) REORDERING
   * ----------------------------------------------------------------- */

  /**
   * Moves a section up in the document order.
   * @param {string} sectionId 
   */
  moveSectionUp(sectionId) {
    const state = stateManager.getState();
    const index = state.sections.findIndex(s => s.id === sectionId);
    
    if (index > 0) {
      this.flushAllArticleEditors();
      this.swapArrayElements(state.sections, index, index - 1);
      stateManager.setState(state);
      stateManager.notify('SECTION_REORDERED', { sectionId, direction: 'up' });
    }
  }

  /**
   * Moves a section down in the document order.
   * @param {string} sectionId 
   */
  moveSectionDown(sectionId) {
    const state = stateManager.getState();
    const index = state.sections.findIndex(s => s.id === sectionId);
    
    if (index !== -1 && index < state.sections.length - 1) {
      this.flushAllArticleEditors();
      this.swapArrayElements(state.sections, index, index + 1);
      stateManager.setState(state);
      stateManager.notify('SECTION_REORDERED', { sectionId, direction: 'down' });
    }
  }

  /* -----------------------------------------------------------------
   * ARTICLE (مواد) REORDERING WITHIN A SECTION
   * ----------------------------------------------------------------- */

  /**
   * Moves an article up within its parent section.
   * @param {string} articleId 
   */
  moveArticleUp(articleId) {
    const state = stateManager.getState();
    const { section, articleIndex } = this.findArticleAndSection(state, articleId);

    if (section && articleIndex > 0) {
      quillManager.flushToState(articleId);
      this.swapArrayElements(section.articles, articleIndex, articleIndex - 1);
      stateManager.setState(state);
      stateManager.notify('ARTICLE_REORDERED', { articleId, direction: 'up' });
    }
  }

  /**
   * Moves an article down within its parent section.
   * @param {string} articleId 
   */
  moveArticleDown(articleId) {
    const state = stateManager.getState();
    const { section, articleIndex } = this.findArticleAndSection(state, articleId);

    if (section && articleIndex !== -1 && articleIndex < section.articles.length - 1) {
      quillManager.flushToState(articleId);
      this.swapArrayElements(section.articles, articleIndex, articleIndex + 1);
      stateManager.setState(state);
      stateManager.notify('ARTICLE_REORDERED', { articleId, direction: 'down' });
    }
  }

  /* -----------------------------------------------------------------
   * CROSS-SECTION ARTICLE TRANSFERS
   * ----------------------------------------------------------------- */

  /**
   * Transfers an article from its current section to a target section.
   * @param {string} articleId 
   * @param {string} targetSectionId 
   * @param {number} [targetIndex] - Optional target position index
   */
  transferArticleToSection(articleId, targetSectionId, targetIndex = null) {
    const state = stateManager.getState();
    const { section: sourceSection, articleIndex } = this.findArticleAndSection(state, articleId);
    const targetSection = state.sections.find(s => s.id === targetSectionId);

    if (!sourceSection || !targetSection || sourceSection.id === targetSectionId) {
      return;
    }

    // Flush pending text edits before transferring
    quillManager.flushToState(articleId);

    // Remove article from source section
    const [movedArticle] = sourceSection.articles.splice(articleIndex, 1);

    // Insert into target section at specific index or at the end
    if (targetIndex !== null && targetIndex >= 0 && targetIndex <= targetSection.articles.length) {
      targetSection.articles.splice(targetIndex, 0, movedArticle);
    } else {
      targetSection.articles.push(movedArticle);
    }

    stateManager.setState(state);
    stateManager.notify('ARTICLE_TRANSFERRED', {
      articleId,
      fromSectionId: sourceSection.id,
      toSectionId: targetSectionId
    });
  }

  /* -----------------------------------------------------------------
   * HELPER & UTILITY METHODS
   * ----------------------------------------------------------------- */

  /**
   * Swaps two items in an array in-place.
   */
  swapArrayElements(arr, indexA, indexB) {
    const temp = arr[indexA];
    arr[indexA] = arr[indexB];
    arr[indexB] = temp;
  }

  /**
   * Finds parent section and array index for a given article ID.
   */
  findArticleAndSection(state, articleId) {
    for (const section of state.sections) {
      const articleIndex = section.articles.findIndex(a => a.id === articleId);
      if (articleIndex !== -1) {
        return { section, articleIndex };
      }
    }
    return { section: null, articleIndex: -1 };
  }

  /**
   * Flushes unsaved Quill changes for all active editors to prevent data loss on full re-renders.
   */
  flushAllArticleEditors() {
    const state = stateManager.getState();
    state.sections.forEach(sec => {
      sec.articles.forEach(art => {
        quillManager.flushToState(art.id);
      });
    });
  }
}

// Singleton Export
export const orderManager = new OrderManager();
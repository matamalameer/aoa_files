/**
 * StateManager.js
 * Central reactive store for the Articles of Association / Bylaws Generator.
 */

// Default initial state for Husseiniya & Ma'tam legal document
const DEFAULT_INITIAL_STATE = {
  metadata: {
    orgName: "مأتم كرزكان الكبير",
    docTitle: "اللائحة الداخلية ونظام إدارة المأتم",
    docVersion: "1.0",
    approvalDate: new Date().toISOString().split("T")[0],
    logoDataUri: null // Holds Data URI string or fallback SVG
  },
  sections: [
    {
      id: "sec_1",
      title: "الباب الأول: الأحكام العامة والعضوية",
      articles: [
        {
          id: "art_1",
          number: 1,
          title: "المسمى والتأسيس",
          content: "<p><strong>المادة (1):</strong> تعتبر هذه اللائحة هي المنظمة لكافة أعمال الحسينية/المأتم وإدارته، وتجري أحكامها على جميع الأعضاء والمنتسبين.</p>"
        },
        {
          id: "art_2",
          number: 2,
          title: "أهداف المؤسسة",
          content: "<p><strong>المادة (2):</strong> يهدف المأتم إلى إحياء الشعائر الدينية، وإقامة المجالس الحسينية، وخدمة المجتمع بتقديم البرامج الثقافية والاجتماعية.</p>"
        }
      ]
    },
    {
      id: "sec_2",
      title: "الباب الثاني: الهيئة الإدارية والتنظيم",
      articles: [
        {
          id: "art_3",
          number: 3,
          title: "تشكيل مجلس الإدارة",
          content: "<p><strong>المادة (3):</strong> يتولى إدارة المأتم مجلس إدارة منتخب ومكون من الأعضاء المشهود لهم بالكفاءة والأمانة وفق الشروط المحددة.</p>"
        }
      ]
    }
  ]
};

class StateManager {
  constructor() {
    this.state = JSON.parse(JSON.stringify(DEFAULT_INITIAL_STATE));
    this.subscribers = new Set();
  }

  /**
   * Subscribe to state mutations.
   * @param {Function} callback - Function called with (newState, eventType, payload)
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    if (typeof callback === 'function') {
      this.subscribers.add(callback);
    }
    return () => this.subscribers.delete(callback);
  }

  /**
   * Notify all registered subscribers of a change.
   */
  notify(eventType = 'STATE_CHANGED', payload = null) {
    this.subscribers.forEach((callback) => {
      try {
        callback(this.getState(), eventType, payload);
      } catch (error) {
        console.error(`[StateManager] Error in subscriber callback:`, error);
      }
    });
  }

  /**
   * Returns a deep clone of the current state.
   */
  getState() {
    return JSON.parse(JSON.stringify(this.state));
  }

  /**
   * Completely replaces the state (used for JSON imports).
   */
  setState(newState) {
    if (!newState || typeof newState !== 'object') {
      throw new Error("Invalid state payload");
    }
    this.state = JSON.parse(JSON.stringify(newState));
    this.recalculateArticleNumbers();
    this.notify('STATE_LOADED');
  }

  /* -----------------------------------------------------------------
   * METADATA ACTIONS
   * ----------------------------------------------------------------- */

  updateMetadata(key, value) {
    if (key in this.state.metadata) {
      this.state.metadata[key] = value;
      this.notify('METADATA_UPDATED', { key, value });
    }
  }

  setLogo(dataUri) {
    this.state.metadata.logoDataUri = dataUri;
    this.notify('LOGO_UPDATED', { logoDataUri: dataUri });
  }

  /* -----------------------------------------------------------------
   * SECTION (أبواب) ACTIONS
   * ----------------------------------------------------------------- */

  addSection(title = "باب جديد") {
    const newSection = {
      id: `sec_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      title,
      articles: []
    };
    this.state.sections.push(newSection);
    this.notify('SECTION_ADDED', { section: newSection });
    return newSection;
  }

  updateSectionTitle(sectionId, title) {
    const section = this.getSectionById(sectionId);
    if (section) {
      section.title = title;
      this.notify('SECTION_UPDATED', { sectionId, title });
    }
  }

  deleteSection(sectionId) {
    const index = this.state.sections.findIndex(s => s.id === sectionId);
    if (index !== -1) {
      const [deletedSection] = this.state.sections.splice(index, 1);
      this.recalculateArticleNumbers();
      this.notify('SECTION_DELETED', { sectionId, deletedSection });
    }
  }

  /* -----------------------------------------------------------------
   * ARTICLE (مواد) ACTIONS
   * ----------------------------------------------------------------- */

  addArticle(sectionId, title = "مادة جديدة", content = "") {
    const section = this.getSectionById(sectionId);
    if (!section) return null;

    const newArticle = {
      id: `art_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      number: 0, // Recalculated sequentially
      title,
      content: content || `<p>نص المادة...</p>`
    };

    section.articles.push(newArticle);
    this.recalculateArticleNumbers();
    this.notify('ARTICLE_ADDED', { sectionId, article: newArticle });
    return newArticle;
  }

  updateArticleContent(articleId, content) {
    const article = this.getArticleById(articleId);
    if (article) {
      article.content = content;
      this.notify('ARTICLE_CONTENT_UPDATED', { articleId, content });
    }
  }

  updateArticleTitle(articleId, title) {
    const article = this.getArticleById(articleId);
    if (article) {
      article.title = title;
      this.notify('ARTICLE_TITLE_UPDATED', { articleId, title });
    }
  }

  deleteArticle(articleId) {
    for (const section of this.state.sections) {
      const artIndex = section.articles.findIndex(a => a.id === articleId);
      if (artIndex !== -1) {
        const [deletedArticle] = section.articles.splice(artIndex, 1);
        this.recalculateArticleNumbers();
        this.notify('ARTICLE_DELETED', { articleId, deletedArticle });
        return;
      }
    }
  }

  /* -----------------------------------------------------------------
   * HELPER & UTILITY METHODS
   * ----------------------------------------------------------------- */

  getSectionById(sectionId) {
    return this.state.sections.find(s => s.id === sectionId) || null;
  }

  getArticleById(articleId) {
    for (const section of this.state.sections) {
      const article = section.articles.find(a => a.id === articleId);
      if (article) return article;
    }
    return null;
  }

  /**
   * Guarantees sequential article numbering across all chapters (e.g. 1, 2, 3...)
   */
  recalculateArticleNumbers() {
    let counter = 1;
    this.state.sections.forEach(section => {
      section.articles.forEach(article => {
        article.number = counter++;
      });
    });
  }
}

// Singleton Export
export const stateManager = new StateManager();
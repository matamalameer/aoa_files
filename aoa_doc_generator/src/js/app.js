/**
 * app.js
 * Application entry point. Coordinates initialization between 
 * StateManager, RenderManager, and UIManager.
 */

import { stateManager } from './modules/StateManager.js';
import { renderManager } from './modules/RenderManager.js';
import { uiManager } from './modules/UIManager.js';

class App {
  /**
   * Bootstraps the application module stack.
   */
  static init() {
    // 1. Subscribe RenderManager to StateManager state changes
    stateManager.subscribe((state) => {
      renderManager.renderAll(state);
    });

    // 2. Initialize UI event bindings, forms, and handlers
    uiManager.init();

    // 3. Log startup status for debugging
    console.log('[Bylaws App] Initialized successfully with current state:', stateManager.getState());
  }
}

// Ensure DOM is fully loaded before bootstrapping
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}
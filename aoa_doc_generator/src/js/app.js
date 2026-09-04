/**
 * app.js
 * Application entry point. Coordinates initialization between 
 * StateManager, RenderEngine, and UIManager.
 */

import { stateManager } from './modules/StateManager.js';
import { renderEngine } from './modules/RenderEngine.js';
import { uiManager } from './modules/UIManager.js';

class App {
  /**
   * Bootstraps the application module stack.
   */
  static init() {
    // 1. Subscribe RenderEngine to StateManager state changes
    stateManager.subscribe((state) => {
      renderEngine.renderAll(state);
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
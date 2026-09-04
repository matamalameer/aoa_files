/**
 * app.js
 */
import { stateManager } from './modules/StateManager.js';
import { renderEngine } from './modules/RenderEngine.js';
import { uiManager } from './modules/UIManager.js';

class App {
  static init() {
    stateManager.subscribe((state) => {
      renderEngine.renderAll(state);
    });

    uiManager.init();
    console.log('[Bylaws App] Bootstrapped successfully.');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}
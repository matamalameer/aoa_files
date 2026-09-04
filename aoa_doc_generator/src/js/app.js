/**
 * app.js
 */
import { uiManager } from './modules/UIManager.js';

class App {
  static init() {
    uiManager.init();
    console.log('[Bylaws App] Bootstrapped successfully.');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}
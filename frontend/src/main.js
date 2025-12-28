/**
 * Main application entry point
 *
 * Imports all components and initializes the application
 */

// Import design system styles
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';

// Import base components
import './components/base/dc-button.js';
import './components/base/dc-input.js';
import './components/base/dc-select.js';
import './components/base/dc-card.js';
import './components/base/dc-language-switcher.js';
import './components/base/dc-table.js';

// Import navigation components
import './components/navigation/dc-nav-header.js';
import './components/navigation/dc-sidebar-nav.js';

// Import auth components
import './components/auth/dc-auth-form.js';

// Initialize application
console.log('Domogo Calculator frontend initialized');

// Log component registration
if (customElements.get('dc-button')) {
  console.log('✓ Base components registered');
}

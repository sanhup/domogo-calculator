/**
 * Form Change Tracker
 *
 * Helper class for tracking form changes and managing save button state.
 * Tracks original data and compares with current form state.
 *
 * Usage:
 * ```javascript
 * import { FormChangeTracker } from '../utils/form-change-tracker.js';
 *
 * class MyFormPage extends HTMLElement {
 *   constructor() {
 *     super();
 *     this.changeTracker = new FormChangeTracker(this);
 *   }
 *
 *   async loadData() {
 *     const data = await fetchData();
 *     this.changeTracker.setOriginalData(data);
 *   }
 *
 *   render() {
 *     // ... render form ...
 *     this.changeTracker.setupListeners('#myForm');
 *   }
 * }
 * ```
 *
 * Requirements:
 * - Form must have an id or unique selector
 * - Submit button must have type="submit" and be a dc-button
 * - For edit mode, call setOriginalData() after loading data
 * - Call setupListeners() after rendering form
 */

export class FormChangeTracker {
  /**
   * Create a new FormChangeTracker
   *
   * @param {HTMLElement} component - The component that contains the form
   */
  constructor(component) {
    this.component = component;
    this.originalData = null;
    this.hasChanges = false;
    this.fieldNames = [];
  }

  /**
   * Set original form data for change comparison
   *
   * @param {Object} data - Original form data to track
   * @param {Array<string>} fieldNames - Optional array of field names to track.
   *                                     If not provided, uses Object.keys(data)
   */
  setOriginalData(data, fieldNames = null) {
    this.originalData = data ? { ...data } : null;
    this.hasChanges = false;

    if (fieldNames) {
      this.fieldNames = fieldNames;
    } else if (data) {
      this.fieldNames = Object.keys(data);
    }

    // Update button state after setting data
    requestAnimationFrame(() => this.updateSaveButton());
  }

  /**
   * Check if form data has changed from original
   *
   * @param {string} formSelector - CSS selector for the form (default: 'form')
   * @returns {boolean} - True if form has changes
   */
  checkChanges(formSelector = 'form') {
    const form = this.component.querySelector(formSelector);
    if (!form) return false;

    // For new records (no original data), always allow saving
    if (!this.originalData) {
      this.hasChanges = true;
      return true;
    }

    const currentData = {};

    // Extract current form values
    // Works with both dc-input (Shadow DOM with getValue()) and native inputs (.value)
    this.fieldNames.forEach(fieldName => {
      const input = form.querySelector(`[name="${fieldName}"]`);
      if (!input) {
        currentData[fieldName] = '';
      } else if (typeof input.getValue === 'function') {
        // dc-input or other custom elements with getValue()
        currentData[fieldName] = input.getValue();
      } else {
        // Native HTML inputs
        currentData[fieldName] = input.value || '';
      }
    });

    // Compare current values with original (trimmed to ignore whitespace)
    this.hasChanges = this.fieldNames.some(fieldName => {
      const current = (currentData[fieldName] || '').trim();
      const original = (this.originalData[fieldName] || '').trim();
      return current !== original;
    });

    return this.hasChanges;
  }

  /**
   * Update save button enabled/disabled state based on changes
   */
  updateSaveButton() {
    const saveButton = this.component.querySelector('dc-button[type="submit"]');
    if (saveButton) {
      if (this.hasChanges) {
        saveButton.removeAttribute('disabled');
      } else {
        saveButton.setAttribute('disabled', '');
      }
    }
  }

  /**
   * Set up change detection listeners on form inputs
   *
   * @param {string} formSelector - CSS selector for the form (default: 'form')
   */
  setupListeners(formSelector = 'form') {
    const form = this.component.querySelector(formSelector);
    if (!form) return;

    const handleChange = () => {
      this.checkChanges(formSelector);
      this.updateSaveButton();
    };

    // Listen to all dc-input components
    const inputs = form.querySelectorAll('dc-input');
    inputs.forEach(input => {
      input.addEventListener('input', handleChange);
      input.addEventListener('change', handleChange);
    });

    // Listen to native inputs (in case any are used)
    const nativeInputs = form.querySelectorAll('input:not([type="submit"]), textarea, select');
    nativeInputs.forEach(input => {
      input.addEventListener('input', handleChange);
      input.addEventListener('change', handleChange);
    });

    // Set initial button state
    this.updateSaveButton();
  }

  /**
   * Reset change tracking
   * Useful after successful save to prevent accidental double-saves
   */
  reset() {
    this.hasChanges = false;
    this.updateSaveButton();
  }
}

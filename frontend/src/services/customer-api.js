/**
 * Customer API Service
 * Handles all customer-related API calls
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Generic API error class
 */
export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Base fetch wrapper with error handling
 */
async function fetchApi(endpoint, options = {}) {
  const { headers = {}, ...restOptions } = options;

  headers['Content-Type'] = 'application/json';

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...restOptions,
      headers,
    });

    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (!response.ok) {
      const errorData = isJson ? await response.json() : await response.text();
      throw new ApiError(
        errorData.detail || errorData.message || 'API request failed',
        response.status,
        errorData
      );
    }

    return isJson ? await response.json() : null;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network error or parse error
    throw new ApiError('Network error or invalid response', 0, error);
  }
}

/**
 * Get list of customers
 * @param {Object} filters - Query filters
 * @param {string} filters.search - Search term for name, email, phone, address
 * @param {boolean} filters.archived - Filter by archived status (null = active only, true = archived only, false = active only)
 * @param {string} filters.sortBy - Sort field: 'name', 'email', 'created_at'
 * @param {number} filters.limit - Maximum results
 * @param {number} filters.offset - Pagination offset
 * @returns {Promise<Array>} Array of customer objects
 */
export async function getCustomers(filters = {}) {
  const params = new URLSearchParams();

  if (filters.search) params.append('search', filters.search);
  if (filters.archived !== undefined && filters.archived !== null) {
    params.append('archived', filters.archived.toString());
  }
  if (filters.sortBy) params.append('sort_by', filters.sortBy);
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.offset) params.append('offset', filters.offset.toString());

  const queryString = params.toString();
  const endpoint = queryString ? `/api/customers?${queryString}` : '/api/customers';

  return fetchApi(endpoint, { method: 'GET' });
}

/**
 * Get a single customer by ID
 * @param {number} id - Customer ID
 * @returns {Promise<Object>} Customer object
 */
export async function getCustomer(id) {
  return fetchApi(`/api/customers/${id}`, { method: 'GET' });
}

/**
 * Create a new customer
 * @param {Object} customerData - Customer data
 * @param {string} customerData.full_name - Customer full name (required)
 * @param {string} customerData.email - Customer email
 * @param {string} customerData.phone - Customer phone
 * @param {string} customerData.street_address - Street address
 * @param {string} customerData.postal_code - Postal code
 * @param {string} customerData.city - City
 * @returns {Promise<Object>} Created customer object
 */
export async function createCustomer(customerData) {
  return fetchApi('/api/customers', {
    method: 'POST',
    body: JSON.stringify(customerData),
  });
}

/**
 * Update an existing customer
 * @param {number} id - Customer ID
 * @param {Object} customerData - Updated customer data (partial update supported)
 * @returns {Promise<Object>} Updated customer object
 */
export async function updateCustomer(id, customerData) {
  return fetchApi(`/api/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(customerData),
  });
}

/**
 * Archive a customer (soft delete)
 * @param {number} id - Customer ID
 * @returns {Promise<Object>} Archived customer object
 */
export async function archiveCustomer(id) {
  return fetchApi(`/api/customers/${id}/archive`, { method: 'POST' });
}

/**
 * Unarchive a customer (restore)
 * @param {number} id - Customer ID
 * @returns {Promise<Object>} Unarchived customer object
 */
export async function unarchiveCustomer(id) {
  return fetchApi(`/api/customers/${id}/unarchive`, { method: 'POST' });
}

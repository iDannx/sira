const axios = require('axios');

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: PYTHON_API_URL,
  timeout: 10000,
});

/**
 * Call the Python API service.
 * @param {string} endpoint - Path on the Python API (e.g. "/example").
 * @param {object} [data]   - Optional payload. When provided, a POST is issued; otherwise GET.
 * @returns {Promise<any>}  - Resolves with response.data.
 */
const callPythonApi = async (endpoint, data) => {
  try {
    const response = data
      ? await client.post(endpoint, data)
      : await client.get(endpoint);

    return response.data;
  } catch (err) {
    const status = err.response?.status;
    const detail = err.response?.data || err.message;
    const wrapped = new Error(
      `Python API call failed (${endpoint})${status ? ` [${status}]` : ''}: ${
        typeof detail === 'string' ? detail : JSON.stringify(detail)
      }`
    );
    wrapped.status = status || 502;
    wrapped.cause = err;
    throw wrapped;
  }
};

module.exports = {
  callPythonApi,
};

import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export const getExample = async () => {
  const response = await api.get('/example');
  return response.data;
};

export default api;

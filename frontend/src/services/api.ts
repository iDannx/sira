import axios, { AxiosError } from 'axios';

const TOKEN_KEY = 'sira_token';
const USER_KEY = 'sira_user';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      // Sesión expirada cuenta como logout: no queremos que el siguiente
      // usuario herede la conversación con AURA del anterior.
      localStorage.removeItem('aura_chat_history');
      localStorage.removeItem('aura_chat_messages');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export function getApiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const apiMessage = (err.response?.data as { error?: { message?: string } } | undefined)?.error?.message;
    if (typeof apiMessage === 'string') return apiMessage;
    if (err.code === 'ERR_NETWORK') return 'No se pudo conectar con el servidor.';
    return err.message;
  }
  return 'Ocurrió un error inesperado.';
}

export { TOKEN_KEY, USER_KEY };
export default api;

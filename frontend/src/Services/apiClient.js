import axios from 'axios';

const createClient = (baseURL, isTravelService = false) => {
    const client = axios.create({ baseURL });

    client.interceptors.request.use((config) => {
        // Standardni JWT Token za autorizaciju
        const token = localStorage.getItem('token');
        if (token) config.headers.Authorization = `Bearer ${token}`;

        // Ako je u pitanju TravelService, nakaèi i X-Share-Token ako postoji
        if (isTravelService) {
            const shareToken = localStorage.getItem('shareToken');
            if (shareToken) config.headers['X-Share-Token'] = shareToken;
        }

        return config;
    });

    client.interceptors.response.use(
        (res) => res,
        (err) => {
            const status = err.response?.status;
            const requestUrl = err.config?.url ?? '';
            const isAuthRequest = requestUrl.includes('/api/auth/login') || requestUrl.includes('/api/auth/register');

            // Ako je token istekao, briši sve i šalji na login
            if (status === 401 && !isAuthRequest) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('shareToken'); // Èistimo i share token
                window.location.href = '/login';
            }
            return Promise.reject(err);
        }
    );

    return client;
};

// Na samom dnu fajla gde eksportuješ klijente:
export const userClient = createClient(import.meta.env.VITE_USER_SERVICE_URL);
export const travelClient = createClient(import.meta.env.VITE_TRAVEL_SERVICE_URL, true);
export const expenseClient = createClient(import.meta.env.VITE_EXPENSE_SERVICE_URL);
import axios, { type AxiosInstance } from 'axios'

const api: AxiosInstance = axios.create({
    // 🚨 DEPLOYMENT NOTE: THE VITE_API_URL ENVIRONMENT VARIABLE 🚨
    // Locally: This evaluates to '/api', which forces requests to hit your Vite proxy above.
    // In Production: The proxy is gone. You MUST inject `VITE_API_URL=https://api.yourdomain.com` 
    // into your build environment (e.g., GitHub Actions, Vercel secrets, or Docker build args) 
    // BEFORE running `npm run build`. Vite will permanently bake that URL into the final JS files.
    baseURL: (import.meta.env.VITE_API_URL as string) || '/api',

    // DEPLOYMENT NOTE: This enforces strict CORS policies in production.
    // Your Laravel backend MUST explicitly whitelist your frontend domain in `config/cors.php`.
    withCredentials: true,

    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
})

api.interceptors.request.use((config) => {
    // DEPLOYMENT NOTE: `localStorage` works perfectly in production. Just ensure 
    // you are serving your site over HTTPS, otherwise browser security policies 
    // might block certain storage mechanisms or API requests.
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token')
            // DEPLOYMENT NOTE: Hardcoded redirects like this will trigger a full page reload.
            // If you want a smoother Single Page Application (SPA) experience, consider 
            // importing your Vue Router here and using `router.push('/login')` instead.
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

export default api
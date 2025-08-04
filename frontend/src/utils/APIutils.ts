export const getAPIURL = ( endpoint: string ) => {
    // Get base URL and remove trailing slash if present
    const baseURL = import.meta.env.VITE_API_URL 
        ? import.meta.env.VITE_API_URL.replace(/\/$/, '') // Remove trailing slash
        : 'https://ohhlio.vercel.app/api';
    
    const API_URL = `${baseURL}/${endpoint}`;
    
    // Debug logging
    console.log('🔧 API URL Debug:', {
        endpoint,
        VITE_API_URL: import.meta.env.VITE_API_URL,
        finalURL: API_URL,
        isDev: import.meta.env.DEV,
        hostname: window.location.hostname,
        isDevelopment: import.meta.env.DEV || window.location.hostname === 'localhost'
    });
    
    return API_URL
}
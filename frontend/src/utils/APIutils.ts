export const getAPIURL = ( endpoint: string ) => {
    // Force localhost for development, use env var for production
    const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';
    // const API_URL = isDevelopment 
    //     ? `http://localhost:3001/api/${endpoint}`
    //     : import.meta.env.VITE_API_URL 
    //         ? `${import.meta.env.VITE_API_URL}/${endpoint}` 
    //         : `https://ohhlio.vercel.app/api/${endpoint}`;

    const API_URL = `${import.meta.env.VITE_API_URL}/${endpoint}`;
    
    // Debug logging
    console.log('🔧 API URL Debug:', {
        endpoint,
        VITE_API_URL: import.meta.env.VITE_API_URL,
        finalURL: API_URL,
        isDev: import.meta.env.DEV,
        hostname: window.location.hostname,
        isDevelopment
    });
    
    return API_URL
}
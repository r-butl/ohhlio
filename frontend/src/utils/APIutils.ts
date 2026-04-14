export const getAPIURL = ( endpoint: string ) => {
    const rawURL = import.meta.env.VITE_API_URL;
    if (!rawURL) {
        throw new Error('VITE_API_URL environment variable is not set');
    }
    const baseURL = rawURL.replace(/\/$/, '');

    const API_URL = `${baseURL}/${endpoint}`;

    return API_URL
}
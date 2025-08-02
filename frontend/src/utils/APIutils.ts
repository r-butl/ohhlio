export const getAPIURL = ( endpoint: string ) => {
    const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/${endpoint}` : `http://localhost:3001/api/${endpoint}`;
    return API_URL
}
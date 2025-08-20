// lib/csrf-simple.js
import axios from 'axios';

export const getCsrfTokenSimple = async (backendUrl) => {
    try {
        // This will set the CSRF cookie in the browser
        await axios.get(`${backendUrl}/sanctum/csrf-cookie`, {
            withCredentials: true
        });
        
        // For most Laravel Sanctum setups, the cookie is now set
        // and will be automatically included in subsequent requests
        return 'cookie-set'; // Token is in cookie, not needed in header
        
    } catch (error) {
        console.error('CSRF token fetch failed:', error);
        throw error;
    }
};
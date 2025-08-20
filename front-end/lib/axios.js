import axios from 'axios';

// Get the correct backend URL for client-side requests
const getClientBackendUrl = () => {
    // In browser, use the public environment variable
    if (typeof window !== 'undefined') {
        return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    }
    // On server, use the backend host (container name)
    return process.env.BACKEND_API_HOST || 'http://localhost:5000';
};

// Create axios instance
const api = axios.create({
    withCredentials: true, // Important for CSRF cookies
    baseURL: getClientBackendUrl(), // Set base URL
    xsrfCookieName: 'XSRF-TOKEN', // Name of the cookie that contains the CSRF token
    xsrfHeaderName: 'X-XSRF-TOKEN', // Name of the header to send the token in
});

// Flag to track if we've already attempted to get CSRF token
let csrfTokenRequested = false;

// Request interceptor to handle CSRF token
api.interceptors.request.use(
    async (config) => {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
        
        // Helper function to extract XSRF token from cookies
        const getXsrfTokenFromCookies = () => {
            if (typeof document === 'undefined') return null;
            const cookies = document.cookie.split(';');
            const xsrfCookie = cookies.find(cookie => cookie.trim().startsWith('XSRF-TOKEN='));
            return xsrfCookie ? decodeURIComponent(xsrfCookie.split('=')[1]) : null;
        };
        
        const xsrfToken = getXsrfTokenFromCookies();
        
        console.log('🔍 [CSRF TRACE] === REQUEST START ===');
        console.log('🔍 [CSRF TRACE] Making request:', {
            method: config.method?.toUpperCase(),
            url: config.url,
            baseURL: config.baseURL,
            fullUrl: `${config.baseURL || ''}${config.url}`,
            withCredentials: config.withCredentials,
        });
        
        console.log('🔍 [CSRF TRACE] Current cookies state:', {
            allCookies: typeof document !== 'undefined' ? document.cookie : 'N/A (server-side)',
            xsrfTokenFromCookie: xsrfToken,
            xsrfTokenLength: xsrfToken ? xsrfToken.length : 0
        });
        
        console.log('🔍 [CSRF TRACE] Request headers before processing:', {
            'X-XSRF-TOKEN': config.headers['X-XSRF-TOKEN'],
            'X-CSRF-TOKEN': config.headers['X-CSRF-TOKEN'],
            'Content-Type': config.headers['Content-Type'],
            'Accept': config.headers['Accept'],
            'Authorization': config.headers['Authorization'] ? 'Bearer ***' : undefined,
            'Cookie': config.headers['Cookie']
        });
        
        // For API routes that need CSRF protection
        const isMutatingRequest = config.url && config.url.includes('/api/') && 
            ['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase());
            
        if (isMutatingRequest) {
            console.log('🛡️ [CSRF TRACE] This is a mutating request requiring CSRF protection');
            
            // Check if XSRF token is already in headers
            if (config.headers['X-XSRF-TOKEN']) {
                console.log('✅ [CSRF TRACE] X-XSRF-TOKEN already present in headers:', config.headers['X-XSRF-TOKEN']);
            } else if (xsrfToken) {
                console.log('🔧 [CSRF TRACE] Found XSRF token in cookies, should be auto-added by axios');
                console.log('🔧 [CSRF TRACE] XSRF token value:', xsrfToken);
            } else {
                console.log('⚠️ [CSRF TRACE] No XSRF token found in cookies or headers!');
            }
            
            // Get CSRF cookie if we haven't already
            if (!csrfTokenRequested) {
                try {
                    console.log('🍪 [CSRF TRACE] Fetching CSRF cookie from:', `${backendUrl}/sanctum/csrf-cookie`);
                    console.log('🍪 [CSRF TRACE] CSRF request config:', {
                        url: `${backendUrl}/sanctum/csrf-cookie`,
                        withCredentials: true,
                        method: 'GET'
                    });
                    
                    const csrfResponse = await axios.get(`${backendUrl}/sanctum/csrf-cookie`, {
                        withCredentials: true
                    });
                    
                    const newXsrfToken = getXsrfTokenFromCookies();
                    
                    console.log('✅ [CSRF TRACE] CSRF cookie response:', {
                        status: csrfResponse.status,
                        statusText: csrfResponse.statusText,
                        responseHeaders: {
                            'Set-Cookie': csrfResponse.headers['set-cookie'],
                            'X-XSRF-TOKEN': csrfResponse.headers['x-xsrf-token']
                        }
                    });
                    
                    console.log('🍪 [CSRF TRACE] Cookies after CSRF fetch:', {
                        allCookies: document.cookie,
                        newXsrfToken: newXsrfToken,
                        tokenChanged: xsrfToken !== newXsrfToken
                    });
                    
                    csrfTokenRequested = true;
                } catch (error) {
                    console.error('❌ [CSRF TRACE] Failed to fetch CSRF cookie:', {
                        message: error.message,
                        status: error.response?.status,
                        statusText: error.response?.statusText,
                        data: error.response?.data,
                        responseHeaders: error.response?.headers
                    });
                }
            } else {
                console.log('✅ [CSRF TRACE] CSRF token already requested previously');
                console.log('🔍 [CSRF TRACE] Current token state:', {
                    xsrfTokenFromCookie: xsrfToken,
                    cookiesString: document.cookie
                });
            }
        } else {
            console.log('ℹ️ [CSRF TRACE] This is a read-only request, no CSRF protection needed');
        }
        
        // Final check before sending request
        const finalXsrfToken = getXsrfTokenFromCookies();
        
        // Manually add XSRF token to header if not already there
        if (finalXsrfToken && !config.headers['X-XSRF-TOKEN']) {
            console.log('🔧 [CSRF TRACE] Manually adding X-XSRF-TOKEN header');
            config.headers['X-XSRF-TOKEN'] = finalXsrfToken;
        }
        
        console.log('🚀 [CSRF TRACE] Final request state:', {
            hasXsrfTokenInCookies: !!finalXsrfToken,
            xsrfTokenValue: finalXsrfToken,
            hasXsrfTokenInHeaders: !!config.headers['X-XSRF-TOKEN'],
            headerXsrfToken: config.headers['X-XSRF-TOKEN'],
            manuallyAddedToken: finalXsrfToken && !config.headers['X-XSRF-TOKEN']
        });
        
        console.log('🔍 [CSRF TRACE] === REQUEST END ===');
        
        return config;
    },
    (error) => {
        console.error('❌ [CSRF TRACE] Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor to handle 419 errors
api.interceptors.response.use(
    (response) => {
        console.log('✅ [CSRF DEBUG] Successful response:', {
            status: response.status,
            url: response.config?.url,
            method: response.config?.method?.toUpperCase()
        });
        return response;
    },
    async (error) => {
        console.error('❌ [CSRF DEBUG] Response error:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            url: error.config?.url,
            method: error.config?.method?.toUpperCase(),
            data: error.response?.data,
            headers: error.response?.headers,
            cookies: typeof document !== 'undefined' ? document.cookie : 'N/A (server-side)'
        });
        
        // If we get a 419 CSRF error, reset the flag and retry
        if (error.response?.status === 419) {
            console.warn('🚨 [CSRF DEBUG] Got 419 CSRF token mismatch! Attempting retry...');
            csrfTokenRequested = false;
            
            // Retry the original request
            const originalRequest = error.config;
            if (!originalRequest._retry) {
                console.log('🔄 [CSRF DEBUG] First retry attempt for request:', {
                    url: originalRequest.url,
                    method: originalRequest.method?.toUpperCase()
                });
                
                originalRequest._retry = true;
                
                try {
                    // Get fresh CSRF cookie
                    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
                    
                    console.log('🔄 [CSRF DEBUG] Fetching fresh CSRF token from:', `${backendUrl}/sanctum/csrf-cookie`);
                    
                    const retryResponse = await axios.get(`${backendUrl}/sanctum/csrf-cookie`, {
                        withCredentials: true
                    });
                    
                    console.log('✅ [CSRF DEBUG] Fresh CSRF token response:', {
                        status: retryResponse.status,
                        cookies: typeof document !== 'undefined' ? document.cookie : 'N/A'
                    });
                    
                    csrfTokenRequested = true;
                    
                    console.log('🔄 [CSRF DEBUG] Retrying original request...');
                    
                    // Retry the original request
                    return api(originalRequest);
                } catch (retryError) {
                    console.error('❌ [CSRF DEBUG] Failed to retry request after CSRF refresh:', {
                        message: retryError.message,
                        status: retryError.response?.status,
                        data: retryError.response?.data
                    });
                }
            } else {
                console.error('❌ [CSRF DEBUG] Already attempted retry, giving up on request:', {
                    url: originalRequest.url,
                    method: originalRequest.method?.toUpperCase()
                });
            }
        }
        
        return Promise.reject(error);
    }
);

export default api;
export { api };

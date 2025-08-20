import { useState } from 'react';
import axios from 'axios';
import api from '@/lib/axios';
import Head from 'next/head';

export default function DebugCsrf() {
    const [results, setResults] = useState({});
    const [loading, setLoading] = useState(false);

    const testCsrfCookie = async () => {
        setLoading(true);
        try {
            console.log('🧪 [DEBUG] Testing CSRF cookie endpoint...');
            
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
            console.log('🌐 [DEBUG] Backend URL:', backendUrl);
            
            // Clear any existing CSRF state
            document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            
            const response = await axios.get(`${backendUrl}/sanctum/csrf-cookie`, {
                withCredentials: true
            });
            
            console.log('✅ [DEBUG] CSRF cookie response:', response);
            
            setResults(prev => ({
                ...prev,
                csrfCookie: {
                    status: response.status,
                    headers: response.headers,
                    cookies: document.cookie,
                    success: true
                }
            }));
            
        } catch (error) {
            console.error('❌ [DEBUG] CSRF cookie failed:', error);
            setResults(prev => ({
                ...prev,
                csrfCookie: {
                    error: error.message,
                    status: error.response?.status,
                    data: error.response?.data,
                    success: false
                }
            }));
        }
        setLoading(false);
    };

    const testDebugEndpoint = async () => {
        setLoading(true);
        try {
            console.log('🧪 [DEBUG] Testing debug endpoint...');
            
            const response = await api.get('/api/debug/csrf');
            
            console.log('✅ [DEBUG] Debug endpoint response:', response);
            
            setResults(prev => ({
                ...prev,
                debugEndpoint: {
                    data: response.data,
                    status: response.status,
                    cookies: document.cookie,
                    success: true
                }
            }));
            
        } catch (error) {
            console.error('❌ [DEBUG] Debug endpoint failed:', error);
            setResults(prev => ({
                ...prev,
                debugEndpoint: {
                    error: error.message,
                    status: error.response?.status,
                    data: error.response?.data,
                    success: false
                }
            }));
        }
        setLoading(false);
    };

    const testApiCall = async () => {
        setLoading(true);
        try {
            console.log('🧪 [DEBUG] Testing API call (GET users)...');
            
            const response = await api.get('/api/admin/users', {
                headers: {
                    'Authorization': 'Bearer dummy-token-for-test'
                }
            });
            
            console.log('✅ [DEBUG] API call response:', response);
            
            setResults(prev => ({
                ...prev,
                apiCall: {
                    data: response.data,
                    status: response.status,
                    success: true
                }
            }));
            
        } catch (error) {
            console.error('❌ [DEBUG] API call failed:', error);
            setResults(prev => ({
                ...prev,
                apiCall: {
                    error: error.message,
                    status: error.response?.status,
                    data: error.response?.data,
                    success: false
                }
            }));
        }
        setLoading(false);
    };

    const clearResults = () => {
        setResults({});
    };

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <Head>
                <title>CSRF Debug</title>
            </Head>
            
            <div className="max-w-4xl mx-auto px-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">CSRF Debug Tools</h1>
                
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Environment Info</h2>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <strong>NEXT_PUBLIC_BACKEND_URL:</strong><br />
                            <code className="bg-gray-100 px-2 py-1 rounded">
                                {process.env.NEXT_PUBLIC_BACKEND_URL || 'not set'}
                            </code>
                        </div>
                        <div>
                            <strong>Current Cookies:</strong><br />
                            <code className="bg-gray-100 px-2 py-1 rounded break-all">
                                {typeof document !== 'undefined' ? document.cookie || 'none' : 'N/A (SSR)'}
                            </code>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
                    <div className="space-y-4">
                        <button 
                            onClick={testCsrfCookie}
                            disabled={loading}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 mr-2"
                        >
                            1. Test CSRF Cookie Endpoint
                        </button>
                        
                        <button 
                            onClick={testDebugEndpoint}
                            disabled={loading}
                            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 mr-2"
                        >
                            2. Test Debug Endpoint
                        </button>
                        
                        <button 
                            onClick={testApiCall}
                            disabled={loading}
                            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50 mr-2"
                        >
                            3. Test API Call
                        </button>
                        
                        <button 
                            onClick={clearResults}
                            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 ml-4"
                        >
                            Clear Results
                        </button>
                    </div>
                </div>

                {Object.keys(results).length > 0 && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold mb-4">Results</h2>
                        
                        {Object.entries(results).map(([key, result]) => (
                            <div key={key} className="mb-6">
                                <h3 className={`text-lg font-medium mb-2 ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                                    {key} {result.success ? '✅' : '❌'}
                                </h3>
                                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                                    {JSON.stringify(result, null, 2)}
                                </pre>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

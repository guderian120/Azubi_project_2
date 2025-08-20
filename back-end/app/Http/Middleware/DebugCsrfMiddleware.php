<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class DebugCsrfMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        Log::info('🔍 [CSRF TRACE] =============== REQUEST START ===============');
        
        // Extract and analyze CSRF tokens
        $sessionCsrfToken = $request->session()->token();
        $xsrfTokenHeader = $request->header('X-XSRF-TOKEN');
        $csrfTokenHeader = $request->header('X-CSRF-TOKEN');
        $xsrfCookie = $request->cookie('XSRF-TOKEN');
        
        Log::info('🔍 [CSRF TRACE] Request details:', [
            'method' => $request->method(),
            'url' => $request->fullUrl(),
            'path' => $request->path(),
            'ip' => $request->ip(),
            'user_agent' => substr($request->userAgent(), 0, 100) . '...',
        ]);
        
        Log::info('🔍 [CSRF TRACE] Domain and origin info:', [
            'referer' => $request->header('referer'),
            'origin' => $request->header('origin'),
            'host' => $request->header('host'),
            'request_from_frontend' => $this->requestFromFrontend($request),
            'stateful_domains' => config('sanctum.stateful'),
        ]);
        
        // Detailed CSRF token analysis
        Log::info('🔍 [CSRF TRACE] CSRF token analysis:', [
            'session_id' => $request->session()->getId(),
            'session_csrf_token' => $sessionCsrfToken,
            'session_csrf_length' => $sessionCsrfToken ? strlen($sessionCsrfToken) : 0,
            'x_xsrf_token_header' => $xsrfTokenHeader,
            'x_xsrf_header_length' => $xsrfTokenHeader ? strlen($xsrfTokenHeader) : 0,
            'x_csrf_token_header' => $csrfTokenHeader,
            'x_csrf_header_length' => $csrfTokenHeader ? strlen($csrfTokenHeader) : 0,
            'xsrf_cookie' => $xsrfCookie,
            'xsrf_cookie_length' => $xsrfCookie ? strlen($xsrfCookie) : 0,
        ]);
        
        // Check token matches
        $xsrfMatches = $xsrfTokenHeader && $sessionCsrfToken && hash_equals($sessionCsrfToken, $xsrfTokenHeader);
        $csrfMatches = $csrfTokenHeader && $sessionCsrfToken && hash_equals($sessionCsrfToken, $csrfTokenHeader);
        $cookieMatches = $xsrfCookie && $sessionCsrfToken && hash_equals($sessionCsrfToken, $xsrfCookie);
        
        Log::info('🔍 [CSRF TRACE] Token validation:', [
            'has_session_token' => !!$sessionCsrfToken,
            'has_xsrf_header' => !!$xsrfTokenHeader,
            'has_csrf_header' => !!$csrfTokenHeader,
            'has_xsrf_cookie' => !!$xsrfCookie,
            'xsrf_header_matches_session' => $xsrfMatches,
            'csrf_header_matches_session' => $csrfMatches,
            'xsrf_cookie_matches_session' => $cookieMatches,
            'any_token_valid' => $xsrfMatches || $csrfMatches || $cookieMatches,
        ]);
        
        // Log all cookies for debugging
        Log::info('🔍 [CSRF TRACE] All cookies:', $request->cookies->all());
        
        // Log all headers for debugging
        $relevantHeaders = [];
        foreach (['X-XSRF-TOKEN', 'X-CSRF-TOKEN', 'Content-Type', 'Accept', 'Authorization', 'Cookie', 'Referer', 'Origin'] as $header) {
            $value = $request->header($header);
            if ($header === 'Authorization' && $value) {
                $relevantHeaders[$header] = 'Bearer ***';
            } elseif ($header === 'Cookie' && $value) {
                $relevantHeaders[$header] = substr($value, 0, 200) . (strlen($value) > 200 ? '...' : '');
            } else {
                $relevantHeaders[$header] = $value;
            }
        }
        Log::info('🔍 [CSRF TRACE] Relevant headers:', $relevantHeaders);
        
        // Check if this request needs CSRF protection
        $needsCsrfProtection = in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE']) && 
                               !$request->is('sanctum/csrf-cookie') &&
                               !$request->is('api/login');
                               
        Log::info('🛡️ [CSRF TRACE] CSRF protection analysis:', [
            'method' => $request->method(),
            'is_mutating_method' => in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE']),
            'is_csrf_cookie_endpoint' => $request->is('sanctum/csrf-cookie'),
            'is_login_endpoint' => $request->is('api/login'),
            'needs_csrf_protection' => $needsCsrfProtection,
            'is_api_route' => $request->is('api/*'),
            'stateful_request' => $this->requestFromFrontend($request),
        ]);
        
        // Process the request
        try {
            $response = $next($request);
            
            Log::info('✅ [CSRF TRACE] Request processed successfully:', [
                'response_status' => $response->getStatusCode(),
                'response_status_text' => $response->getStatusCode() >= 200 && $response->getStatusCode() < 300 ? 'Success' : 'Error'
            ]);
            
        } catch (\Exception $e) {
            Log::error('❌ [CSRF TRACE] Request failed with exception:', [
                'exception_class' => get_class($e),
                'exception_message' => $e->getMessage(),
                'is_csrf_exception' => str_contains($e->getMessage(), 'CSRF') || str_contains($e->getMessage(), '419'),
                'exception_code' => $e->getCode(),
            ]);
            
            // Re-throw the exception
            throw $e;
        }
        
        // Log response details
        $setCookieHeader = $response->headers->get('Set-Cookie');
        if ($setCookieHeader) {
            Log::info('🍪 [CSRF TRACE] Response setting cookies:', [
                'set_cookie_header' => is_array($setCookieHeader) ? $setCookieHeader : [$setCookieHeader],
                'contains_xsrf' => str_contains($setCookieHeader, 'XSRF-TOKEN')
            ]);
        }
        
        Log::info('🔍 [CSRF TRACE] Final response headers:', [
            'status' => $response->getStatusCode(),
            'x_xsrf_token' => $response->headers->get('X-XSRF-TOKEN'),
            'has_set_cookie' => !!$response->headers->get('Set-Cookie'),
        ]);
        
        Log::info('🔍 [CSRF TRACE] =============== REQUEST END ===============');
        
        return $response;
    }

    /**
     * Determine if the request is from a frontend domain.
     */
    protected function requestFromFrontend(Request $request): bool
    {
        $domain = $request->headers->get('referer') ?: $request->headers->get('origin');

        if (!$domain) {
            return false;
        }

        $domain = parse_url($domain, PHP_URL_HOST);

        return collect(config('sanctum.stateful', []))->contains(function ($stateful) use ($domain) {
            return $domain === $stateful || 
                   (filter_var($stateful, FILTER_VALIDATE_IP) !== false && $domain === $stateful) ||
                   str_contains($stateful, $domain);
        });
    }
}

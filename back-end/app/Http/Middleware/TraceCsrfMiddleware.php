<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class TraceCsrfMiddleware extends VerifyCsrfToken
{
    /**
     * Handle an incoming request.
     */
    public function handle($request, Closure $next)
    {
        Log::info('🛡️ [CSRF VALIDATION] Starting CSRF validation process');
        
        // Check if we should skip CSRF for this request
        $shouldSkip = $this->shouldPassThrough($request) || $this->runningUnitTests();
        
        Log::info('🛡️ [CSRF VALIDATION] Skip checks:', [
            'should_skip_csrf' => $shouldSkip,
            'is_reading' => $this->isReading($request),
            'running_unit_tests' => $this->runningUnitTests(),
            'passes_through' => $this->shouldPassThrough($request),
            'method' => $request->method(),
            'path' => $request->path(),
        ]);
        
        if ($shouldSkip) {
            Log::info('✅ [CSRF VALIDATION] Skipping CSRF validation for this request');
            return $next($request);
        }
        
        // Check if this is a read request
        if ($this->isReading($request)) {
            Log::info('✅ [CSRF VALIDATION] Read request, no CSRF validation needed');
            return $next($request);
        }
        
        Log::info('🔍 [CSRF VALIDATION] Validating CSRF token...');
        
        // Get all possible tokens
        $sessionToken = $request->session()->token();
        $requestToken = $this->getTokenFromRequest($request);
        
        Log::info('🔍 [CSRF VALIDATION] Token comparison:', [
            'session_token' => $sessionToken,
            'session_token_length' => $sessionToken ? strlen($sessionToken) : 0,
            'request_token' => $requestToken,
            'request_token_length' => $requestToken ? strlen($requestToken) : 0,
            'tokens_match' => $sessionToken && $requestToken && hash_equals($sessionToken, $requestToken),
        ]);
        
        // Log all methods Laravel will try to get the token
        $headerToken = $request->header('X-CSRF-TOKEN');
        $xsrfToken = $request->header('X-XSRF-TOKEN');
        $inputToken = $request->input('_token');
        
        Log::info('🔍 [CSRF VALIDATION] All token sources:', [
            'header_x_csrf_token' => $headerToken,
            'header_x_xsrf_token' => $xsrfToken,
            'input_token' => $inputToken,
            'final_token_used' => $requestToken,
        ]);
        
        try {
            // Call parent's tokensMatch method to do the actual validation
            $tokensMatch = $this->tokensMatch($request);
            
            if ($tokensMatch) {
                Log::info('✅ [CSRF VALIDATION] CSRF tokens match - validation passed');
                return $next($request);
            } else {
                Log::error('❌ [CSRF VALIDATION] CSRF tokens do not match - validation failed');
                Log::error('❌ [CSRF VALIDATION] Validation failure details:', [
                    'expected' => $sessionToken,
                    'received' => $requestToken,
                    'all_headers' => $request->headers->all(),
                    'session_id' => $request->session()->getId(),
                ]);
                
                // This will throw TokenMismatchException
                return parent::handle($request, $next);
            }
            
        } catch (\Exception $e) {
            Log::error('❌ [CSRF VALIDATION] Exception during CSRF validation:', [
                'exception_class' => get_class($e),
                'exception_message' => $e->getMessage(),
                'is_token_mismatch' => str_contains(get_class($e), 'TokenMismatch'),
            ]);
            
            throw $e;
        }
    }
    
    /**
     * Get the CSRF token from the request.
     */
    protected function getTokenFromRequest($request)
    {
        $token = $request->input('_token') ?: $request->header('X-CSRF-TOKEN');

        if (! $token && $header = $request->header('X-XSRF-TOKEN')) {
            $token = $header;
        }

        return $token;
    }
}

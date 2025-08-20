<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class DebugCsrfController extends Controller
{
    /**
     * Debug CSRF cookie endpoint
     */
    public function debug(Request $request): JsonResponse
    {
        Log::info('🍪 [CSRF DEBUG] CSRF debug endpoint hit:', [
            'session_id' => $request->session()->getId(),
            'csrf_token' => $request->session()->token(),
            'cookies' => $request->cookies->all(),
            'headers' => [
                'origin' => $request->header('origin'),
                'referer' => $request->header('referer'),
                'user-agent' => $request->header('user-agent'),
            ]
        ]);

        // Force regenerate CSRF token
        $request->session()->regenerateToken();
        
        $newToken = $request->session()->token();
        
        Log::info('🔄 [CSRF DEBUG] Generated new CSRF token:', [
            'new_token' => $newToken,
            'session_id' => $request->session()->getId(),
        ]);

        return response()->json([
            'success' => true,
            'csrf_token' => $newToken,
            'session_id' => $request->session()->getId(),
            'cookies_received' => $request->cookies->all(),
            'stateful_domains' => config('sanctum.stateful'),
        ]);
    }
}

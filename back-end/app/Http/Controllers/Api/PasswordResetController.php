<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class PasswordResetController extends Controller
{
    public function forgotPassword(Request $request)
    {
        // TODO: Implement password reset
        return response()->json(['message' => 'Password reset not implemented yet'], 501);
    }

    public function resetPassword(Request $request)
    {
        // TODO: Implement password reset
        return response()->json(['message' => 'Password reset not implemented yet'], 501);
    }
}

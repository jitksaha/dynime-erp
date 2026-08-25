<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthApiController;
use App\Http\Controllers\Api\OrderSyncController;

Route::middleware('api.json')->group(function () {

    Route::post('/login', [AuthApiController::class, 'login']);
    Route::post('/webhook/orders', [OrderSyncController::class, 'syncOrder']);
    Route::post('/recruitment/flowmingo/webhook', [\Workdo\Recruitment\Http\Controllers\FlowmingoHiringController::class, 'webhookIngest']);
    Route::post('/recruitment/flowmingo/sync-job', [\Workdo\Recruitment\Http\Controllers\FlowmingoHiringController::class, 'webhookIngest']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/user', function (Request $request) {
            return $request->user();
        });
        Route::post('/logout', [AuthApiController::class, 'logout']);
        Route::post('/refresh', [AuthApiController::class, 'refresh']);
        Route::post('/change-password', [AuthApiController::class, 'changePassword']);
        Route::post('/edit-profile', [AuthApiController::class, 'editProfile']);
        Route::delete('/delete-account', [AuthApiController::class, 'deleteAccount']);

        // Cross-Platform Time Tracker App API Routes
        Route::prefix('time-tracker')->group(function () {
            Route::get('/status', [\App\Http\Controllers\Api\TimeTrackerApiController::class, 'status']);
            Route::post('/clock-in', [\App\Http\Controllers\Api\TimeTrackerApiController::class, 'clockIn']);
            Route::post('/clock-out', [\App\Http\Controllers\Api\TimeTrackerApiController::class, 'clockOut']);
            Route::post('/sync-heartbeat', [\App\Http\Controllers\Api\TimeTrackerApiController::class, 'syncHeartbeat']);
            Route::post('/upload-screenshot', [\App\Http\Controllers\Api\TimeTrackerApiController::class, 'uploadScreenshot']);
            Route::post('/register-push-token', [\App\Http\Controllers\Api\TimeTrackerApiController::class, 'registerPushToken']);
        });
    });
});

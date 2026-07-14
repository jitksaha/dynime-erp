<?php

use Illuminate\Support\Facades\Route;
use Workdo\DodoPay\Http\Controllers\DodoPaySettingsController;
use Workdo\DodoPay\Http\Controllers\DodoPayController;

Route::middleware(['web', 'auth', 'verified', 'PlanModuleCheck:DodoPay'])->group(function () {
    Route::post('/dodopay/settings', [DodoPaySettingsController::class, 'update'])->name('dodopay.settings.update');
});

Route::middleware(['web'])->group(function() {
    Route::prefix('dodopay')->group(function() {
        Route::post('/plan/company/payment', [DodoPayController::class, 'planPayWithDodoPay'])->name('payment.dodopay.store')->middleware(['auth']);
        Route::get('/plan/company/status', [DodoPayController::class, 'planGetDodoPayStatus'])->name('payment.dodopay.status')->middleware(['auth']);
    });
});

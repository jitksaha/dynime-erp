<?php

use Illuminate\Support\Facades\Route;
use Workdo\Bkash\Http\Controllers\BkashController;
use Workdo\Bkash\Http\Controllers\BkashSettingsController;

Route::middleware(['web', 'auth'])->group(function () {
    Route::post('plan/pay/with/bkash', [BkashController::class, 'planPayWithBkash'])->name('plan.pay.with.bkash');
    Route::post('settings/bkash', [BkashSettingsController::class, 'updateSettings'])->name('settings.bkash.update');
});

Route::middleware(['web'])->group(function () {
    Route::get('payment/bkash/callback', [BkashController::class, 'paymentCallback'])->name('payment.bkash.callback');
});

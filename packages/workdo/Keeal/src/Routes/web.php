<?php

use Illuminate\Support\Facades\Route;
use Workdo\Keeal\Http\Controllers\KeealController;
use Workdo\Keeal\Http\Controllers\KeealSettingsController;

Route::middleware(['web', 'auth'])->group(function () {
    Route::post('plan/pay/with/keeal', [KeealController::class, 'planPayWithKeeal'])->name('plan.pay.with.keeal');
    Route::post('settings/keeal', [KeealSettingsController::class, 'updateKeealSettings'])->name('settings.keeal.update');
});

Route::middleware(['web'])->group(function () {
    Route::get('payment/keeal/status', [KeealController::class, 'keealPaymentStatus'])->name('payment.keeal.status');
    Route::post('keeal/webhook', [KeealController::class, 'handleWebhook'])->name('keeal.webhook');
});

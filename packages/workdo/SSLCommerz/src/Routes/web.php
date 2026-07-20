<?php

use Illuminate\Support\Facades\Route;
use Workdo\SSLCommerz\Http\Controllers\SSLCommerzController;
use Workdo\SSLCommerz\Http\Controllers\SSLCommerzSettingsController;

Route::middleware(['web', 'auth'])->group(function () {
    Route::post('plan/pay/with/sslcommerz', [SSLCommerzController::class, 'planPayWithSSLCommerz'])->name('plan.pay.with.sslcommerz');
    Route::post('settings/sslcommerz', [SSLCommerzSettingsController::class, 'updateSettings'])->name('settings.sslcommerz.update');
});

Route::middleware(['web'])->group(function () {
    Route::post('payment/sslcommerz/success', [SSLCommerzController::class, 'paymentSuccess'])->name('payment.sslcommerz.success');
    Route::post('payment/sslcommerz/fail', [SSLCommerzController::class, 'paymentFail'])->name('payment.sslcommerz.fail');
    Route::post('payment/sslcommerz/cancel', [SSLCommerzController::class, 'paymentCancel'])->name('payment.sslcommerz.cancel');
    Route::post('sslcommerz/ipn', [SSLCommerzController::class, 'handleIpn'])->name('sslcommerz.ipn');
});

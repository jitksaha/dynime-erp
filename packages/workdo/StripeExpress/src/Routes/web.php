<?php

use Illuminate\Support\Facades\Route;
use Workdo\StripeExpress\Http\Controllers\StripeExpressController;
use Workdo\StripeExpress\Http\Controllers\StripeExpressSettingsController;

Route::middleware(['web', 'auth'])->group(function () {
    Route::post('stripe-express/create-intent', [StripeExpressController::class, 'createPaymentIntent'])->name('stripe.express.create-intent');
    Route::post('stripe-express/confirm-payment', [StripeExpressController::class, 'confirmPayment'])->name('stripe.express.confirm-payment');
    Route::post('settings/stripe-express', [StripeExpressSettingsController::class, 'updateSettings'])->name('settings.stripe-express.update');
});

<?php

use App\Http\Controllers\Api\AnalysisController;
use App\Http\Controllers\Api\ReportController;
use Illuminate\Support\Facades\Route;

Route::post('/analyze', [AnalysisController::class, 'analyze']);
Route::apiResource('reports', ReportController::class)->only(['index', 'store', 'show']);

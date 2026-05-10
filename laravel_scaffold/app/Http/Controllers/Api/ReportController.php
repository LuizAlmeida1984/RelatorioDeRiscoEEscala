<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReportRequest;
use App\Models\RiskReport;
use Illuminate\Http\JsonResponse;

class ReportController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            RiskReport::latest()->paginate(15)
        );
    }

    public function store(StoreReportRequest $request): JsonResponse
    {
        $report = RiskReport::create($request->validated());

        return response()->json($report, 201);
    }

    public function show(RiskReport $report): JsonResponse
    {
        return response()->json($report);
    }
}

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('risk_reports', function (Blueprint $table) {
            $table->id();
            $table->string('mentee_name');
            $table->decimal('investment', 15, 2);
            $table->decimal('monthly_return', 15, 2);
            $table->smallInteger('success_prob');
            $table->jsonb('risk_factors');
            $table->jsonb('stats');
            $table->text('ai_analysis')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('risk_reports');
    }
};

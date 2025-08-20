<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table("sessions", function (Blueprint $table) {
            // Change user_id from bigint unsigned to char(36) to support UUIDs
            $table->char("user_id", 36)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table("sessions", function (Blueprint $table) {
            // Revert back to bigint unsigned
            $table->bigInteger("user_id")->unsigned()->nullable()->change();
        });
    }
};

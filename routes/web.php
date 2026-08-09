<?php

use App\Http\Controllers\ProjectController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/projects');

Route::get('projects', [ProjectController::class, 'index'])->name('projects');
Route::post('projects', [ProjectController::class, 'store'])->name('projects.store');
Route::put('projects/{project}', [ProjectController::class, 'update'])->name('projects.update');
Route::delete('projects/{project}', [ProjectController::class, 'destroy'])->name('projects.destroy');

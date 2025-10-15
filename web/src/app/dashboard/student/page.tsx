'use client';

import { useState as _useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';

export default function StudentDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-8" data-testid="dashboard-title">
              Student Dashboard
            </h1>

            <div className="mb-6" data-testid="user-info">
              <div data-testid="user-name">
                {user ? `${user.firstName} ${user.lastName}` : 'Student User'}
              </div>
              <div data-testid="user-role">{user?.role || 'student'}</div>
            </div>

            <div data-testid="welcome-message" className="mb-6 bg-blue-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold text-blue-800">
                Welcome back, {user ? `${user.firstName} ${user.lastName}` : 'Student'}!
              </h2>
              <p className="text-blue-600">Ready to order your delicious meal today?</p>
            </div>

            {/* Student-specific Dashboard Elements */}
            <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Meal Balance Card */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-8 w-8 text-green-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                        />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Meal Balance</dt>
                        <dd
                          className="text-2xl font-bold text-green-600"
                          data-testid="meal-balance"
                        >
                          ₹150.00
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* Today's Meal Card */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-8 w-8 text-blue-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Today's Meal</dt>
                        <dd className="text-lg font-medium text-gray-900" data-testid="todays-meal">
                          Dal Rice & Curry
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* Nutrition Tracker Card */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-8 w-8 text-orange-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Nutrition Tracker
                        </dt>
                        <dd
                          className="text-lg font-medium text-gray-900"
                          data-testid="nutrition-tracker"
                        >
                          1,850 cal today
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation and Action Buttons */}
            <div className="mb-8 flex flex-wrap gap-4">
              <button
                data-testid="nav-menu"
                onClick={() => router.push('/menu')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Menu
              </button>
              <button
                data-testid="order-now-button"
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Order Now
              </button>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Available Meals</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  data-testid="order-card"
                  className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold">Grilled Chicken Sandwich</h4>
                    <span className="text-green-600 font-bold">$8.50</span>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Tender grilled chicken breast with fresh lettuce, tomato, and mayo on whole
                    wheat bread.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Available: 25</span>
                    <button
                      data-testid="order-button"
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Order Now
                    </button>
                  </div>
                </div>

                <div
                  data-testid="order-card"
                  className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold">Vegetarian Pasta</h4>
                    <span className="text-green-600 font-bold">$7.25</span>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Fresh pasta with seasonal vegetables in a creamy tomato sauce, served with
                    garlic bread.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Available: 18</span>
                    <button
                      data-testid="order-button"
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Order Now
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-6 w-6 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Today's Menu</dt>
                        <dd
                          className="text-lg font-medium text-gray-900"
                          data-testid="student-menu"
                        >
                          View Available Meals
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-6 w-6 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Nutrition Info
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          View Nutrition Details
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-6 w-6 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">My Profile</dt>
                        <dd className="text-lg font-medium text-gray-900">Student Settings</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

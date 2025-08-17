'use client';

import Link from 'next/link';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

export default function Hero() {
  return (
    <div className="relative isolate px-6 pt-14 lg:px-8">
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-blue-500 to-purple-600 opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
      </div>

      <div className="mx-auto max-w-4xl py-32 sm:py-48 lg:py-56">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
            Company Analysis & 
            <span className="text-blue-400"> Due Diligence</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-300">
            Advanced KYB (Know Your Business) platform powered by Companies House data and AI. 
            Search companies, analyze ownership structures, and get comprehensive insights for better business decisions.
          </p>
          
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href="/dashboard"
              className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all duration-200"
            >
              Start Analyzing
            </Link>
            <Link
              href="#company-search"
              className="text-sm font-semibold leading-6 text-gray-300 hover:text-white inline-flex items-center transition-colors duration-200"
            >
              Try Search Below <ChevronRightIcon className="ml-1 h-4 w-4" />
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3 lg:gap-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">15M+</div>
              <div className="text-sm text-gray-400">UK Companies</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">Real-time</div>
              <div className="text-sm text-gray-400">Companies House Data</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">AI-Powered</div>
              <div className="text-sm text-gray-400">Risk Analysis</div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
        <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-purple-500 to-blue-600 opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]" />
      </div>
    </div>
  );
}
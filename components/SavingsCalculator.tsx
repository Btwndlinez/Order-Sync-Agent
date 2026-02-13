/**
 * SavingsCalculator Component - ROI Calculator
 * Shows hours saved per month based on order volume
 * Uses VA labor time savings as the metric
 */

import { useState, useEffect, useRef } from "react"

const MIN_ORDERS = 10
const MAX_ORDERS = 1000
const DEFAULT_ORDERS = 200

const MANUAL_TIME_PER_ORDER_MINUTES = 3
const AI_TIME_PER_ORDER_MINUTES = 0.5
const TIME_SAVED_PER_ORDER_MINUTES = MANUAL_TIME_PER_ORDER_MINUTES - AI_TIME_PER_ORDER_MINUTES

const VA_HOURLY_RATE = 8

function easeOutElastic(x: number): number {
  const c4 = (2 * Math.PI) / 3
  return x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1
}

export default function SavingsCalculator() {
  const [orders, setOrders] = useState(DEFAULT_ORDERS)
  const [displayHours, setDisplayHours] = useState(0)
  const [displaySavings, setDisplaySavings] = useState(0)
  const animationRef = useRef<number>()
  const startTimeRef = useRef<number>()

  const hoursSaved = (orders * TIME_SAVED_PER_ORDER_MINUTES) / 60
  const monthlySavings = hoursSaved * VA_HOURLY_RATE

  useEffect(() => {
    const targetHours = hoursSaved
    const targetSavings = monthlySavings

    startTimeRef.current = Date.now()
    const startHours = displayHours
    const startSavings = displaySavings

    const animate = () => {
      if (!startTimeRef.current) return

      const elapsed = Date.now() - startTimeRef.current
      const duration = 800
      const progress = Math.min(elapsed / duration, 1)
      const elasticProgress = easeOutElastic(progress)

      setDisplayHours(startHours + (targetHours - startHours) * elasticProgress)
      setDisplaySavings(startSavings + (targetSavings - startSavings) * elasticProgress)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [orders, hoursSaved, monthlySavings])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatHours = (value: number) => {
    if (value < 1) {
      return `${Math.round(value * 60)} minutes`
    }
    return `${value.toFixed(1)} hours`
  }

  return (
    <div className="py-16 bg-gradient-to-b from-slate-50 to-white" id="calculator">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Calculate Your ROI
          </h2>
          <p className="text-lg text-slate-600">
            See how much time and money {BRAND_NAME} can save you
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          {/* Slider */}
          <div className="mb-10">
            <div className="flex justify-between items-center mb-4">
              <label className="text-sm font-medium text-slate-700">
                How many orders do you process per month?
              </label>
              <span className="text-2xl font-bold text-indigo-600">
                {orders} orders
              </span>
            </div>

            <input
              type="range"
              min={MIN_ORDERS}
              max={MAX_ORDERS}
              value={orders}
              onChange={(e) => setOrders(Number(e.target.value))}
              className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              style={{
                background: `linear-gradient(to right, #4f46e5 0%, #4f46e5 ${((orders - MIN_ORDERS) / (MAX_ORDERS - MIN_ORDERS)) * 100}%, #e2e8f0 ${((orders - MIN_ORDERS) / (MAX_ORDERS - MIN_ORDERS)) * 100}%, #e2e8f0 100%)`
              }}
            />

            <div className="flex justify-between mt-2 text-xs text-slate-500">
              <span>{MIN_ORDERS}</span>
              <span>{MAX_ORDERS}</span>
            </div>
          </div>

          {/* Results */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Hours Saved */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 text-center border border-indigo-100">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-indigo-600 mb-1">
                {formatHours(displayHours)}
              </div>
              <div className="text-sm text-slate-600">
                saved per month
              </div>
            </div>

            {/* Monthly Savings */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 text-center border border-emerald-100">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-emerald-600 mb-1">
                {formatCurrency(displaySavings)}
              </div>
              <div className="text-sm text-slate-600">
                saved per month
              </div>
            </div>

            {/* Yearly Savings */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 text-center border border-amber-100">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-amber-600 mb-1">
                {formatCurrency(displaySavings * 12)}
              </div>
              <div className="text-sm text-slate-600">
                saved per year
              </div>
            </div>
          </div>

          {/* Calculation basis note */}
          <p className="text-xs text-slate-400 text-center mt-6">
            Based on 2.5 minutes saved per order (manual: 3 min, with {BRAND_NAME}: 30 sec) × VA rate of ${VA_HOURLY_RATE}/hr
          </p>
        </div>

        {/* CTA */}
        <div className="text-center mt-8">
          <button className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
            Start Saving Today
          </button>
        </div>
      </div>
    </div>
  )
}

const BRAND_NAME = "Order Sync Agent"

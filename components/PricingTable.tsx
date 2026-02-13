/**
 * PricingTable Component - Dynamic Pricing Display
 * Features Monthly/Yearly toggle with 20% discount
 * Tiers: Starter ($29), Growth ($99), Enterprise (Custom)
 */

import { useState, useEffect } from "react"

interface PricingTier {
  name: string
  monthlyPrice: number
  description: string
  features: string[]
  highlighted?: boolean
  cta: string
}

const TIERS: PricingTier[] = [
  {
    name: "Starter",
    monthlyPrice: 29,
    description: "Perfect for individual sellers getting started",
    features: [
      "200 orders/month",
      "AI-powered order extraction",
      "WhatsApp & Messenger support",
      "Basic product matching",
      "Email support",
      "1 team member"
    ],
    cta: "Start Free Trial"
  },
  {
    name: "Growth",
    monthlyPrice: 99,
    description: "For growing businesses that need more power",
    features: [
      "1,000 orders/month",
      "Advanced AI matching",
      "Priority support",
      "5 team members",
      "Analytics dashboard",
      "Custom checkout links",
      "API access"
    ],
    highlighted: true,
    cta: "Start Free Trial"
  },
  {
    name: "Enterprise",
    monthlyPrice: 0,
    description: "Custom solutions for high-volume operations",
    features: [
      "Unlimited orders",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantee",
      "White-label options",
      "Advanced analytics",
      "24/7 phone support"
    ],
    cta: "Contact Sales"
  }
]

export default function PricingTable() {
  const [isYearly, setIsYearly] = useState(false)
  const [animatedPrices, setAnimatedPrices] = useState<number[]>(TIERS.map(() => 0))

  const yearlyDiscount = 0.2

  useEffect(() => {
    const targetPrices = TIERS.map(tier => {
      if (tier.monthlyPrice === 0) return 0
      const price = isYearly 
        ? tier.monthlyPrice * (1 - yearlyDiscount) 
        : tier.monthlyPrice
      return Math.round(price)
    })

    const duration = 300
    const startTime = Date.now()
    const startPrices = [...animatedPrices]

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      
      setAnimatedPrices(startPrices.map((start, i) => 
        start + (targetPrices[i] - start) * easeOutQuart
      ))

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [isYearly])

  return (
    <div className="py-16" id="pricing">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            Choose the plan that fits your business. No hidden fees.
          </p>

          {/* Monthly/Yearly Toggle */}
          <div className="inline-flex items-center bg-slate-100 rounded-full p-1">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                !isYearly 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                isYearly 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Yearly
              <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TIERS.map((tier, index) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl p-8 transition-all duration-300 ${
                tier.highlighted
                  ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white transform scale-105 shadow-xl'
                  : 'bg-white border border-slate-200 hover:border-slate-300 hover:shadow-lg'
              }`}
            >
              {/* Most Popular Badge */}
              {tier.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg animate-pulse">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Tier Name */}
              <div className="text-center mb-6">
                <h3 className={`text-xl font-bold mb-2 ${tier.highlighted ? 'text-white' : 'text-slate-900'}`}>
                  {tier.name}
                </h3>
                <p className={`text-sm ${tier.highlighted ? 'text-indigo-100' : 'text-slate-500'}`}>
                  {tier.description}
                </p>
              </div>

              {/* Price */}
              <div className="text-center mb-6">
                {tier.monthlyPrice === 0 ? (
                  <div className="text-4xl font-bold">Custom</div>
                ) : (
                  <>
                    <div className="flex items-center justify-center">
                      <span className={`text-5xl font-bold ${tier.highlighted ? 'text-white' : 'text-slate-900'}`}>
                        ${animatedPrices[index]}
                      </span>
                      <span className={`ml-2 ${tier.highlighted ? 'text-indigo-100' : 'text-slate-500'}`}>
                        /month
                      </span>
                    </div>
                    {isYearly && (
                      <p className={`text-sm mt-1 ${tier.highlighted ? 'text-indigo-200' : 'text-emerald-600'}`}>
                        Billed ${tier.monthlyPrice * 12 * (1 - yearlyDiscount)}/year
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <svg 
                      className={`w-5 h-5 mr-3 flex-shrink-0 ${tier.highlighted ? 'text-indigo-200' : 'text-emerald-500'}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className={tier.highlighted ? 'text-indigo-50' : 'text-slate-600'}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
                  tier.highlighted
                    ? 'bg-white text-indigo-600 hover:bg-indigo-50'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {tier.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Money-back Guarantee */}
        <div className="text-center mt-12">
          <p className="text-slate-500">
            <span className="inline-flex items-center">
              <svg className="w-5 h-5 mr-2 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              30-day money-back guarantee. No questions asked.
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}

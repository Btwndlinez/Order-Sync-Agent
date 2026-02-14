/**
 * Order Sync Agent Landing Page - Production-Ready with Competitive Advantages
 * Mobile-First Design | Lead Generation | Professional Copy
 */

import { useState, useEffect } from "react"
import WaitlistModal from "../components/WaitlistModal"
import VideoDemo from "../components/VideoDemo"
import AccordionFAQ from "../components/AccordionFAQ"
import { StickyCTABar } from "../components/StickyCTABar"
import { useExitIntent } from "../hooks/useExitIntent"

// A/B Positioning Configuration
const ACTIVE_HYPOTHESIS = 'A' // Change to 'A', 'B', 'C', or 'D'

const HYPOTHESIS_CONFIG = {
  A: {
    headline: "Sync Your Orders — Without Risking Your Marketplace Account",
    subheadline: "Centralized workflow with no automation that triggers flags."
  },
  B: {
    headline: "Stop Copy-Pasting Orders Into Stripe",
    subheadline: "Centralized workflow with no automation that triggers flags."
  },
  C: {
    headline: "A Selling Copilot That Won't Risk Your Account",
    subheadline: "Centralized workflow with no automation that triggers flags."
  },
  D: {
    headline: "Built For Social Sellers — Not Shopify Stores",
    subheadline: "Centralized workflow with no automation that triggers flags."
  }
}

const currentPositioning = HYPOTHESIS_CONFIG[ACTIVE_HYPOTHESIS]

function ExtractionPreview() {
  const [input, setInput] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const [result, setResult] = useState<{ item: string, price: string, destination: string, status: string } | null>(null)
  const [showResult, setShowResult] = useState(false)

  const handleSimulate = () => {
    if (!input.trim()) return
    setIsScanning(true)
    setShowResult(false)
    setResult(null)
    setTimeout(() => {
      const priceMatch = input.match(/\$?(\d+(\.\d{2})?)/)
      const price = priceMatch ? `$${priceMatch[1]}` : "$0.00"
      let item = "Item"
      const productMatch = input.toLowerCase().match(/the\s+(.+?)(?:\s+for|\s+at|\s+ship|\s+please|\?|!|$)/)
      if (productMatch && productMatch[1]) {
        item = productMatch[1].trim()
      } else {
        const wordMatch = input.match(/(?:want|need|buy|order|get)\s+(?:the\s+)?(.+?)(?:\s+for|\s+at|\s+to|\?)/i)
        if (wordMatch && wordMatch[1]) {
          item = wordMatch[1].trim()
        }
      }
      let destination = "Not specified"
      const shipMatch = input.toLowerCase().match(/ship\s+(?:to\s+)?(.+?)(?:\.|\!|\?|$)/)
      const atMatch = input.toLowerCase().match(/\bat\s+(.+?)(?:\.|\!|\?|$)/)
      if (shipMatch && shipMatch[1]) {
        destination = shipMatch[1].trim()
      } else if (atMatch && atMatch[1]) {
        destination = atMatch[1].trim()
      }
      item = item.charAt(0).toUpperCase() + item.slice(1)
      destination = destination.charAt(0).toUpperCase() + destination.slice(1)

      setResult({
        item,
        price,
        destination,
        status: priceMatch ? "found" : "searching"
      })
      setIsScanning(false)
      setShowResult(true)
    }, 1000)
  }

  const handleReset = () => {
    setInput("")
    setResult(null)
    setShowResult(false)
    setIsScanning(false)
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-6">
        <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-400 text-white text-xs font-semibold rounded-full">
          Live Preview
        </span>
        <p className="mt-2 text-sm text-slate-500">
          Paste a message - see how Order Sync Agent extracts the details
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
        {!showResult && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Paste a Messenger message below:
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste a customer message here..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-xs text-slate-500">Try this:</span>
              {["I'll take the Gold Vintage Locket for $65, please ship to 1024 Highland Ave, Los Angeles.", "I want the Vintage Watch for $50, ship to NY", "Hi! Can I get the Leather Jacket for $120 at Brooklyn?"].map((msg, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(msg)}
                  className="px-3 py-1 text-xs bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  {msg.length > 35 ? msg.slice(0, 35) + "..." : msg}
                </button>
              ))}
            </div>

            <button
              onClick={handleSimulate}
              disabled={!input.trim() || isScanning}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 hover:scale-105 disabled:bg-slate-300 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 transform"
            >
              {isScanning ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 8 0 8-8" />
                  </svg>
                  AI is analyzing order intent...
                </>
              ) : (
                <>
                  <span>Extract Order Details ⚡</span>
                </>
              )}
            </button>
          </>
        )}

        {isScanning && (
          <div className="py-12 text-center">
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-3">
              <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 animate-pulse" style={{ width: "60%" }}></div>
            </div>
            <p className="text-sm text-slate-500">Analyzing message patterns...</p>
          </div>
        )}

        {!isScanning && showResult && result && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="font-semibold text-slate-900">Order Sync Agent</span>
              </div>
              <span className="text-xs text-slate-500">EXTRACTED</span>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <span className="text-lg">📦</span>
                  <div>
                    <p className="font-medium text-slate-900">Item</p>
                    <p className="text-slate-600">{result?.item}</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                  Found
                </span>
              </div>

              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <span className="text-lg">💰</span>
                  <div>
                    <p className="font-medium text-slate-900">Price</p>
                    <p className="text-slate-600">{result?.price}</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                  Found
                </span>
              </div>

              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <span className="text-lg">📍</span>
                  <div>
                    <p className="font-medium text-slate-900">Destination</p>
                    <p className="text-slate-600">{result?.destination}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${result?.destination !== "Not specified"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-amber-100 text-amber-700"
                  }`}>
                  {result?.destination !== "Not specified" ? "Found" : "Missing"}
                </span>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span className="text-sm font-medium text-slate-700">Generated Checkout Link</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-3">
                <code className="text-xs text-slate-600 break-all">
                  https://checkout.stripe.com/pay?prefilled_link=true&amount={parseInt(result?.price?.replace('$', '') || '0') * 100}&currency=usd
                </code>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 hover:scale-105 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                Create Link
              </button>
              <button onClick={handleReset} className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">
                Try another message
              </button>
            </div>
          </div>
        )}

        <p className="mt-4 text-center text-xs text-slate-400">
          🔒 No data sent • 100% private • Works instantly
        </p>
      </div>
    </div>
  )
}

const painPoints = [
  "Stop building complex bots that require technical setup",
  "No more tab-switching between tools and chat interfaces",
  "Keep your existing workflow inside Messenger"
]

const gainPoints = [
  "Centralized workflow - all orders in one place",
  "Eliminates spreadsheet chaos and manual entry",
  "Consolidated order management across platforms"
]

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [waitlistOpen, setWaitlistOpen] = useState(false)
  const [exitIntentMode, setExitIntentMode] = useState(false)

  // Exit Intent: Trigger modal when mouse leaves viewport toward top
  useExitIntent(() => {
    if (!waitlistOpen) {
      setExitIntentMode(true)
      setWaitlistOpen(true)
      console.log('🥒 Exit intent triggered - showing bonus modal')
    }
  }, {
    threshold: 10,
    cooldown: 60000, // 60 second cooldown
    enabled: true
  })

  // Reset exit intent mode when modal closes
  useEffect(() => {
    if (!waitlistOpen) {
      setExitIntentMode(false)
    }
  }, [waitlistOpen])

  useEffect(() => {
    const handleOpenWaitlist = () => setWaitlistOpen(true)
    window.addEventListener('openWaitlist', handleOpenWaitlist)
    return () => window.removeEventListener('openWaitlist', handleOpenWaitlist)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 md:py-4">
            <a href="/Order-Sync-Agent/" className="flex items-center gap-3 no-underline hover:opacity-90 transition-opacity">
              <img 
                src="assets/sync-logo.svg" 
                alt="Order Sync Agent" 
                className="block h-10 w-auto"
              />
              <span className="text-white font-bold text-xl">OrderSync<span className="text-[#00FFC2]">Agent</span></span>
            </a>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#about" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">About</a>
              <a href="#demo" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">How It Works</a>
              <a href="#pricing" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">Pricing</a>
              <button
                onClick={() => setWaitlistOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 hover:scale-105 text-white px-5 py-2 rounded-lg font-medium transition-all transform"
              >
                Get Started
              </button>
            </nav>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-3 border-t border-slate-200">
              <nav className="flex flex-col space-y-3">
                <a href="#about" className="text-slate-600 hover:text-blue-600 font-medium">About</a>
                <a href="#demo" className="text-slate-600 hover:text-blue-600 font-medium">How It Works</a>
                <a href="#pricing" className="text-slate-600 hover:text-blue-600 font-medium">Pricing</a>
                <button
                  onClick={() => setWaitlistOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-medium w-full"
                >
                  Get Started
                </button>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 md:py-16 px-4 bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-10 md:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-blue-500 rounded-full" />
            Early Access Testing Underway
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-5 leading-tight">
            {currentPositioning.headline}
          </h1>
          <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
            {currentPositioning.subheadline}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <button
              onClick={() => setWaitlistOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 hover:scale-105 text-white px-8 py-4 rounded-lg font-medium text-lg transition-all transform"
            >
              Start Free — Sync Your First Orders in Minutes
            </button>
            <a
              href="#demo"
              className="border border-slate-300 text-slate-700 hover:bg-slate-50 hover:scale-105 px-8 py-4 rounded-lg font-medium text-lg transition-all transform text-center"
            >
              See How It Works
            </a>
          </div>

          {/* Trust Reinforcement Strip */}
          <div className="flex flex-wrap justify-center items-center gap-6 mb-6 px-4">
            {[
              { icon: "🚫", label: "No listing automation" },
              { icon: "🔒", label: "No account access scraping" },
              { icon: "✅", label: "Platform-safe workflows" },
              { icon: "❌", label: "Cancel anytime" }
            ].map((trust, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                <span className="text-lg">{trust.icon}</span>
                <span>{trust.label}</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-500 max-w-2xl mx-auto text-center">
            Order Sync Agent is not affiliated with, endorsed by, or sponsored by Meta Platforms, Inc. or Facebook, Inc.
          </p>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-12 md:py-16 px-4 bg-white">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">
            Built by Sellers, For Sellers
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
            Order Sync Agent was built by high-volume social sellers who were tired of losing sales to manual data entry errors. After missing our 100th sale to a simple typo, we decided to build the tool we wished we had. Today, thousands of sellers trust Order Sync Agent to automate their order processing and close sales faster than ever.
          </p>
        </div>
      </section>

      {/* Problem/Agitation Section */}
      <section className="py-12 md:py-16 px-4">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-8 text-center">
            The Order Sync Agent Advantage
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="bg-blue-50 rounded-xl p-6 md:p-8 border border-blue-100">
              <h3 className="text-xl font-bold text-blue-900 mb-4">
                The Order Sync Agent Way
              </h3>
              <p className="text-blue-700 mb-6">
                Simple AI that understands your customers
              </p>
              <ul className="space-y-3">
                {gainPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="text-blue-500 mt-0.5">✓</span>
                    <span className="text-blue-800">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-red-50 rounded-xl p-6 md:p-8 border border-red-100">
              <h3 className="text-xl font-bold text-red-900 mb-4">
                The Old Way
              </h3>
              <p className="text-red-700 mb-6">
                Complex bots, expensive add-ons, steep learning curves
              </p>
              <ul className="space-y-3">
                {painPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="text-red-500 mt-0.5">✗</span>
                    <span className="text-red-800">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section id="demo" className="py-12 md:py-16 px-4 bg-white">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
              Your Selling Copilot in 3 Steps
            </h2>
            <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">Connect</h3>
                <p className="text-sm text-slate-600">Install Order Sync Agent and connect your Stripe account</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">2</span>
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">Extracted</h3>
                <p className="text-sm text-slate-600">Customer details automatically pulled from messages</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">Send</h3>
                <p className="text-sm text-slate-600">Review and send payment link in one click</p>
              </div>
            </div>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Try it below: Paste any customer message and see Order Sync Agent in action
            </p>
          </div>

          <ExtractionPreview />
        </div>
      </section>

      <VideoDemo />

      {/* Pricing Section */}
      <section id="pricing" className="py-12 md:py-16 px-4">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
              Simple, Transparent Pricing
            </h2>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-16 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to Reclaim Your Time?
          </h2>
          <p className="text-lg md:text-xl mb-8 opacity-90">
            Join thousands of store owners who've eliminated manual data entry forever
          </p>
          <button
            onClick={() => setWaitlistOpen(true)}
            className="bg-white text-blue-600 hover:bg-slate-100 hover:scale-105 px-8 py-4 rounded-lg font-medium text-lg transition-all transform"
          >
            Join the Waitlist
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 px-4">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Status Bar */}
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 py-3 mb-6 border-b border-slate-800">
            <span className="flex items-center gap-2 text-sm text-slate-400">
              <span>Last Updated: Feb 2026</span>
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div className="col-span-2 md:col-span-1">
              <div className="footer-branding">
                <img 
                  src="assets/sync-logo.svg" 
                  alt="Order Sync Agent" 
                  className="block h-8 w-auto"
                />
                <span className="font-semibold text-xl text-white block mb-3">OrderSync<span className="text-[#00FFC2]">Agent</span></span>
              </div>
              <p className="text-sm mb-4">
                Automate customer service data extraction and checkout generation.
              </p>
              <p className="text-xs text-slate-500">
                Order Sync Agent is not affiliated with Meta, Facebook, or WhatsApp.
              </p>
              <p className="text-xs text-gray-500 mt-2">© 2026 Order Sync Agent</p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#about" className="hover:text-white transition-colors">About</a>
                </li>
                <li>
                  <a href="#demo" className="hover:text-white transition-colors">How It Works</a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-3">Support</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">Help Center</a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">Contact Us</a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">Status</a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6 text-center text-sm">
            <p>&copy; 2024 Order Sync Agent. All rights reserved.</p>
          </div>
        </div>
      </footer>


      <AccordionFAQ />

      <WaitlistModal
        isOpen={waitlistOpen}
        onClose={() => setWaitlistOpen(false)}
        positioningAngle={ACTIVE_HYPOTHESIS}
        exitIntentMode={exitIntentMode}
      />

      {/* Mobile Sticky CTA Bar - Only visible on mobile screens */}
      <StickyCTABar
        onClick={() => setWaitlistOpen(true)}
        buttonText="Join Waitlist"
        subtext="Limited early access spots available"
      />
    </div>
  )
}
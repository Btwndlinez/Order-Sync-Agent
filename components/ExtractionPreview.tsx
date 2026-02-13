/**
 * Extraction Preview Widget - Interactive Lead Magnet
 * Simulates AI extraction behavior with Stripe-style receipt display
 */

import { useState } from "react"

interface ExtractionResult {
  item: string
  price: string
  destination: string
  status: "found" | "searching"
}

function simulateExtraction(text: string): ExtractionResult {
  const normalizedText = text.toLowerCase()

  // Extract Price: Look for $XX.XX or XX.XX pattern
  const priceMatch = text.match(/\$?(\d+(\.\d{2})?)/)
  const price = priceMatch
    ? `$${priceMatch[1]}`
    : "$0.00"

  // Extract Product: Text between "the" and "for"
  let item = "Item"
  const productMatch = normalizedText.match(/the\s+(.+?)(?:\s+for|\s+at|\s+ship|\s+please|\?|!|$)/)
  if (productMatch && productMatch[1]) {
    item = productMatch[1].trim()
  } else {
    // Fallback: Try to find product-like words
    const wordMatch = text.match(/(?:want|need|buy|order|get)\s+(?:the\s+)?(.+?)(?:\s+for|\s+at|\s+to|\?)/i)
    if (wordMatch && wordMatch[1]) {
      item = wordMatch[1].trim()
    }
  }

  // Extract Address: Look for "ship to" or "at"
  let destination = "Not specified"
  const shipMatch = normalizedText.match(/ship\s+(?:to\s+)?(.+?)(?:\.|\!|\?|$)/)
  const atMatch = normalizedText.match(/\bat\s+(.+?)(?:\.|\!|\?|$)/)

  if (shipMatch && shipMatch[1]) {
    destination = shipMatch[1].trim()
  } else if (atMatch && atMatch[1]) {
    destination = atMatch[1].trim()
  }

  // Capitalize item and destination
  item = item.charAt(0).toUpperCase() + item.slice(1)
  destination = destination.charAt(0).toUpperCase() + destination.slice(1)

  return {
    item,
    price,
    destination,
    status: priceMatch ? "found" : "searching",
  }
}

export function ExtractionPreview() {
  const [input, setInput] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const [result, setResult] = useState<ExtractionResult | null>(null)
  const [showResult, setShowResult] = useState(false)

  const handleSimulate = () => {
    if (!input.trim()) return

    setIsScanning(true)
    setShowResult(false)
    setResult(null)

    // Simulate AI processing time
    setTimeout(() => {
      const extraction = simulateExtraction(input)
      setResult(extraction)
      setIsScanning(false)
      setShowResult(true)
    }, 1200)
  }

  const handleReset = () => {
    setInput("")
    setResult(null)
    setShowResult(false)
    setIsScanning(false)
  }

  const sampleMessages = [
    "I want the Vintage Watch for $50, ship to NY",
    "Hi! Can I get the Leather Jacket for $120 at Brooklyn?",
    "Hey, I'd like to buy the White Sneakers please, ship to LA",
  ]

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-emerald-400 text-white text-xs font-semibold rounded-full">
          ✨ Try it Now
        </span>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Paste a message - see how fast Order Sync Agent extracts the details
        </p>
      </div>

      {/* Input Card */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        {!showResult ? (
          <>
            {/* Textarea */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Paste a Messenger message below:
              </label>
              <textarea
                className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all"
                placeholder="Paste a message here (e.g., 'I want the Vintage Watch for $50, ship to NY')"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={3}
              />
            </div>

            {/* Sample Buttons */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-xs text-gray-500">Quick samples:</span>
              {sampleMessages.map((msg, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(msg)}
                  className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {msg.length > 30 ? msg.slice(0, 30) + "..." : msg}
                </button>
              ))}
            </div>

            {/* Simulate Button */}
            <button
              onClick={handleSimulate}
              disabled={!input.trim() || isScanning}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2"
            >
              {isScanning ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Scanning...
                </>
              ) : (
                <>
                  <span>Simulate Sync</span>
                  <span>🚀</span>
                </>
              )}
            </button>
          </>
        ) : (
          <>
            {/* Scanning Progress */}
            {isScanning && (
              <div className="py-12 text-center">
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 animate-pulse" style={{ width: "60%" }} />
                </div>
                <p className="text-sm text-gray-500">Analyzing message patterns...</p>
              </div>
            )}

            {/* Stripe-Style Receipt */}
            {!isScanning && result && (
              <div className="animate-fade-in">
                {/* Receipt Header */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">Order Sync Agent</span>
                  </div>
                  <span className="text-xs text-gray-500">RECEIPT</span>
                </div>

                {/* Extracted Items */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <span className="text-lg">📦</span>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Item</p>
                        <p className="text-gray-900 dark:text-white font-semibold">{result.item}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <span className="text-lg">💰</span>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Total</p>
                        <p className="text-gray-900 dark:text-white font-semibold">{result.price}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <span className="text-lg">📍</span>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Destination</p>
                        <p className="text-gray-900 dark:text-white font-semibold">{result.destination}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6 ${
                  result.status === "found"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    result.status === "found" ? "bg-emerald-500" : "bg-amber-500"
                  }`} />
                  {result.status === "found" ? "All details found" : "Searching for details..."}
                </div>

                {/* Processing Time */}
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mb-4">
                  <span>⏱️</span>
                  <span>Processed in 1.2s</span>
                </div>

                {/* CTA Buttons */}
                <div className="space-y-3">
                  <button className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2">
                    <span>Generate Real Link</span>
                    <span>🔗</span>
                  </button>

                  <button
                    onClick={handleReset}
                    className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  >
                    Try another message
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Trust Signal */}
      <p className="mt-4 text-center text-xs text-gray-400">
        🔒 No data sent • 100% private • Works instantly
      </p>
    </div>
  )
}

export default ExtractionPreview

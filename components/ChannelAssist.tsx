/**
 * ChannelAssist Component
 * High-speed, low-friction order extraction interface
 * Single-view design for rapid customer message processing
 */

import React, { useState, useRef, useEffect } from 'react'
import { findBestMatch, generateCartLink, type ProductMatch } from '../utils/productMatcher'
import { parseIntent, type ParsedIntent } from '../utils/intentParser'

const BRAND_BLUE = '#1877F2'
const BRAND_BLUE_HOVER = '#166fe5'

interface ExtractedOrder {
  product: string
  variant: string | null
  quantity: number
  confidence: number
}

interface ChannelAssistState {
  input: string
  isProcessing: boolean
  extractedOrder: ExtractedOrder | null
  productMatch: ProductMatch | null
  cartLink: string | null
  replyText: string
  copied: boolean
  error: string | null
}

export default function ChannelAssist() {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [state, setState] = useState<ChannelAssistState>({
    input: '',
    isProcessing: false,
    extractedOrder: null,
    productMatch: null,
    cartLink: null,
    replyText: '',
    copied: false,
    error: null
  })

  // Auto-expand textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [state.input])

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setState(prev => ({ ...prev, input: e.target.value, error: null }))
  }

  const handleProcess = async () => {
    if (!state.input.trim()) {
      setState(prev => ({ ...prev, error: 'Please enter a customer message' }))
      return
    }

    setState(prev => ({ ...prev, isProcessing: true, error: null }))

    try {
      // Step 1: Parse intent using LLM
      const parsedIntent = await parseIntent(state.input)
      
      if (!parsedIntent.orders || parsedIntent.orders.length === 0) {
        throw new Error('Could not extract order details from message')
      }

      const order = parsedIntent.orders[0]
      
      // Step 2: Find best product match
      const match = findBestMatch({
        product: order.product_name,
        variant: order.variant,
        quantity: order.quantity
      })

      // Step 3: Generate cart link
      const cartLink = match 
        ? generateCartLink(match, order.quantity)
        : generateGenericCartLink(order.product_name, order.quantity)

      // Step 4: Compose reply
      const replyText = composeReply(order, match, cartLink)

      setState(prev => ({
        ...prev,
        isProcessing: false,
        extractedOrder: {
          product: order.product_name,
          variant: order.variant,
          quantity: order.quantity,
          confidence: order.confidence_score
        },
        productMatch: match,
        cartLink,
        replyText
      }))

    } catch (error) {
      console.error('Processing error:', error)
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Failed to process message'
      }))
    }
  }

  const handleCopyReply = async () => {
    if (!state.replyText) return

    try {
      await navigator.clipboard.writeText(state.replyText)
      setState(prev => ({ ...prev, copied: true }))
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setState(prev => ({ ...prev, copied: false }))
      }, 2000)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  const handleReplyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setState(prev => ({ ...prev, replyText: e.target.value }))
  }

  const handleReset = () => {
    setState({
      input: '',
      isProcessing: false,
      extractedOrder: null,
      productMatch: null,
      cartLink: null,
      replyText: '',
      copied: false,
      error: null
    })
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.focus()
    }
  }

  const composeReply = (
    order: ParsedIntent['orders'][0],
    match: ProductMatch | null,
    cartLink: string
  ): string => {
    const productName = match?.name || order.product_name
    const variant = order.variant || match?.variant || ''
    const qty = order.quantity
    const price = match?.price || order.price_mentioned
    
    let reply = `Perfect! I've got your order for ${qty}x ${productName}`
    if (variant) reply += ` (${variant})`
    if (price) reply += ` at ${price}`
    reply += '.\n\n'
    reply += `Here's your checkout link: ${cartLink}\n\n`
    reply += 'Let me know if you need anything else!'
    
    return reply
  }

  const generateGenericCartLink = (product: string, qty: number): string => {
    // Fallback generic cart link
    const baseUrl = import.meta.env.VITE_STORE_URL || 'https://your-store.com'
    return `${baseUrl}/checkout?product=${encodeURIComponent(product)}&qty=${qty}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Channel Assist
          </h1>
          <p className="text-slate-600">
            Extract order details and generate checkout links in seconds
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Paste Customer Message
          </label>
          <textarea
            ref={textareaRef}
            value={state.input}
            onChange={handleInputChange}
            placeholder="e.g., 'I'll take two of those red vintage tees in large'"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1877F2] focus:border-transparent resize-none overflow-hidden min-h-[100px]"
            disabled={state.isProcessing}
          />
          
          {state.error && (
            <p className="mt-2 text-sm text-red-600">{state.error}</p>
          )}

          <button
            onClick={handleProcess}
            disabled={state.isProcessing || !state.input.trim()}
            className="mt-4 w-full py-3 px-4 bg-[#1877F2] hover:bg-[#166fe5] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all active:scale-[0.98]"
          >
            {state.isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 8-8" />
                </svg>
                Analyzing Intent...
              </span>
            ) : (
              'Extract Order Details'
            )}
          </button>
        </div>

        {/* Results Section */}
        {(state.extractedOrder || state.productMatch) && (
          <div className="space-y-6">
            {/* Extracted Intent Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Extracted Intent
              </h2>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Product</p>
                  <p className="font-semibold text-slate-900">{state.extractedOrder?.product || '-'}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Variant</p>
                  <p className="font-semibold text-slate-900">{state.extractedOrder?.variant || 'N/A'}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Quantity</p>
                  <p className="font-semibold text-slate-900">{state.extractedOrder?.quantity || '-'}</p>
                </div>
              </div>

              {/* Product Match */}
              {state.productMatch && (
                <div className="border-t border-slate-200 pt-4 mt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide">Matched Product</p>
                      <p className="font-semibold text-slate-900">{state.productMatch.name}</p>
                      <p className="text-sm text-slate-600">SKU: {state.productMatch.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 uppercase tracking-wide">Match Score</p>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${(state.productMatch.score || 0) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-slate-700">
                          {Math.round((state.productMatch.score || 0) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Cart Link */}
              {state.cartLink && (
                <div className="border-t border-slate-200 pt-4 mt-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Cart Link</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={state.cartLink}
                      readOnly
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 font-mono"
                    />
                    <button
                      onClick={() => navigator.clipboard.writeText(state.cartLink!)}
                      className="px-3 py-2 text-[#1877F2] hover:bg-blue-50 rounded-lg transition-colors"
                      title="Copy link"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Reply Composer */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-[#1877F2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                Reply Composer
              </h2>
              
              <textarea
                value={state.replyText}
                onChange={handleReplyChange}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1877F2] focus:border-transparent resize-none min-h-[120px]"
                placeholder="Edit your reply..."
              />

              <button
                onClick={handleCopyReply}
                className={`mt-4 w-full py-3 px-4 font-semibold rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                  state.copied
                    ? 'bg-emerald-500 text-white'
                    : 'bg-[#1877F2] hover:bg-[#166fe5] text-white'
                }`}
              >
                {state.copied ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    Copy Reply
                  </>
                )}
              </button>
            </div>

            {/* Reset Button */}
            <div className="text-center">
              <button
                onClick={handleReset}
                className="text-slate-500 hover:text-slate-700 font-medium text-sm"
              >
                Process another message →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

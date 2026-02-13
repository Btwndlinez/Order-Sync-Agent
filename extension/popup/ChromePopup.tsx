/**
 * Chrome Extension Popup - Order Sync Agent
 * Fixed 350px width with Messenger Blue branding
 */

import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import OrderCard from './components/OrderCard'

// Brand colors
const BRAND_BLUE = '#1877F2'
const BRAND_BLUE_HOVER = '#166fe5'
const BRAND_DARK = '#1C1E21'

interface OrderDetails {
  buyerName: string
  itemName: string
  price: string
  detectedAt: string
}

export default function ChromePopup() {
  const [isScanning, setIsScanning] = useState(false)
  const [detectedOrder, setDetectedOrder] = useState<OrderDetails | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Listen for messages from content script
    const messageListener = (request: any, sender: any, sendResponse: any) => {
      if (request.action === 'orderDetected') {
        setDetectedOrder(request.order)
        setIsScanning(false)
      } else if (request.action === 'scanning') {
        setIsScanning(true)
      }
    }

    chrome.runtime.onMessage.addListener(messageListener)
    
    // Request current scan status when popup opens
    chrome.runtime.sendMessage({ action: 'getOrderStatus' }, (response) => {
      if (response?.order) {
        setDetectedOrder(response.order)
      }
      setIsScanning(response?.scanning || false)
    })

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener)
    }
  }, [])

  const handleSyncOrder = async () => {
    if (!detectedOrder) return

    setIsScanning(true)
    
    try {
      // TODO: Call Stripe checkout generation API
      console.log('Syncing order:', detectedOrder)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setMessage('Order synced successfully!')
      setDetectedOrder(null)
    } catch (error) {
      setMessage('Sync failed. Please try again.')
    } finally {
      setIsScanning(false)
    }
  }

  const handleSettingsClick = () => {
    chrome.runtime.openOptionsPage()
  }

  return (
    <div style={{ width: '350px' }} className="bg-white font-sans text-[14px]">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <svg width="24" height="24" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="42" fill={BRAND_BLUE} />
            <path d="M 25 30 L 50 50 L 75 30 L 75 40 L 50 60 L 25 40 Z" fill="white" opacity="0.9"/>
            <path d="M 25 50 L 50 70 L 75 50 L 75 60 L 50 80 L 25 60 Z" fill="white" opacity="0.9"/>
          </svg>
          <span className="font-semibold text-[16px]" style={{ color: BRAND_DARK }}>Order Sync Agent</span>
        </div>
        
        <button
          onClick={handleSettingsClick}
          className="p-1 rounded hover:bg-slate-100 transition-colors"
          title="Settings"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06.06a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 0-2.83 0 2 2 0 0 0 0 2.83l.06.06a1.65 1.65 0 0 0 .33 1.82l-.06.06a2 2 0 0 0 0 2.83 2 2 0 0 0 2.83 0l.06-.06a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 0 2.83 0 2 2 0 0 0 0-2.83l-.06-.06a1.65 1.65 0 0 0-.33-1.82l.06-.06a2 2 0 0 0 0-2.83 2 2 0 0 0-2.83 0l-.06.06a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 0-2.83 0 2 2 0 0 0 0 2.83l.06.06a1.65 1.65 0 0 0 .33 1.82l-.06.06a2 2 0 0 0 0 2.83 2 2 0 0 0 2.83 0l.06-.06a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 0 2.83 0 2 2 0 0 0 0-2.83Z"/>
          </svg>
        </button>
      </header>

      {/* Main Content */}
      <main className="p-4" style={{ minHeight: '400px' }}>
        {/* Active State */}
        {isScanning && (
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-emerald-700 font-medium">Currently Scanning Chat...</span>
            </div>
          </div>
        )}

        {/* Order Detected */}
        {detectedOrder && !isScanning && (
          <div>
            <div className="mb-4">
              <OrderCard 
                order={detectedOrder}
                onSync={handleSyncOrder}
                isScanning={isScanning}
              />
            </div>
          </div>
        )}

        {/* Empty State */}
        {!detectedOrder && !isScanning && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={BRAND_BLUE} strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <p className="text-slate-600 text-[13px]">
              Open a Messenger thread to sync an order.
            </p>
          </div>
        )}

        {/* Success/Error Messages */}
        {message && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${
            message.includes('successfully') 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message}
          </div>
        )}
      </main>

      {/* Footer Disclaimer */}
      <footer className="px-4 py-3 border-t border-slate-200">
        <p className="text-[10px] text-slate-400 text-center leading-tight">
          Order Sync Agent is not affiliated with Meta or Facebook.
        </p>
      </footer>
    </div>
  )
}

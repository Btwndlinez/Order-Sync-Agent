/**
 * OrderCard Component - Chrome Extension Order Detection Card
 * Matches Order Sync Agent brand identity
 */

import React from 'react'

interface OrderDetails {
  buyerName: string
  itemName: string
  price: string
  detectedAt: string
}

interface OrderCardProps {
  order: OrderDetails
  onSync: () => void
  isScanning?: boolean
}

export const OrderCard = ({ order, onSync, isScanning = false }: OrderCardProps) => {
  return (
    <div className="p-3 border border-slate-200 rounded-lg bg-white shadow-sm hover:border-[#1877F2] transition-colors">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold text-slate-500 uppercase">Order Detected</span>
        <span className="text-[#1877F2] font-bold text-lg">{order.price}</span>
      </div>
      
      <div className="mb-3">
        <p className="text-sm font-medium text-slate-900">{order.itemName}</p>
        <p className="text-xs text-slate-500 mt-1">
          From: <span className="font-medium">{order.buyerName}</span>
        </p>
      </div>
      
      <button 
        onClick={onSync}
        disabled={isScanning}
        className={`
          w-full py-2 px-3 rounded-md font-semibold transition-all
          ${isScanning 
            ? 'bg-emerald-500 animate-pulse cursor-not-allowed' 
            : 'bg-[#1877F2] hover:bg-[#166fe5] text-white active:scale-95'
          }
        `}
      >
        {isScanning ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 8 0 8-8" />
            </svg>
            Syncing...
          </span>
        ) : (
          'Sync to Stripe'
        )}
      </button>
    </div>
  )
}

export default OrderCard
/**
 * SyncTrigger Component - In-Chat Logo Injection
 * Official Order Sync Agent bubble with sync animation
 */

// Brand colors
const BRAND_BLUE = '#1877F2'
const EMERALD_GREEN = '#10B981'

interface SyncTriggerOptions {
  messageElement: Element
  orderDetails: any
}

class SyncTrigger {
  private static instances: Map<Element, SyncTrigger> = new Map()
  private element: Element
  private triggerElement: HTMLElement
  private tooltipElement: HTMLElement
  private isPulsing = false

  constructor(options: SyncTriggerOptions) {
    this.element = options.messageElement
    this.createElements(options.orderDetails)
    this.inject()
    this.attachEvents()
  }

  private createElements(orderDetails: any): void {
    // Create trigger button container
    this.triggerElement = document.createElement('div')
    this.triggerElement.className = 'order-sync-trigger'
    Object.assign(this.triggerElement.style, {
      position: 'absolute',
      top: '50%',
      right: '-32px',
      transform: 'translateY(-50%)',
      width: '24px',
      height: '24px',
      backgroundColor: BRAND_BLUE,
      borderRadius: '50%',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '9999',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      transition: 'all 0.2s ease',
    })

    // Add sync icon (circular arrows)
    this.triggerElement.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
        <path d="M 21 12 A 9 9 0 1 1 12 21"/>
        <path d="M 3 12 A 9 9 0 1 1 12 3"/>
        <path d="M 21 12 L 18 9 L 18 15 Z"/>
        <path d="M 3 12 L 6 9 L 6 15 Z"/>
      </svg>
    `

    // Create tooltip
    this.tooltipElement = document.createElement('div')
    this.tooltipElement.className = 'order-sync-tooltip'
    this.tooltipElement.textContent = 'Sync this order to Stripe'
    Object.assign(this.tooltipElement.style, {
      position: 'absolute',
      bottom: '30px',
      right: '0',
      backgroundColor: BRAND_BLUE,
      color: 'white',
      padding: '6px 10px',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: '500',
      whiteSpace: 'nowrap',
      opacity: '0',
      visibility: 'hidden',
      transform: 'translateY(5px)',
      transition: 'all 0.2s ease',
      zIndex: '10000',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    })

    // Add arrow to tooltip
    const arrow = document.createElement('div')
    arrow.style.cssText = `
      position: absolute;
      top: -4px;
      right: 8px;
      width: 0;
      height: 0;
      border-left: 4px solid transparent;
      border-right: 4px solid transparent;
      border-bottom: 4px solid ${BRAND_BLUE};
    `
    this.tooltipElement.appendChild(arrow)
  }

  private inject(): void {
    // Make parent relative for absolute positioning
    const parent = this.element.parentElement
    if (parent) {
      Object.assign(parent.style, {
        position: 'relative',
      })
    }

    // Add elements to DOM
    this.element.appendChild(this.triggerElement)
    this.triggerElement.appendChild(this.tooltipElement)
    
    // Store reference
    SyncTrigger.instances.set(this.element, this)
  }

  private attachEvents(): void {
    // Hover effects
    this.triggerElement.addEventListener('mouseenter', () => {
      this.handleHover()
    })

    this.triggerElement.addEventListener('mouseleave', () => {
      this.handleHoverOut()
    })

    // Click handler
    this.triggerElement.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      this.handleClick()
    })
  }

  private handleHover(): void {
    this.triggerElement.style.transform = 'translateY(-50%) scale(1.15)'
    this.triggerElement.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.25)'
    
    this.tooltipElement.style.opacity = '1'
    this.tooltipElement.style.visibility = 'visible'
    this.tooltipElement.style.transform = 'translateY(0)'
  }

  private handleHoverOut(): void {
    if (!this.isPulsing) {
      this.triggerElement.style.transform = 'translateY(-50%) scale(1)'
      this.triggerElement.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)'
    }
    
    this.tooltipElement.style.opacity = '0'
    this.tooltipElement.style.visibility = 'hidden'
    this.tooltipElement.style.transform = 'translateY(5px)'
  }

  private handleClick(): void {
    console.log('🥒 Sync trigger clicked!')
    
    // Open extension popup or overlay
    this.openOrderSyncInterface()
  }

  private openOrderSyncInterface(): void {
    try {
      // Method 1: Try to open extension popup
      chrome.runtime.sendMessage({
        action: 'openPopup',
        order: this.getOrderDetails()
      })
    } catch (error) {
      console.warn('🥒 Could not open popup, creating overlay...')
      this.createOrderOverlay()
    }
  }

  private getOrderDetails(): any {
    // Extract order details from parent message
    const messageText = this.element.textContent || ''
    const priceMatch = messageText.match(/\$?(\d+(?:\.\d{2})?)/)
    const itemMatch = messageText.match(/(?:want|need|take|buy)\s+(.+?)(?:\s+for|\s+at|\s+to|\?|!|$)/i)
    
    return {
      price: priceMatch ? `$${priceMatch[1]}` : null,
      itemName: itemMatch ? itemMatch[1].trim() : null,
      messageText: messageText.substring(0, 100),
    }
  }

  private createOrderOverlay(): void {
    // Create modal overlay with order details
    const overlay = document.createElement('div')
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      backdrop-filter: blur(4px);
    `

    const modal = document.createElement('div')
    modal.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 24px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: slideUp 0.3s ease-out;
    `

    const orderDetails = this.getOrderDetails()
    modal.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px;">
        <svg width="48" height="48" viewBox="0 0 100 100" style="margin-bottom: 12px;">
          <circle cx="50" cy="50" r="42" fill="${BRAND_BLUE}"/>
          <path d="M 25 30 L 50 50 L 75 30 L 75 40 L 50 60 L 25 40 Z" fill="white" opacity="0.9"/>
          <path d="M 25 50 L 50 70 L 75 50 L 75 60 L 50 80 L 25 60 Z" fill="white" opacity="0.9"/>
        </svg>
        <h3 style="margin: 0 0 8px 0; color: ${BRAND_BLUE}; font-size: 20px; font-weight: 600;">
          Order Sync Agent
        </h3>
        <p style="margin: 0; color: #64748b; font-size: 14px;">
          Confirm and sync this order to Stripe
        </p>
      </div>
      
      <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: #64748b; font-size: 14px;">Item:</span>
          <span style="font-weight: 500; color: #1e293b; font-size: 14px;">
            ${orderDetails.itemName || 'Unknown Item'}
          </span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #64748b; font-size: 14px;">Price:</span>
          <span style="font-weight: 600; color: ${BRAND_BLUE}; font-size: 16px;">
            ${orderDetails.price || '$0.00'}
          </span>
        </div>
      </div>
      
      <div style="display: flex; gap: 12px;">
        <button onclick="this.closest('[data-sync-overlay]').remove()" style="
          flex: 1;
          padding: 12px 24px;
          border: 1px solid #e2e8f0;
          background: white;
          color: #64748b;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        " onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">
          Cancel
        </button>
        <button onclick="
          chrome.runtime.sendMessage({action: 'syncOrder', order: ${JSON.stringify(orderDetails)}});
          this.closest('[data-sync-overlay]').remove();
        " style="
          flex: 1;
          padding: 12px 24px;
          border: none;
          background: ${BRAND_BLUE};
          color: white;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        " onmouseover="this.style.background='#166fe5'" onmouseout="this.style.background='${BRAND_BLUE}'">
          Sync to Stripe
        </button>
      </div>
    `

    overlay.appendChild(modal)
    overlay.setAttribute('data-sync-overlay', 'true')
    document.body.appendChild(overlay)

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove()
      }
    })
  }

  /**
   * Start pulse animation to grab attention
   */
  startPulse(): void {
    if (this.isPulsing) return
    
    this.isPulsing = true
    this.triggerElement.style.animation = 'pulse 2s ease-in-out infinite'
    
    // Add emerald glow effect
    this.triggerElement.style.boxShadow = `0 0 0 3px ${EMERALD_GREEN}, 0 0 8px ${EMERALD_GREEN}40`
  }

  /**
   * Stop pulse animation
   */
  stopPulse(): void {
    this.isPulsing = false
    this.triggerElement.style.animation = ''
    this.triggerElement.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)'
  }

  /**
   * Remove trigger from DOM
   */
  destroy(): void {
    if (this.triggerElement) {
      this.triggerElement.remove()
    }
    SyncTrigger.instances.delete(this.element)
  }

  /**
   * Inject global styles
   */
  static injectStyles(): void {
    if (document.getElementById('order-sync-styles')) return

    const styles = document.createElement('style')
    styles.id = 'order-sync-styles'
    styles.textContent = `
      @keyframes pulse {
        0% { transform: translateY(-50%) scale(1); }
        50% { transform: translateY(-50%) scale(1.2); }
        100% { transform: translateY(-50%) scale(1); }
      }
      
      @keyframes slideUp {
        from { 
          opacity: 0;
          transform: translate(-50%, -40%);
        }
        to { 
          opacity: 1;
          transform: translate(-50%, -50%);
        }
      }
      
      .order-sync-trigger:hover {
        background: ${EMERALD_GREEN} !important;
      }
    `
    document.head.appendChild(styles)
  }

  /**
   * Create or update trigger for message element
   */
  static createOrUpdate(messageElement: Element, orderDetails?: any): SyncTrigger | null {
    // Check if trigger already exists
    const existing = SyncTrigger.instances.get(messageElement)
    if (existing) {
      // Update with new details if provided
      if (orderDetails) {
        existing.startPulse() // Grab attention with new data
        setTimeout(() => existing.stopPulse(), 3000)
      }
      return existing
    }

    // Create new trigger if order details found
    if (orderDetails && (orderDetails.price || orderDetails.itemName)) {
      SyncTrigger.injectStyles()
      return new SyncTrigger({
        messageElement,
        orderDetails
      })
    }

    return null
  }
}

// Export for use in content script
if (typeof window !== 'undefined') {
  (window as any).SyncTrigger = SyncTrigger
}
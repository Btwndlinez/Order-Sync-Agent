/**
 * Messenger Content Script - Main Integration
 * Combines extraction logic with sync trigger injection
 */

// Import modules (they're loaded separately)
// Note: In production, these would be bundled properly

// Main messenger integration class
class MessengerIntegration {
  private static instance: MessengerIntegration
  private mutationObserver: MutationObserver | null = null
  private isEnabled = true

  static getInstance(): MessengerIntegration {
    if (!MessengerIntegration.instance) {
      MessengerIntegration.instance = new MessengerIntegration()
    }
    return MessengerIntegration.instance
  }

  private constructor() {
    this.init()
  }

  private init(): void {
    console.log('🥒 Order Sync Agent - Messenger Integration Starting...')
    
    // Wait for Messenger to load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => this.startObservation(), 2000)
      })
    } else {
      setTimeout(() => this.startObservation(), 1000)
    }
  }

  private startObservation(): void {
    console.log('🥒 Starting DOM observation...')
    
    // Initial scan of existing messages
    this.scanExistingMessages()
    
    // Watch for new messages
    this.setupMutationObserver()
  }

  private scanExistingMessages(): void {
    const messageElements = this.getMessageElements()
    console.log(`🥒 Scanning ${messageElements.length} existing messages...`)
    
    messageElements.forEach((element, index) => {
      setTimeout(() => {
        this.processMessageElement(element)
      }, index * 100) // Stagger processing
    })
  }

  private setupMutationObserver(): void {
    if (this.mutationObserver) return

    this.mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check if this is a message element
              if (this.isMessageElement(node as Element)) {
                setTimeout(() => {
                  this.processMessageElement(node as Element)
                }, 500) // Wait for message to fully render
              } else {
                // Look for message elements within added nodes
                const messageElements = (node as Element).querySelectorAll('[data-text], .message, [role="presentation"]')
                messageElements.forEach((msgEl) => {
                  if (this.isMessageElement(msgEl)) {
                    setTimeout(() => {
                      this.processMessageElement(msgEl)
                    }, 500)
                  }
                })
              }
            }
          })
        }
      })
    })

    // Start observing the main content area
    const target = document.querySelector('[role="main"]') || document.body
    if (target) {
      this.mutationObserver.observe(target, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false
      })
      console.log('🥒 Mutation observer started on:', target)
    }
  }

  private getMessageElements(): Element[] {
    const selectors = [
      '[data-text]',
      '.message',
      '[role="presentation"]',
      '[data-testid="msg_container"]',
      '.x1y332i.x9f619.x4kbpqq.x1lliihq'
    ]

    for (const selector of selectors) {
      try {
        const elements = document.querySelectorAll(selector)
        if (elements.length > 0) {
          console.log(`🥒 Found ${elements.length} messages with selector: ${selector}`)
          return Array.from(elements).filter(this.isValidMessageElement)
        }
      } catch (e) {
        console.warn(`🥒 Selector failed: ${selector}`, e)
      }
    }

    return []
  }

  private isValidMessageElement(element: Element): boolean {
    const text = (element.textContent || '').trim()
    
    // Must have text content
    if (text.length === 0 || text.length > 1000) return false
    
    // Must contain relevant indicators
    const hasPrice = /\$?\d+(\.\d{2})?/.test(text)
    const hasKeywords = /\b(want|need|take|buy|order|price|cost|item|product|shipping|total)\b/i.test(text)
    
    // Not a system message or UI element
    const notSystem = !text.match(/\b(joined|left|started|ended|reacted|liked)\b/i)
    
    // Not our own injected content
    const notInjected = !element.closest('.order-sync-trigger') && !element.classList.contains('order-sync-trigger')
    
    return (hasPrice || hasKeywords) && notSystem && notInjected
  }

  private isMessageElement(element: Element): boolean {
    return this.isValidMessageElement(element)
  }

  private processMessageElement(element: Element): void {
    if (!this.isEnabled) return

    try {
      const text = (element.textContent || '').trim()
      console.log('🥒 Processing message:', text.substring(0, 80))
      
      // Extract order details
      const orderDetails = this.extractOrderDetails(text)
      
      if (orderDetails) {
        console.log('🥒 Order details extracted:', orderDetails)
        
        // Inject sync trigger
        this.injectSyncTrigger(element, orderDetails)
      }
    } catch (error) {
      console.error('🥒 Error processing message:', error)
    }
  }

  private extractOrderDetails(text: string): any {
    // Price extraction
    const priceMatch = text.match(/\$?(\d+(?:\.\d{2})?)/)
    const price = priceMatch ? `$${priceMatch[1]}` : null
    
    // Item name extraction
    let itemName = null
    const itemPatterns = [
      /(?:the|this|that)\s+(.+?)(?:\s+for|\s+at|\s+to|\s+please|\?|!|$)/i,
      /(?:want|need|buy|order|get|take|like)\s+(?:the\s+)?(.+?)(?:\s+for|\s+at|\s+to|\s+please|\?|!|,|$)/i,
    ]
    
    for (const pattern of itemPatterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        itemName = match[1].trim()
        break
      }
    }
    
    // Only return if we have meaningful data
    if (price || itemName) {
      return {
        price,
        itemName: itemName || 'Unknown Item',
        detectedAt: new Date().toISOString(),
        hasPrice: !!price,
        hasItemName: !!itemName
      }
    }
    
    return null
  }

  private injectSyncTrigger(element: Element, orderDetails: any): void {
    // Make sure SyncTrigger is available
    if (typeof (window as any).SyncTrigger === 'undefined') {
      console.warn('🥒 SyncTrigger not available')
      return
    }
    
    try {
      // Create or update trigger
      const trigger = (window as any).SyncTrigger.createOrUpdate(element, orderDetails)
      
      if (trigger && orderDetails.hasPrice) {
        // Start pulse animation to grab attention
        setTimeout(() => {
          trigger.startPulse()
          setTimeout(() => trigger.stopPulse(), 3000) // Pulse for 3 seconds
        }, 500)
      }
    } catch (error) {
      console.error('🥒 Failed to inject sync trigger:', error)
    }
  }

  /**
   * Disable the integration (for settings)
   */
  disable(): void {
    this.isEnabled = false
    
    // Remove all triggers
    if (typeof (window as any).SyncTrigger !== 'undefined') {
      const instances = (window as any).SyncTrigger.instances || new Map()
      instances.forEach((trigger: any) => trigger.destroy())
    }
  }

  /**
   * Enable the integration
   */
  enable(): void {
    this.isEnabled = true
    this.scanExistingMessages()
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.disable()
    
    if (this.mutationObserver) {
      this.mutationObserver.disconnect()
      this.mutationObserver = null
    }
  }
}

// Initialize integration when content script loads
try {
  const integration = MessengerIntegration.getInstance()
  
  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('🥒 Integration received message:', request)
    
    switch (request.action) {
      case 'extractOrder':
        // Trigger manual scan
        integration.scanExistingMessages()
        sendResponse({ success: true })
        break
        
      case 'disableIntegration':
        integration.disable()
        sendResponse({ success: true })
        break
        
      case 'enableIntegration':
        integration.enable()
        sendResponse({ success: true })
        break
        
      default:
        sendResponse({ success: false, error: 'Unknown action' })
    }
    
    return true
  })
  
  console.log('🥒 Order Sync Agent - Integration loaded successfully')
  
} catch (error) {
  console.error('🥒 Failed to initialize Order Sync Agent:', error)
}
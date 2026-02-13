/**
 * Messenger DOM Extraction Logic - Content Script
 * Privacy-first scraping for Order Sync Agent
 */

interface ExtractedOrder {
  buyerName: string
  itemName: string
  price: string
  detectedAt: string
  messageText: string
}

class MessengerExtractor {
  private static instance: MessengerExtractor
  private isScanning = false
  private currentOrder: ExtractedOrder | null = null

  static getInstance(): MessengerExtractor {
    if (!MessengerExtractor.instance) {
      MessengerExtractor.instance = new MessengerExtractor()
    }
    return MessengerExtractor.instance
  }

  /**
   * Extract order details from Messenger conversation
   */
  extractOrderDetails(): ExtractedOrder | null {
    if (this.isScanning) {
      console.log('🥒 Already scanning, skipping...')
      return null
    }

    this.isScanning = true
    
    try {
      console.log('🥒 Starting extraction scan...')

      // Get message containers - look for Messenger message bubbles
      const messageContainers = this.getMessageContainers()
      
      if (!messageContainers || messageContainers.length === 0) {
        console.log('🥒 No message containers found')
        this.isScanning = false
        return null
      }

      // Get last 10 messages for analysis
      const recentMessages = messageContainers.slice(-10)
      
      // Scan for currency patterns and order details
      let orderDetails: ExtractedOrder | null = null
      
      for (const container of recentMessages) {
        const messageText = this.extractMessageText(container)
        
        if (!messageText || messageText.trim().length === 0) continue
        
        console.log('🥒 Analyzing message:', messageText.substring(0, 100))
        
        // Currency pattern: $XX.XX, XX.XX USD, etc.
        const priceMatch = this.extractPrice(messageText)
        if (!priceMatch) continue
        
        // Extract item name and buyer info
        const itemName = this.extractItemName(messageText)
        const buyerName = this.extractBuyerName()
        
        if (itemName && priceMatch) {
          orderDetails = {
            buyerName: buyerName || 'Unknown',
            itemName: itemName,
            price: priceMatch,
            detectedAt: new Date().toISOString(),
            messageText: messageText.substring(0, 200)
          }
          
          console.log('🥒 Order extracted:', orderDetails)
          break // Use first valid order found
        }
      }

      this.currentOrder = orderDetails
      this.isScanning = false
      return orderDetails

    } catch (error) {
      console.error('🥒 Extraction error:', error)
      this.isScanning = false
      return null
    }
  }

  /**
   * Get Messenger message containers
   */
  private getMessageContainers(): Element[] {
    // Try multiple possible selectors for Messenger message bubbles
    const selectors = [
      '[role="main"] [aria-label*="message"]', // Standard Messenger
      '[data-testid="msg_container"]', // New Messenger UI
      '.message', // Old Messenger
      '[role="presentation"] .message', // Fallback
      '[data-text]', // Message bubbles with text attribute
      '.x1y332i.x9f619.x4kbpqq.x1hl2rp', // Specific Messenger classes
    ]

    for (const selector of selectors) {
      try {
        const containers = document.querySelectorAll(selector)
        if (containers.length > 0) {
          console.log(`🥒 Found ${containers.length} message containers using selector: ${selector}`)
          return Array.from(containers)
        }
      } catch (e) {
        console.warn(`🥒 Selector failed: ${selector}`, e)
      }
    }

    // Last resort: try to find any element with currency patterns
    const allElements = document.querySelectorAll('*')
    const messageElements = Array.from(allElements).filter(el => {
      const text = el.textContent || ''
      return text.match(/\$\d+(\.\d{2})?/) && el.closest('[role="main"], .conversation, .messages')
    })

    return messageElements
  }

  /**
   * Extract clean text from message container
   */
  private extractMessageText(container: Element): string {
    // Try multiple ways to get message text
    const textSources = [
      container.textContent,
      container.getAttribute('data-text'),
      container.querySelector('[data-text]')?.textContent,
      container.querySelector('.message-content')?.textContent,
      container.querySelector('.x1lliihq')?.textContent, // Messenger specific
    ]

    for (const text of textSources) {
      if (text && text.trim().length > 0) {
        return text.trim()
      }
    }

    return ''
  }

  /**
   * Extract price from message text
   */
  private extractPrice(text: string): string | null {
    const pricePatterns = [
      /\$?(\d+\.\d{2})/g, // $25.00 or 25.00
      /\$(\d+)/g, // $25
      /(\d+\.\d{2})\s*(USD|usd|dollars?)/gi, // 25.00 USD
      /(\d+)\s*(USD|usd|dollars?)/gi, // 25 USD
    ]

    for (const pattern of pricePatterns) {
      const matches = text.match(pattern)
      if (matches && matches.length > 0) {
        const price = matches[0]
        return price.startsWith('$') ? price : `$${price}`
      }
    }

    return null
  }

  /**
   * Extract item name from message text
   */
  private extractItemName(text: string): string | null {
    const lowerText = text.toLowerCase()
    
    // Common item extraction patterns
    const itemPatterns = [
      /(?:the|this|that)\s+(.+?)(?:\s+for|\s+at|\s+to|\s+please|\?|!|$)/i,
      /(?:want|need|buy|order|get|take|like)\s+(?:the\s+)?(.+?)(?:\s+for|\s+at|\s+to|\s+please|\?|!|,|$)/i,
      /(?:item|product)\s*[:\-]?\s*(.+?)(?:\s+for|\s+at|\s+to|\s+please|\?|!|$)/i,
    ]

    for (const pattern of itemPatterns) {
      const match = lowerText.match(pattern)
      if (match && match[1]) {
        const item = match[1].trim()
        // Clean up common stop words
        const cleanedItem = item.replace(
          /\b(this|that|the|a|an|and|or|but|for|with|at|to|please|thanks|thank you)\b/gi,
          ''
        ).trim()
        
        if (cleanedItem.length > 2 && cleanedItem.length < 50) {
          // Capitalize first letter
          return cleanedItem.charAt(0).toUpperCase() + cleanedItem.slice(1)
        }
      }
    }

    // Fallback: use first substantial word before currency
    const beforePrice = text.split(/\$/)[0]?.trim()
    if (beforePrice) {
      const words = beforePrice.split(/\s+/)
      const lastWords = words.slice(-2).join(' ')
      if (lastWords.length > 2 && lastWords.length < 30) {
        return lastWords.charAt(0).toUpperCase() + lastWords.slice(1)
      }
    }

    return null
  }

  /**
   * Extract buyer name from chat header
   */
  private extractBuyerName(): string | null {
    const nameSelectors = [
      '[role="main"] h3', // Chat header
      '[aria-label*="conversation"] [role="heading"]', // Conversation title
      '.conversation-header .name', // Header name
      '[data-testid="conversation-title"]', // New Messenger
      '.x9f619.x4kbpqq.x1he694', // Messenger name class
    ]

    for (const selector of nameSelectors) {
      try {
        const element = document.querySelector(selector)
        if (element && element.textContent) {
          const name = element.textContent.trim()
          if (name.length > 1 && name.length < 50) {
            console.log(`🥒 Found buyer name: ${name}`)
            return name
          }
        }
      } catch (e) {
        console.warn(`🥒 Name selector failed: ${selector}`, e)
      }
    }

    return null
  }

  /**
   * Get current extracted order
   */
  getCurrentOrder(): ExtractedOrder | null {
    return this.currentOrder
  }

  /**
   * Check if currently scanning
   */
  getScanningStatus(): boolean {
    return this.isScanning
  }
}

// Initialize extractor
const extractor = MessengerExtractor.getInstance()

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('🥒 Content script received message:', request)

  switch (request.action) {
    case 'extractOrder':
      const order = extractor.extractOrderDetails()
      sendResponse({ 
        success: true, 
        order: order,
        scanning: extractor.getScanningStatus()
      })
      
      // Notify popup of detected order
      if (order) {
        chrome.runtime.sendMessage({
          action: 'orderDetected',
          order: order
        })
      }
      break

    case 'getOrderStatus':
      sendResponse({
        order: extractor.getCurrentOrder(),
        scanning: extractor.getScanningStatus()
      })
      break

    case 'startScanning':
      chrome.runtime.sendMessage({ action: 'scanning' })
      break

    default:
      console.log('🥒 Unknown action:', request.action)
  }

  return true // Keep the message channel open for async response
})

console.log('🥒 Order Sync Agent content script loaded')
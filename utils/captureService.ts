/**
 * Message Capture Service - WhatsApp Web Listener
 * High-fidelity message capture with deduplication
 */

import { getIntent, IntentResult } from './intentFilter';

export interface CanonicalMessage {
  platform: 'whatsapp';
  conversation_id: string;
  sender: string;
  timestamp: number;
  content: {
    body: string;
    type: 'text' | 'image' | 'video' | 'audio';
  };
}

interface MessageHash {
  conversation_id: string;
  message_text: string;
  timestamp: number;
}

class LRUCache<T> {
  private cache: Map<string, T>;
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: string): T | undefined {
    if (!this.cache.has(key)) return undefined;
    this.cache.delete(key);
    this.cache.set(key, this.cache.get(key)!);
    return this.cache.get(key);
  }

  set(key: string, value: T): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    this.cache.set(key, value);
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }

  getSize(): number {
    return this.cache.size;
  }
}

function simpleHash(data: MessageHash): string {
  const str = `${data.conversation_id}|${data.message_text}|${data.timestamp}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

function generateMessageKey(conversationId: string, messageText: string, timestamp: number): string {
  const data: MessageHash = { conversation_id: conversationId, message_text: messageText, timestamp };
  return simpleHash(data);
}

const messageCache = new LRUCache<string>(500);

function normalizeMessageType(element: Element): 'text' | 'image' | 'video' | 'audio' {
  const img = element.querySelector('img[src*="media"]');
  if (img) return 'image';
  
  const video = element.querySelector('video');
  if (video) return 'video';
  
  const audio = element.querySelector('audio');
  if (audio) return 'audio';
  
  return 'text';
}

function extractConversationId(): string {
  const header = document.querySelector('header') || document.querySelector('[data-testid="conversation-info-header"]');
  if (header) {
    const phoneMatch = header.textContent?.match(/\d{10,}/);
    if (phoneMatch) return phoneMatch[0];
  }
  const urlMatch = window.location.href.match(/chat\/(\d+)/);
  if (urlMatch) return urlMatch[1];
  return `chat_${Date.now()}`;
}

function extractSender(element: Element): string {
  const senderElement = element.querySelector('[data-testid="conversation-panel-header-title"]') 
    || element.querySelector('._1Oe6M');
  
  if (senderElement) {
    const name = senderElement.textContent?.trim();
    if (name && name !== 'WhatsApp') return name;
  }

  const outgoing = element.closest('._1UyJF') || element.closest('.message-out');
  if (outgoing) return 'self';
  
  return 'unknown';
}

function extractTimestamp(element: Element): number {
  const timeElement = element.querySelector('time') 
    || element.querySelector('._1vasG') 
    || element.querySelector('[data-testid="msg-meta"] span:last-child');
  
  if (timeElement) {
    const datetime = timeElement.getAttribute('datetime');
    if (datetime) return new Date(datetime).getTime();
    
    const timeText = timeElement.textContent;
    if (timeText) {
      const today = new Date();
      const [hours, minutes] = timeText.split(':').map(Number);
      today.setHours(hours, minutes, 0, 0);
      return today.getTime();
    }
  }
  
  return Date.now();
}

function extractMessageContent(element: Element): string {
  const textContainer = element.querySelector('._1Gy50')
    || element.querySelector('. selectable-text')
    || element.querySelector('[data-testid="message-text"]')
    || element.querySelector('span[dir="ltr"]');
  
  if (textContainer) {
    return textContainer.textContent?.trim() || '';
  }
  
  return '';
}

function parseMessageFromNode(node: Node): CanonicalMessage | null {
  if (node.nodeType !== Node.ELEMENT_NODE) return null;
  
  const element = node as Element;
  
  const messageContent = extractMessageContent(element);
  if (!messageContent || messageContent.length < 2) return null;
  
  const sender = extractSender(element);
  const timestamp = extractTimestamp(element);
  const conversationId = extractConversationId();
  const messageType = normalizeMessageType(element);
  
  return {
    platform: 'whatsapp',
    conversation_id: conversationId,
    sender,
    timestamp,
    content: {
      body: messageContent,
      type: messageType
    }
  };
}

export type MessageHandler = (message: CanonicalMessage, intent: IntentResult | null) => void;

let observer: MutationObserver | null = null;
let messageHandler: MessageHandler | null = null;

export function startCapture(onMessage: MessageHandler): void {
  messageHandler = onMessage;
  
  const chatContainer = document.querySelector('#main')
    || document.querySelector('[data-testid="conversation-panel-messages"]')
    || document.querySelector('._1LLap');
  
  if (!chatContainer) {
    console.warn('[CaptureService] Chat container not found');
    return;
  }
  
  if (observer) {
    observer.disconnect();
  }
  
  const processedNodes = new WeakSet<Node>();
  
  observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== 'childList') continue;
      
      for (const addedNode of mutation.addedNodes) {
        if (processedNodes.has(addedNode)) continue;
        processedNodes.add(addedNode);
        
        const message = parseMessageFromNode(addedNode);
        if (!message) continue;
        
        const messageKey = generateMessageKey(
          message.conversation_id,
          message.content.body,
          message.timestamp
        );
        
        if (messageCache.has(messageKey)) {
          continue;
        }
        
        messageCache.set(messageKey, messageKey);
        
        const intent = getIntent(message.content.body);
        
        if (intent) {
          dispatchMessage(message, intent);
        }
        
        messageHandler?.(message, intent);
      }
    }
  });
  
  observer.observe(chatContainer, {
    childList: true,
    subtree: true
  });
  
  console.log('[CaptureService] WhatsApp listener started');
}

export function stopCapture(): void {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  messageCache.clear();
  console.log('[CaptureService] WhatsApp listener stopped');
}

async function dispatchMessage(message: CanonicalMessage, intent: IntentResult): Promise<void> {
  const payload = {
    merchant_id: localStorage.getItem('ordersync_merchant_id') || 'default',
    intent_type: intent.intent,
    priority: intent.priority,
    message
  };
  
  console.log(`🎯 Target Intent Detected: ${intent.intent}. Dispatching...`);
  console.log('[CaptureService] Payload:', payload);

  const webhookUrl = localStorage.getItem('ordersync_webhook_url');
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      console.log('[CaptureService] Message dispatched to webhook');
    } catch (error) {
      console.error('[CaptureService] Dispatch failed:', error);
    }
  }
}

export function getCacheStats(): { size: number; maxSize: number } {
  return { size: messageCache.getSize(), maxSize: 500 };
}

export function clearDeduplicationCache(): void {
  messageCache.clear();
}

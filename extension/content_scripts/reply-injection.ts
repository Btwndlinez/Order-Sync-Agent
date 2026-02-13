/**
 * WhatsApp Reply Injection (Auto-Paste)
 * Safely injects text into WhatsApp Web message box
 */

(function() {
  const CONFIG = {
    inputSelectors: [
      '#main > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1)',
      'div[role="textbox"][contenteditable="true"]',
      'div[contenteditable="true"][data-tab="10"]',
      'div._3uMse',
      'div._2_1wd',
      'footer div[contenteditable="true"]',
      'div._2A8P4'
    ],
    maxRetries: 3,
    retryDelay: 500
  };

  let retryCount = 0;

  /**
   * Find the WhatsApp message input element
   */
  function findInputElement(): HTMLElement | null {
    for (const selector of CONFIG.inputSelectors) {
      const el = document.querySelector(selector);
      if (el && isEditableInput(el)) {
        return el as HTMLElement;
      }
    }
    return null;
  }

  /**
   * Check if element is an editable input
   */
  function isEditableInput(el: Element): boolean {
    const hasContentEditable = el.getAttribute('contenteditable') === 'true';
    const hasRole = el.getAttribute('role') === 'textbox';
    const hasTextbox = el.classList.contains('_3uMse') || 
                       el.classList.contains('_2_1wd') ||
                       el.classList.contains('_2A8P4');
    return hasContentEditable || hasRole || hasTextbox;
  }

  /**
   * Get current text in input (to check if user has started typing)
   */
  function getCurrentText(): string {
    const input = findInputElement();
    if (!input) return '';
    return input.innerText || input.textContent || '';
  }

  /**
   * Primary method: Use execCommand for reliable state management
   */
  function execCommandInsertText(text: string): boolean {
    const input = findInputElement();
    if (!input) return false;

    try {
      input.focus();
      const success = document.execCommand('insertText', false, text);
      return success;
    } catch (err) {
      console.warn('[OrderSync] execCommand failed:', err);
      return false;
    }
  }

  /**
   * Fallback: Dispatch beforeinput/input events
   */
  function dispatchInputEvents(text: string): boolean {
    const input = findInputElement();
    if (!input) return false;

    try {
      input.focus();

      // Dispatch beforeinput event
      const beforeInputEvent = new InputEvent('beforeinput', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: text
      });
      input.dispatchEvent(beforeInputEvent);

      // Insert text manually as fallback
      const currentText = getCurrentText();
      const newText = currentText + text;
      
      if (input.innerText !== undefined) {
        input.innerText = newText;
      } else if (input.textContent !== undefined) {
        input.textContent = newText;
      }

      // Dispatch input event
      const inputEvent = new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: text
      });
      input.dispatchEvent(inputEvent);

      // Trigger any React/Angular change handlers
      const changeEvent = new Event('change', { bubbles: true });
      input.dispatchEvent(changeEvent);

      return true;
    } catch (err) {
      console.warn('[OrderSync] Input events failed:', err);
      return false;
    }
  }

  /**
   * Main injection function with safety check
   */
  function injectReply(text: string, options: { append?: boolean } = {}): Promise<boolean> {
    return new Promise((resolve) => {
      const { append = true } = options;
      
      // Safety check: Don't clear if user has started typing
      const currentText = getCurrentText();
      const hasUserText = currentText.trim().length > 0;
      
      let finalText = text;
      if (hasUserText && append) {
        // Append to existing draft
        finalText = '\n' + text;
      } else if (hasUserText && !append) {
        // User has text but we should replace - warn instead
        console.warn('[OrderSync] User has draft text, appending instead');
        finalText = '\n' + text;
      }

      // Try execCommand first
      if (execCommandInsertText(finalText)) {
        console.log('[OrderSync] Text injected via execCommand');
        resolve(true);
        return;
      }

      // Fallback to event dispatch
      if (dispatchInputEvents(finalText)) {
        console.log('[OrderSync] Text injected via input events');
        resolve(true);
        return;
      }

      // Retry logic
      if (retryCount < CONFIG.maxRetries) {
        retryCount++;
        console.log(`[OrderSync] Retrying injection (${retryCount}/${CONFIG.maxRetries})`);
        setTimeout(() => {
          const success = execCommandInsertText(finalText) || dispatchInputEvents(finalText);
          retryCount = 0;
          resolve(success);
        }, CONFIG.retryDelay);
      } else {
        console.error('[OrderSync] All injection attempts failed');
        retryCount = 0;
        resolve(false);
      }
    });
  }

  /**
   * Switch to WhatsApp tab and inject
   */
  async function injectToActiveTab(text: string): Promise<boolean> {
    return new Promise(async (resolve) => {
      try {
        // Get active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab || !tab.id) {
          console.error('[OrderSync] No active tab found');
          resolve(false);
          return;
        }

        // Check if it's WhatsApp
        if (!tab.url?.includes('web.whatsapp.com')) {
          // Try to find WhatsApp tab
          const tabs = await chrome.tabs.query({});
          const waTab = tabs.find(t => t.url?.includes('web.whatsapp.com'));
          
          if (waTab) {
            // Switch to WhatsApp tab
            await chrome.tabs.update(waTab.id!, { active: true });
            await chrome.windows.update(waTab.windowId!, { focused: true });
            
            // Wait for tab to be ready
            await new Promise(r => setTimeout(r, 1000));
          } else {
            console.error('[OrderSync] WhatsApp not open');
            resolve(false);
            return;
          }
        }

        // Inject into the tab
        const results = await chrome.tabs.executeScript(tab.id!, {
          code: `
            (function() {
              const text = ${JSON.stringify(text)};
              const selectors = [
                'div[role="textbox"][contenteditable="true"]',
                'div._3uMse',
                'div._2_1wd',
                'footer div[contenteditable="true"]'
              ];
              for (const sel of selectors) {
                const el = document.querySelector(sel);
                if (el) {
                  el.focus();
                  document.execCommand('insertText', false, text);
                  return true;
                }
              }
              return false;
            })();
          `
        });

        const success = results?.[0] === true;
        resolve(success);

      } catch (err) {
        console.error('[OrderSync] Tab injection failed:', err);
        resolve(false);
      }
    });
  }

  /**
   * Format product message for WhatsApp
   */
  function formatProductMessage(product: { name: string; price: number; sku: string }, link: string): string {
    return `Hi! I'd like to order:\n\n${product.name}\nPrice: $${product.price.toFixed(2)}\n\n${link}`;
  }

  // Expose global API
  (window as any).OrderSyncReply = {
    inject: injectReply,
    injectToTab: injectToActiveTab,
    getCurrentText,
    formatMessage: formatProductMessage,
    findInput: findInputElement
  };

  console.log('[OrderSync] Reply Injection initialized');
})();

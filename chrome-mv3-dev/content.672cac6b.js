(function(define){var __define; typeof define === "function" && (__define=define,define=null);
// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

(function (modules, entry, mainEntry, parcelRequireName, globalName) {
  /* eslint-disable no-undef */
  var globalObject =
    typeof globalThis !== 'undefined'
      ? globalThis
      : typeof self !== 'undefined'
      ? self
      : typeof window !== 'undefined'
      ? window
      : typeof global !== 'undefined'
      ? global
      : {};
  /* eslint-enable no-undef */

  // Save the require from previous bundle to this closure if any
  var previousRequire =
    typeof globalObject[parcelRequireName] === 'function' &&
    globalObject[parcelRequireName];

  var cache = previousRequire.cache || {};
  // Do not use `require` to prevent Webpack from trying to bundle this call
  var nodeRequire =
    typeof module !== 'undefined' &&
    typeof module.require === 'function' &&
    module.require.bind(module);

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire =
          typeof globalObject[parcelRequireName] === 'function' &&
          globalObject[parcelRequireName];
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error("Cannot find module '" + name + "'");
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = (cache[name] = new newRequire.Module(name));

      modules[name][0].call(
        module.exports,
        localRequire,
        module,
        module.exports,
        this
      );
    }

    return cache[name].exports;

    function localRequire(x) {
      var res = localRequire.resolve(x);
      return res === false ? {} : newRequire(res);
    }

    function resolve(x) {
      var id = modules[name][1][x];
      return id != null ? id : x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [
      function (require, module) {
        module.exports = exports;
      },
      {},
    ];
  };

  Object.defineProperty(newRequire, 'root', {
    get: function () {
      return globalObject[parcelRequireName];
    },
  });

  globalObject[parcelRequireName] = newRequire;

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  if (mainEntry) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(mainEntry);

    // CommonJS
    if (typeof exports === 'object' && typeof module !== 'undefined') {
      module.exports = mainExports;

      // RequireJS
    } else if (typeof define === 'function' && define.amd) {
      define(function () {
        return mainExports;
      });

      // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }
})({"c3KG6":[function(require,module,exports) {
var d = globalThis.process?.argv || [];
var y = ()=>globalThis.process?.env || {};
var H = new Set(d), _ = (e)=>H.has(e), G = d.filter((e)=>e.startsWith("--") && e.includes("=")).map((e)=>e.split("=")).reduce((e, [t, o])=>(e[t] = o, e), {});
var Z = _("--dry-run"), p = ()=>_("--verbose") || y().VERBOSE === "true", q = p();
var u = (e = "", ...t)=>console.log(e.padEnd(9), "|", ...t);
var x = (...e)=>console.error("\uD83D\uDD34 ERROR".padEnd(9), "|", ...e), v = (...e)=>u("\uD83D\uDD35 INFO", ...e), m = (...e)=>u("\uD83D\uDFE0 WARN", ...e), S = 0, c = (...e)=>p() && u(`\u{1F7E1} ${S++}`, ...e);
var n = {
    "isContentScript": true,
    "isBackground": false,
    "isReact": false,
    "runtimes": [
        "script-runtime"
    ],
    "host": "localhost",
    "port": 1815,
    "entryFilePath": "C:\\ORDER SYNC\\content.ts",
    "bundleId": "3716c965672cac6b",
    "envHash": "e792fbbdaa78ee84",
    "verbose": "false",
    "secure": false,
    "serverPort": 1012
};
module.bundle.HMR_BUNDLE_ID = n.bundleId;
globalThis.process = {
    argv: [],
    env: {
        VERBOSE: n.verbose
    }
};
var D = module.bundle.Module;
function I(e) {
    D.call(this, e), this.hot = {
        data: module.bundle.hotData[e],
        _acceptCallbacks: [],
        _disposeCallbacks: [],
        accept: function(t) {
            this._acceptCallbacks.push(t || function() {});
        },
        dispose: function(t) {
            this._disposeCallbacks.push(t);
        }
    }, module.bundle.hotData[e] = void 0;
}
module.bundle.Module = I;
module.bundle.hotData = {};
var l = globalThis.browser || globalThis.chrome || null;
function b() {
    return !n.host || n.host === "0.0.0.0" ? "localhost" : n.host;
}
function C() {
    return n.port || location.port;
}
var E = "__plasmo_runtime_script_";
function L(e, t) {
    let { modules: o } = e;
    return o ? !!o[t] : !1;
}
function O(e = C()) {
    let t = b();
    return `${n.secure || location.protocol === "https:" && !/localhost|127.0.0.1|0.0.0.0/.test(t) ? "wss" : "ws"}://${t}:${e}/`;
}
function B(e) {
    typeof e.message == "string" && x("[plasmo/parcel-runtime]: " + e.message);
}
function P(e) {
    if (typeof globalThis.WebSocket > "u") return;
    let t = new WebSocket(O());
    return t.addEventListener("message", async function(o) {
        let r = JSON.parse(o.data);
        if (r.type === "update" && await e(r.assets), r.type === "error") for (let a of r.diagnostics.ansi){
            let w = a.codeframe || a.stack;
            m("[plasmo/parcel-runtime]: " + a.message + `
` + w + `

` + a.hints.join(`
`));
        }
    }), t.addEventListener("error", B), t.addEventListener("open", ()=>{
        v(`[plasmo/parcel-runtime]: Connected to HMR server for ${n.entryFilePath}`);
    }), t.addEventListener("close", ()=>{
        m(`[plasmo/parcel-runtime]: Connection to the HMR server is closed for ${n.entryFilePath}`);
    }), t;
}
var s = "__plasmo-loading__";
function $() {
    let e = globalThis.window?.trustedTypes;
    if (typeof e > "u") return;
    let t = document.querySelector('meta[name="trusted-types"]')?.content?.split(" "), o = t ? t[t?.length - 1].replace(/;/g, "") : void 0;
    return typeof e < "u" ? e.createPolicy(o || `trusted-html-${s}`, {
        createHTML: (a)=>a
    }) : void 0;
}
var T = $();
function g() {
    return document.getElementById(s);
}
function f() {
    return !g();
}
function F() {
    let e = document.createElement("div");
    e.id = s;
    let t = `
  <style>
    #${s} {
      background: #f3f3f3;
      color: #333;
      border: 1px solid #333;
      box-shadow: #333 4.7px 4.7px;
    }

    #${s}:hover {
      background: #e3e3e3;
      color: #444;
    }

    @keyframes plasmo-loading-animate-svg-fill {
      0% {
        fill: transparent;
      }
    
      100% {
        fill: #333;
      }
    }

    #${s} .svg-elem-1 {
      animation: plasmo-loading-animate-svg-fill 1.47s cubic-bezier(0.47, 0, 0.745, 0.715) 0.8s both infinite;
    }

    #${s} .svg-elem-2 {
      animation: plasmo-loading-animate-svg-fill 1.47s cubic-bezier(0.47, 0, 0.745, 0.715) 0.9s both infinite;
    }
    
    #${s} .svg-elem-3 {
      animation: plasmo-loading-animate-svg-fill 1.47s cubic-bezier(0.47, 0, 0.745, 0.715) 1s both infinite;
    }

    #${s} .hidden {
      display: none;
    }

  </style>
  
  <svg height="32" width="32" viewBox="0 0 264 354" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M139.221 282.243C154.252 282.243 166.903 294.849 161.338 308.812C159.489 313.454 157.15 317.913 154.347 322.109C146.464 333.909 135.26 343.107 122.151 348.538C109.043 353.969 94.6182 355.39 80.7022 352.621C66.7861 349.852 54.0034 343.018 43.9705 332.983C33.9375 322.947 27.105 310.162 24.3369 296.242C21.5689 282.323 22.9895 267.895 28.4193 254.783C33.8491 241.671 43.0441 230.464 54.8416 222.579C59.0353 219.777 63.4908 217.438 68.1295 215.588C82.0915 210.021 94.6978 222.671 94.6978 237.703L94.6978 255.027C94.6978 270.058 106.883 282.243 121.914 282.243H139.221Z" fill="#333" class="svg-elem-1" ></path>
    <path d="M192.261 142.028C192.261 126.996 204.867 114.346 218.829 119.913C223.468 121.763 227.923 124.102 232.117 126.904C243.915 134.789 253.11 145.996 258.539 159.108C263.969 172.22 265.39 186.648 262.622 200.567C259.854 214.487 253.021 227.272 242.988 237.308C232.955 247.343 220.173 254.177 206.256 256.946C192.34 259.715 177.916 258.294 164.807 252.863C151.699 247.432 140.495 238.234 132.612 226.434C129.808 222.238 127.47 217.779 125.62 213.137C120.056 199.174 132.707 186.568 147.738 186.568L165.044 186.568C180.076 186.568 192.261 174.383 192.261 159.352L192.261 142.028Z" fill="#333" class="svg-elem-2" ></path>
    <path d="M95.6522 164.135C95.6522 179.167 83.2279 191.725 68.8013 187.505C59.5145 184.788 50.6432 180.663 42.5106 175.227C26.7806 164.714 14.5206 149.772 7.28089 132.289C0.041183 114.807 -1.85305 95.5697 1.83772 77.0104C5.52849 58.4511 14.6385 41.4033 28.0157 28.0228C41.393 14.6423 58.4366 5.53006 76.9914 1.83839C95.5461 -1.85329 114.779 0.0414162 132.257 7.2829C149.735 14.5244 164.674 26.7874 175.184 42.5212C180.62 50.6576 184.744 59.5332 187.46 68.8245C191.678 83.2519 179.119 95.6759 164.088 95.6759L122.869 95.6759C107.837 95.6759 95.6522 107.861 95.6522 122.892L95.6522 164.135Z" fill="#333" class="svg-elem-3"></path>
  </svg>
  <span class="hidden">Context Invalidated, Press to Reload</span>
  `;
    return e.innerHTML = T ? T.createHTML(t) : t, e.style.pointerEvents = "none", e.style.position = "fixed", e.style.bottom = "14.7px", e.style.right = "14.7px", e.style.fontFamily = "sans-serif", e.style.display = "flex", e.style.justifyContent = "center", e.style.alignItems = "center", e.style.padding = "14.7px", e.style.gap = "14.7px", e.style.borderRadius = "4.7px", e.style.zIndex = "2147483647", e.style.opacity = "0", e.style.transition = "all 0.47s ease-in-out", e;
}
function N(e) {
    return new Promise((t)=>{
        document.documentElement ? (f() && (document.documentElement.appendChild(e), t()), t()) : globalThis.addEventListener("DOMContentLoaded", ()=>{
            f() && document.documentElement.appendChild(e), t();
        });
    });
}
var k = ()=>{
    let e;
    if (f()) {
        let t = F();
        e = N(t);
    }
    return {
        show: async ({ reloadButton: t = !1 } = {})=>{
            await e;
            let o = g();
            o.style.opacity = "1", t && (o.onclick = (r)=>{
                r.stopPropagation(), globalThis.location.reload();
            }, o.querySelector("span").classList.remove("hidden"), o.style.cursor = "pointer", o.style.pointerEvents = "all");
        },
        hide: async ()=>{
            await e;
            let t = g();
            t.style.opacity = "0";
        }
    };
};
var W = `${E}${module.id}__`, i, A = !1, M = k();
async function h() {
    c("Script Runtime - reloading"), A ? globalThis.location?.reload?.() : M.show({
        reloadButton: !0
    });
}
function R() {
    i?.disconnect(), i = l?.runtime.connect({
        name: W
    }), i.onDisconnect.addListener(()=>{
        h();
    }), i.onMessage.addListener((e)=>{
        e.__plasmo_cs_reload__ && h(), e.__plasmo_cs_active_tab__ && (A = !0);
    });
}
function j() {
    if (l?.runtime) try {
        R(), setInterval(R, 24e3);
    } catch  {
        return;
    }
}
j();
P(async (e)=>{
    c("Script runtime - on updated assets"), e.filter((o)=>o.envHash === n.envHash).some((o)=>L(module.bundle, o.id)) && (M.show(), l?.runtime ? i.postMessage({
        __plasmo_cs_changed__: !0
    }) : setTimeout(()=>{
        h();
    }, 4700));
});

},{}],"71ecL":[function(require,module,exports) {
/**
 * Order Sync Agent - Ghost-Reader (Content Script)
 * CRITICAL: This must work before popup.tsx can function
 * 
 * Bottom-Up Build Priority:
 * 1. This content script captures Messenger DOM data
 * 2. Saves to chrome.storage.session
 * 3. popup.tsx reads from storage
 */ var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "config", ()=>config);
const config = {
    matches: [
        "https://www.messenger.com/*",
        "https://messenger.com/*"
    ],
    run_at: "document_idle",
    all_frames: false
};
// Constants
const MAX_MESSAGES = 20;
const STORAGE_KEY = "lastConversation";
// Multiple selectors to try (Messenger changes these frequently)
const MESSAGE_SELECTORS = [
    '[role="presentation"] [dir="auto"]',
    '[data-testid="message_text"]',
    'div[dir="auto"][class*="message"]',
    '[data-scope="messages_table"] span'
];
// Seller detection selectors
const SELLER_SELECTORS = [
    '[data-testid="outgoing_message"]',
    ".__fb-dark-mode",
    '[class*="outgoing"]',
    '[data-testid="message_container"][class*="sent"]'
];
/**
 * Try multiple selectors to find message nodes
 */ function findMessageNodes() {
    for (const selector of MESSAGE_SELECTORS)try {
        const nodes = document.querySelectorAll(selector);
        if (nodes.length > 0) {
            console.log(`[Ghost-Reader] Found ${nodes.length} messages with selector: ${selector}`);
            return nodes;
        }
    } catch (e) {
        console.warn(`[Ghost-Reader] Selector failed: ${selector}`, e);
    }
    return null;
}
/**
 * Check if a message node is from the seller (outgoing)
 */ function isSellerMessage(node) {
    for (const selector of SELLER_SELECTORS)try {
        if (node.closest(selector) !== null) return true;
    } catch (e) {
    // Ignore invalid selectors
    }
    return false;
}
/**
 * Extract text content from a message node
 */ function extractMessageText(node) {
    // Try innerText first (visible text)
    const text = node.innerText?.trim();
    if (text) return text;
    // Fallback to textContent
    return node.textContent?.trim() || "";
}
/**
 * Main function: Capture messages and save to storage
 */ const updateBuffer = ()=>{
    try {
        const messageNodes = findMessageNodes();
        if (!messageNodes || messageNodes.length === 0) {
            console.log("[Ghost-Reader] No messages found yet...");
            return;
        }
        // Convert nodes to message objects
        const messages = Array.from(messageNodes).slice(-MAX_MESSAGES) // Keep only last N messages
        .map((node, index)=>{
            const text = extractMessageText(node);
            const isSeller = isSellerMessage(node);
            return {
                text,
                isSeller,
                timestamp: Date.now() - (messageNodes.length - index) * 1000
            };
        }).filter((msg)=>msg.text.length > 0); // Remove empty messages
        if (messages.length === 0) {
            console.log("[Ghost-Reader] No valid message text extracted");
            return;
        }
        // Save to chrome.storage.session
        chrome.storage.session.set({
            [STORAGE_KEY]: messages
        }, ()=>{
            if (chrome.runtime.lastError) console.error("[Ghost-Reader] Storage error:", chrome.runtime.lastError);
            else {
                console.log(`[Ghost-Reader] \u2705 Saved ${messages.length} messages to storage`);
                console.log("[Ghost-Reader] Latest:", messages[messages.length - 1]?.text.substring(0, 50) + "...");
            }
        });
    } catch (error) {
        console.error("[Ghost-Reader] Error in updateBuffer:", error);
    }
};
/**
 * MutationObserver - watches for new messages
 */ const observer = new MutationObserver((mutations)=>{
    // Check if any mutation added nodes
    const hasNewNodes = mutations.some((mutation)=>mutation.addedNodes.length > 0);
    if (hasNewNodes) {
        // Debounce: wait a bit for DOM to settle
        clearTimeout(window._ghostReaderTimeout);
        window._ghostReaderTimeout = setTimeout(updateBuffer, 100);
    }
});
/**
 * Initialize the Ghost-Reader
 */ const initGhostReader = ()=>{
    console.log("\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557");
    console.log("\u2551   Order Sync: Ghost-Reader v1.0       \u2551");
    console.log("\u2551   Bottom-Up Build: Content Script     \u2551");
    console.log("\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255d");
    console.log("[Ghost-Reader] Initializing on:", window.location.href);
    // Verify chrome APIs are available
    if (typeof chrome === "undefined" || !chrome.storage) {
        console.error("[Ghost-Reader] \u274c Chrome APIs not available!");
        return;
    }
    // Start observing the entire document body
    const targetNode = document.body;
    const config = {
        childList: true,
        subtree: true,
        characterData: true,
        characterDataOldValue: false
    };
    try {
        observer.observe(targetNode, config);
        console.log("[Ghost-Reader] \u2705 MutationObserver started");
    } catch (e) {
        console.error("[Ghost-Reader] \u274c Failed to start observer:", e);
        return;
    }
    // Initial scrape after a short delay (let Messenger load)
    setTimeout(()=>{
        console.log("[Ghost-Reader] Running initial scrape...");
        updateBuffer();
    }, 2000);
    // Periodically update to catch any missed messages
    setInterval(updateBuffer, 5000);
};
/**
 * Handle messages from popup/background
 */ chrome.runtime.onMessage.addListener((request, sender, sendResponse)=>{
    if (request.action === "getMessages") {
        chrome.storage.session.get([
            STORAGE_KEY
        ], (data)=>{
            sendResponse({
                messages: data[STORAGE_KEY] || []
            });
        });
        return true; // Keep channel open for async
    }
    if (request.action === "forceUpdate") {
        updateBuffer();
        sendResponse({
            status: "updated"
        });
    }
});
// Start on window load
if (document.readyState === "loading") window.addEventListener("load", initGhostReader);
else // DOM already loaded
initGhostReader();
// Also re-initialize on URL changes (SPA navigation)
let lastUrl = location.href;
new MutationObserver(()=>{
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        console.log("[Ghost-Reader] URL changed, reinitializing...");
        setTimeout(initGhostReader, 1000);
    }
}).observe(document, {
    subtree: true,
    childList: true
});
console.log("[Ghost-Reader] Script loaded, waiting for window.load...");

},{"@parcel/transformer-js/src/esmodule-helpers.js":"boKlo"}],"boKlo":[function(require,module,exports) {
exports.interopDefault = function(a) {
    return a && a.__esModule ? a : {
        default: a
    };
};
exports.defineInteropFlag = function(a) {
    Object.defineProperty(a, "__esModule", {
        value: true
    });
};
exports.exportAll = function(source, dest) {
    Object.keys(source).forEach(function(key) {
        if (key === "default" || key === "__esModule" || dest.hasOwnProperty(key)) return;
        Object.defineProperty(dest, key, {
            enumerable: true,
            get: function() {
                return source[key];
            }
        });
    });
    return dest;
};
exports.export = function(dest, destName, get) {
    Object.defineProperty(dest, destName, {
        enumerable: true,
        get: get
    });
};

},{}]},["c3KG6","71ecL"], "71ecL", "parcelRequiref9bf")

//# sourceMappingURL=data:application/json;charset=utf-8;base64,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LFdBQ3hCLE9BQU8saUJBQWlCLFFBQVE7S0FFaEMscUJBQXFCO0FBQ3JCO0FBR0oscURBQXFEO0FBQ3JELElBQUksVUFBVSxTQUFTO0FBQ3ZCLElBQUksaUJBQWlCO0lBQ2pCLE1BQU0sTUFBTSxTQUFTO0lBQ3JCLElBQUksUUFBUSxTQUFTO1FBQ2pCLFVBQVU7UUFDVixRQUFRLElBQUk7UUFDWixXQUFXLGlCQUFpQjtJQUNoQztBQUNKLEdBQUcsUUFBUSxVQUFVO0lBQUUsU0FBUztJQUFNLFdBQVc7QUFBSztBQUV0RCxRQUFRLElBQUk7OztBQ3ZPWixRQUFRLGlCQUFpQixTQUFVLENBQUM7SUFDbEMsT0FBTyxLQUFLLEVBQUUsYUFBYSxJQUFJO1FBQUMsU0FBUztJQUFDO0FBQzVDO0FBRUEsUUFBUSxvQkFBb0IsU0FBVSxDQUFDO0lBQ3JDLE9BQU8sZUFBZSxHQUFHLGNBQWM7UUFBQyxPQUFPO0lBQUk7QUFDckQ7QUFFQSxRQUFRLFlBQVksU0FBVSxNQUFNLEVBQUUsSUFBSTtJQUN4QyxPQUFPLEtBQUssUUFBUSxRQUFRLFNBQVUsR0FBRztRQUN2QyxJQUFJLFFBQVEsYUFBYSxRQUFRLGdCQUFnQixLQUFLLGVBQWUsTUFDbkU7UUFHRixPQUFPLGVBQWUsTUFBTSxLQUFLO1lBQy9CLFlBQVk7WUFDWixLQUFLO2dCQUNILE9BQU8sTUFBTSxDQUFDLElBQUk7WUFDcEI7UUFDRjtJQUNGO0lBRUEsT0FBTztBQUNUO0FBRUEsUUFBUSxTQUFTLFNBQVUsSUFBSSxFQUFFLFFBQVEsRUFBRSxHQUFHO0lBQzVDLE9BQU8sZUFBZSxNQUFNLFVBQVU7UUFDcEMsWUFBWTtRQUNaLEtBQUs7SUFDUDtBQUNGIiwic291cmNlcyI6WyJub2RlX21vZHVsZXMvQHBsYXNtb2hxL3BhcmNlbC1ydW50aW1lL2Rpc3QvcnVudGltZS0zZjIwOWFmZDIwOTRkZTYyLmpzIiwiY29udGVudC50cyIsIm5vZGVfbW9kdWxlcy9AcGFyY2VsL3RyYW5zZm9ybWVyLWpzL3NyYy9lc21vZHVsZS1oZWxwZXJzLmpzIl0sInNvdXJjZXNDb250ZW50IjpbInZhciBkPWdsb2JhbFRoaXMucHJvY2Vzcz8uYXJndnx8W107dmFyIHk9KCk9Pmdsb2JhbFRoaXMucHJvY2Vzcz8uZW52fHx7fTt2YXIgSD1uZXcgU2V0KGQpLF89ZT0+SC5oYXMoZSksRz1kLmZpbHRlcihlPT5lLnN0YXJ0c1dpdGgoXCItLVwiKSYmZS5pbmNsdWRlcyhcIj1cIikpLm1hcChlPT5lLnNwbGl0KFwiPVwiKSkucmVkdWNlKChlLFt0LG9dKT0+KGVbdF09byxlKSx7fSk7dmFyIFo9XyhcIi0tZHJ5LXJ1blwiKSxwPSgpPT5fKFwiLS12ZXJib3NlXCIpfHx5KCkuVkVSQk9TRT09PVwidHJ1ZVwiLHE9cCgpO3ZhciB1PShlPVwiXCIsLi4udCk9PmNvbnNvbGUubG9nKGUucGFkRW5kKDkpLFwifFwiLC4uLnQpO3ZhciB4PSguLi5lKT0+Y29uc29sZS5lcnJvcihcIlxcdXsxRjUzNH0gRVJST1JcIi5wYWRFbmQoOSksXCJ8XCIsLi4uZSksdj0oLi4uZSk9PnUoXCJcXHV7MUY1MzV9IElORk9cIiwuLi5lKSxtPSguLi5lKT0+dShcIlxcdXsxRjdFMH0gV0FSTlwiLC4uLmUpLFM9MCxjPSguLi5lKT0+cCgpJiZ1KGBcXHV7MUY3RTF9ICR7UysrfWAsLi4uZSk7dmFyIG49e1wiaXNDb250ZW50U2NyaXB0XCI6dHJ1ZSxcImlzQmFja2dyb3VuZFwiOmZhbHNlLFwiaXNSZWFjdFwiOmZhbHNlLFwicnVudGltZXNcIjpbXCJzY3JpcHQtcnVudGltZVwiXSxcImhvc3RcIjpcImxvY2FsaG9zdFwiLFwicG9ydFwiOjE4MTUsXCJlbnRyeUZpbGVQYXRoXCI6XCJDOlxcXFxPUkRFUiBTWU5DXFxcXGNvbnRlbnQudHNcIixcImJ1bmRsZUlkXCI6XCIzNzE2Yzk2NTY3MmNhYzZiXCIsXCJlbnZIYXNoXCI6XCJlNzkyZmJiZGFhNzhlZTg0XCIsXCJ2ZXJib3NlXCI6XCJmYWxzZVwiLFwic2VjdXJlXCI6ZmFsc2UsXCJzZXJ2ZXJQb3J0XCI6MTAxMn07bW9kdWxlLmJ1bmRsZS5ITVJfQlVORExFX0lEPW4uYnVuZGxlSWQ7Z2xvYmFsVGhpcy5wcm9jZXNzPXthcmd2OltdLGVudjp7VkVSQk9TRTpuLnZlcmJvc2V9fTt2YXIgRD1tb2R1bGUuYnVuZGxlLk1vZHVsZTtmdW5jdGlvbiBJKGUpe0QuY2FsbCh0aGlzLGUpLHRoaXMuaG90PXtkYXRhOm1vZHVsZS5idW5kbGUuaG90RGF0YVtlXSxfYWNjZXB0Q2FsbGJhY2tzOltdLF9kaXNwb3NlQ2FsbGJhY2tzOltdLGFjY2VwdDpmdW5jdGlvbih0KXt0aGlzLl9hY2NlcHRDYWxsYmFja3MucHVzaCh0fHxmdW5jdGlvbigpe30pfSxkaXNwb3NlOmZ1bmN0aW9uKHQpe3RoaXMuX2Rpc3Bvc2VDYWxsYmFja3MucHVzaCh0KX19LG1vZHVsZS5idW5kbGUuaG90RGF0YVtlXT12b2lkIDB9bW9kdWxlLmJ1bmRsZS5Nb2R1bGU9STttb2R1bGUuYnVuZGxlLmhvdERhdGE9e307dmFyIGw9Z2xvYmFsVGhpcy5icm93c2VyfHxnbG9iYWxUaGlzLmNocm9tZXx8bnVsbDtmdW5jdGlvbiBiKCl7cmV0dXJuIW4uaG9zdHx8bi5ob3N0PT09XCIwLjAuMC4wXCI/XCJsb2NhbGhvc3RcIjpuLmhvc3R9ZnVuY3Rpb24gQygpe3JldHVybiBuLnBvcnR8fGxvY2F0aW9uLnBvcnR9dmFyIEU9XCJfX3BsYXNtb19ydW50aW1lX3NjcmlwdF9cIjtmdW5jdGlvbiBMKGUsdCl7bGV0e21vZHVsZXM6b309ZTtyZXR1cm4gbz8hIW9bdF06ITF9ZnVuY3Rpb24gTyhlPUMoKSl7bGV0IHQ9YigpO3JldHVybmAke24uc2VjdXJlfHxsb2NhdGlvbi5wcm90b2NvbD09PVwiaHR0cHM6XCImJiEvbG9jYWxob3N0fDEyNy4wLjAuMXwwLjAuMC4wLy50ZXN0KHQpP1wid3NzXCI6XCJ3c1wifTovLyR7dH06JHtlfS9gfWZ1bmN0aW9uIEIoZSl7dHlwZW9mIGUubWVzc2FnZT09XCJzdHJpbmdcIiYmeChcIltwbGFzbW8vcGFyY2VsLXJ1bnRpbWVdOiBcIitlLm1lc3NhZ2UpfWZ1bmN0aW9uIFAoZSl7aWYodHlwZW9mIGdsb2JhbFRoaXMuV2ViU29ja2V0PlwidVwiKXJldHVybjtsZXQgdD1uZXcgV2ViU29ja2V0KE8oKSk7cmV0dXJuIHQuYWRkRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIixhc3luYyBmdW5jdGlvbihvKXtsZXQgcj1KU09OLnBhcnNlKG8uZGF0YSk7aWYoci50eXBlPT09XCJ1cGRhdGVcIiYmYXdhaXQgZShyLmFzc2V0cyksci50eXBlPT09XCJlcnJvclwiKWZvcihsZXQgYSBvZiByLmRpYWdub3N0aWNzLmFuc2kpe2xldCB3PWEuY29kZWZyYW1lfHxhLnN0YWNrO20oXCJbcGxhc21vL3BhcmNlbC1ydW50aW1lXTogXCIrYS5tZXNzYWdlK2BcbmArdytgXG5cbmArYS5oaW50cy5qb2luKGBcbmApKX19KSx0LmFkZEV2ZW50TGlzdGVuZXIoXCJlcnJvclwiLEIpLHQuYWRkRXZlbnRMaXN0ZW5lcihcIm9wZW5cIiwoKT0+e3YoYFtwbGFzbW8vcGFyY2VsLXJ1bnRpbWVdOiBDb25uZWN0ZWQgdG8gSE1SIHNlcnZlciBmb3IgJHtuLmVudHJ5RmlsZVBhdGh9YCl9KSx0LmFkZEV2ZW50TGlzdGVuZXIoXCJjbG9zZVwiLCgpPT57bShgW3BsYXNtby9wYXJjZWwtcnVudGltZV06IENvbm5lY3Rpb24gdG8gdGhlIEhNUiBzZXJ2ZXIgaXMgY2xvc2VkIGZvciAke24uZW50cnlGaWxlUGF0aH1gKX0pLHR9dmFyIHM9XCJfX3BsYXNtby1sb2FkaW5nX19cIjtmdW5jdGlvbiAkKCl7bGV0IGU9Z2xvYmFsVGhpcy53aW5kb3c/LnRydXN0ZWRUeXBlcztpZih0eXBlb2YgZT5cInVcIilyZXR1cm47bGV0IHQ9ZG9jdW1lbnQucXVlcnlTZWxlY3RvcignbWV0YVtuYW1lPVwidHJ1c3RlZC10eXBlc1wiXScpPy5jb250ZW50Py5zcGxpdChcIiBcIiksbz10P3RbdD8ubGVuZ3RoLTFdLnJlcGxhY2UoLzsvZyxcIlwiKTp2b2lkIDA7cmV0dXJuIHR5cGVvZiBlPFwidVwiP2UuY3JlYXRlUG9saWN5KG98fGB0cnVzdGVkLWh0bWwtJHtzfWAse2NyZWF0ZUhUTUw6YT0+YX0pOnZvaWQgMH12YXIgVD0kKCk7ZnVuY3Rpb24gZygpe3JldHVybiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChzKX1mdW5jdGlvbiBmKCl7cmV0dXJuIWcoKX1mdW5jdGlvbiBGKCl7bGV0IGU9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtlLmlkPXM7bGV0IHQ9YFxuICA8c3R5bGU+XG4gICAgIyR7c30ge1xuICAgICAgYmFja2dyb3VuZDogI2YzZjNmMztcbiAgICAgIGNvbG9yOiAjMzMzO1xuICAgICAgYm9yZGVyOiAxcHggc29saWQgIzMzMztcbiAgICAgIGJveC1zaGFkb3c6ICMzMzMgNC43cHggNC43cHg7XG4gICAgfVxuXG4gICAgIyR7c306aG92ZXIge1xuICAgICAgYmFja2dyb3VuZDogI2UzZTNlMztcbiAgICAgIGNvbG9yOiAjNDQ0O1xuICAgIH1cblxuICAgIEBrZXlmcmFtZXMgcGxhc21vLWxvYWRpbmctYW5pbWF0ZS1zdmctZmlsbCB7XG4gICAgICAwJSB7XG4gICAgICAgIGZpbGw6IHRyYW5zcGFyZW50O1xuICAgICAgfVxuICAgIFxuICAgICAgMTAwJSB7XG4gICAgICAgIGZpbGw6ICMzMzM7XG4gICAgICB9XG4gICAgfVxuXG4gICAgIyR7c30gLnN2Zy1lbGVtLTEge1xuICAgICAgYW5pbWF0aW9uOiBwbGFzbW8tbG9hZGluZy1hbmltYXRlLXN2Zy1maWxsIDEuNDdzIGN1YmljLWJlemllcigwLjQ3LCAwLCAwLjc0NSwgMC43MTUpIDAuOHMgYm90aCBpbmZpbml0ZTtcbiAgICB9XG5cbiAgICAjJHtzfSAuc3ZnLWVsZW0tMiB7XG4gICAgICBhbmltYXRpb246IHBsYXNtby1sb2FkaW5nLWFuaW1hdGUtc3ZnLWZpbGwgMS40N3MgY3ViaWMtYmV6aWVyKDAuNDcsIDAsIDAuNzQ1LCAwLjcxNSkgMC45cyBib3RoIGluZmluaXRlO1xuICAgIH1cbiAgICBcbiAgICAjJHtzfSAuc3ZnLWVsZW0tMyB7XG4gICAgICBhbmltYXRpb246IHBsYXNtby1sb2FkaW5nLWFuaW1hdGUtc3ZnLWZpbGwgMS40N3MgY3ViaWMtYmV6aWVyKDAuNDcsIDAsIDAuNzQ1LCAwLjcxNSkgMXMgYm90aCBpbmZpbml0ZTtcbiAgICB9XG5cbiAgICAjJHtzfSAuaGlkZGVuIHtcbiAgICAgIGRpc3BsYXk6IG5vbmU7XG4gICAgfVxuXG4gIDwvc3R5bGU+XG4gIFxuICA8c3ZnIGhlaWdodD1cIjMyXCIgd2lkdGg9XCIzMlwiIHZpZXdCb3g9XCIwIDAgMjY0IDM1NFwiIGZpbGw9XCJub25lXCIgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiPlxuICAgIDxwYXRoIGQ9XCJNMTM5LjIyMSAyODIuMjQzQzE1NC4yNTIgMjgyLjI0MyAxNjYuOTAzIDI5NC44NDkgMTYxLjMzOCAzMDguODEyQzE1OS40ODkgMzEzLjQ1NCAxNTcuMTUgMzE3LjkxMyAxNTQuMzQ3IDMyMi4xMDlDMTQ2LjQ2NCAzMzMuOTA5IDEzNS4yNiAzNDMuMTA3IDEyMi4xNTEgMzQ4LjUzOEMxMDkuMDQzIDM1My45NjkgOTQuNjE4MiAzNTUuMzkgODAuNzAyMiAzNTIuNjIxQzY2Ljc4NjEgMzQ5Ljg1MiA1NC4wMDM0IDM0My4wMTggNDMuOTcwNSAzMzIuOTgzQzMzLjkzNzUgMzIyLjk0NyAyNy4xMDUgMzEwLjE2MiAyNC4zMzY5IDI5Ni4yNDJDMjEuNTY4OSAyODIuMzIzIDIyLjk4OTUgMjY3Ljg5NSAyOC40MTkzIDI1NC43ODNDMzMuODQ5MSAyNDEuNjcxIDQzLjA0NDEgMjMwLjQ2NCA1NC44NDE2IDIyMi41NzlDNTkuMDM1MyAyMTkuNzc3IDYzLjQ5MDggMjE3LjQzOCA2OC4xMjk1IDIxNS41ODhDODIuMDkxNSAyMTAuMDIxIDk0LjY5NzggMjIyLjY3MSA5NC42OTc4IDIzNy43MDNMOTQuNjk3OCAyNTUuMDI3Qzk0LjY5NzggMjcwLjA1OCAxMDYuODgzIDI4Mi4yNDMgMTIxLjkxNCAyODIuMjQzSDEzOS4yMjFaXCIgZmlsbD1cIiMzMzNcIiBjbGFzcz1cInN2Zy1lbGVtLTFcIiA+PC9wYXRoPlxuICAgIDxwYXRoIGQ9XCJNMTkyLjI2MSAxNDIuMDI4QzE5Mi4yNjEgMTI2Ljk5NiAyMDQuODY3IDExNC4zNDYgMjE4LjgyOSAxMTkuOTEzQzIyMy40NjggMTIxLjc2MyAyMjcuOTIzIDEyNC4xMDIgMjMyLjExNyAxMjYuOTA0QzI0My45MTUgMTM0Ljc4OSAyNTMuMTEgMTQ1Ljk5NiAyNTguNTM5IDE1OS4xMDhDMjYzLjk2OSAxNzIuMjIgMjY1LjM5IDE4Ni42NDggMjYyLjYyMiAyMDAuNTY3QzI1OS44NTQgMjE0LjQ4NyAyNTMuMDIxIDIyNy4yNzIgMjQyLjk4OCAyMzcuMzA4QzIzMi45NTUgMjQ3LjM0MyAyMjAuMTczIDI1NC4xNzcgMjA2LjI1NiAyNTYuOTQ2QzE5Mi4zNCAyNTkuNzE1IDE3Ny45MTYgMjU4LjI5NCAxNjQuODA3IDI1Mi44NjNDMTUxLjY5OSAyNDcuNDMyIDE0MC40OTUgMjM4LjIzNCAxMzIuNjEyIDIyNi40MzRDMTI5LjgwOCAyMjIuMjM4IDEyNy40NyAyMTcuNzc5IDEyNS42MiAyMTMuMTM3QzEyMC4wNTYgMTk5LjE3NCAxMzIuNzA3IDE4Ni41NjggMTQ3LjczOCAxODYuNTY4TDE2NS4wNDQgMTg2LjU2OEMxODAuMDc2IDE4Ni41NjggMTkyLjI2MSAxNzQuMzgzIDE5Mi4yNjEgMTU5LjM1MkwxOTIuMjYxIDE0Mi4wMjhaXCIgZmlsbD1cIiMzMzNcIiBjbGFzcz1cInN2Zy1lbGVtLTJcIiA+PC9wYXRoPlxuICAgIDxwYXRoIGQ9XCJNOTUuNjUyMiAxNjQuMTM1Qzk1LjY1MjIgMTc5LjE2NyA4My4yMjc5IDE5MS43MjUgNjguODAxMyAxODcuNTA1QzU5LjUxNDUgMTg0Ljc4OCA1MC42NDMyIDE4MC42NjMgNDIuNTEwNiAxNzUuMjI3QzI2Ljc4MDYgMTY0LjcxNCAxNC41MjA2IDE0OS43NzIgNy4yODA4OSAxMzIuMjg5QzAuMDQxMTgzIDExNC44MDcgLTEuODUzMDUgOTUuNTY5NyAxLjgzNzcyIDc3LjAxMDRDNS41Mjg0OSA1OC40NTExIDE0LjYzODUgNDEuNDAzMyAyOC4wMTU3IDI4LjAyMjhDNDEuMzkzIDE0LjY0MjMgNTguNDM2NiA1LjUzMDA2IDc2Ljk5MTQgMS44MzgzOUM5NS41NDYxIC0xLjg1MzI5IDExNC43NzkgMC4wNDE0MTYyIDEzMi4yNTcgNy4yODI5QzE0OS43MzUgMTQuNTI0NCAxNjQuNjc0IDI2Ljc4NzQgMTc1LjE4NCA0Mi41MjEyQzE4MC42MiA1MC42NTc2IDE4NC43NDQgNTkuNTMzMiAxODcuNDYgNjguODI0NUMxOTEuNjc4IDgzLjI1MTkgMTc5LjExOSA5NS42NzU5IDE2NC4wODggOTUuNjc1OUwxMjIuODY5IDk1LjY3NTlDMTA3LjgzNyA5NS42NzU5IDk1LjY1MjIgMTA3Ljg2MSA5NS42NTIyIDEyMi44OTJMOTUuNjUyMiAxNjQuMTM1WlwiIGZpbGw9XCIjMzMzXCIgY2xhc3M9XCJzdmctZWxlbS0zXCI+PC9wYXRoPlxuICA8L3N2Zz5cbiAgPHNwYW4gY2xhc3M9XCJoaWRkZW5cIj5Db250ZXh0IEludmFsaWRhdGVkLCBQcmVzcyB0byBSZWxvYWQ8L3NwYW4+XG4gIGA7cmV0dXJuIGUuaW5uZXJIVE1MPVQ/VC5jcmVhdGVIVE1MKHQpOnQsZS5zdHlsZS5wb2ludGVyRXZlbnRzPVwibm9uZVwiLGUuc3R5bGUucG9zaXRpb249XCJmaXhlZFwiLGUuc3R5bGUuYm90dG9tPVwiMTQuN3B4XCIsZS5zdHlsZS5yaWdodD1cIjE0LjdweFwiLGUuc3R5bGUuZm9udEZhbWlseT1cInNhbnMtc2VyaWZcIixlLnN0eWxlLmRpc3BsYXk9XCJmbGV4XCIsZS5zdHlsZS5qdXN0aWZ5Q29udGVudD1cImNlbnRlclwiLGUuc3R5bGUuYWxpZ25JdGVtcz1cImNlbnRlclwiLGUuc3R5bGUucGFkZGluZz1cIjE0LjdweFwiLGUuc3R5bGUuZ2FwPVwiMTQuN3B4XCIsZS5zdHlsZS5ib3JkZXJSYWRpdXM9XCI0LjdweFwiLGUuc3R5bGUuekluZGV4PVwiMjE0NzQ4MzY0N1wiLGUuc3R5bGUub3BhY2l0eT1cIjBcIixlLnN0eWxlLnRyYW5zaXRpb249XCJhbGwgMC40N3MgZWFzZS1pbi1vdXRcIixlfWZ1bmN0aW9uIE4oZSl7cmV0dXJuIG5ldyBQcm9taXNlKHQ9Pntkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ/KGYoKSYmKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5hcHBlbmRDaGlsZChlKSx0KCkpLHQoKSk6Z2xvYmFsVGhpcy5hZGRFdmVudExpc3RlbmVyKFwiRE9NQ29udGVudExvYWRlZFwiLCgpPT57ZigpJiZkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuYXBwZW5kQ2hpbGQoZSksdCgpfSl9KX12YXIgaz0oKT0+e2xldCBlO2lmKGYoKSl7bGV0IHQ9RigpO2U9Tih0KX1yZXR1cm57c2hvdzphc3luYyh7cmVsb2FkQnV0dG9uOnQ9ITF9PXt9KT0+e2F3YWl0IGU7bGV0IG89ZygpO28uc3R5bGUub3BhY2l0eT1cIjFcIix0JiYoby5vbmNsaWNrPXI9PntyLnN0b3BQcm9wYWdhdGlvbigpLGdsb2JhbFRoaXMubG9jYXRpb24ucmVsb2FkKCl9LG8ucXVlcnlTZWxlY3RvcihcInNwYW5cIikuY2xhc3NMaXN0LnJlbW92ZShcImhpZGRlblwiKSxvLnN0eWxlLmN1cnNvcj1cInBvaW50ZXJcIixvLnN0eWxlLnBvaW50ZXJFdmVudHM9XCJhbGxcIil9LGhpZGU6YXN5bmMoKT0+e2F3YWl0IGU7bGV0IHQ9ZygpO3Quc3R5bGUub3BhY2l0eT1cIjBcIn19fTt2YXIgVz1gJHtFfSR7bW9kdWxlLmlkfV9fYCxpLEE9ITEsTT1rKCk7YXN5bmMgZnVuY3Rpb24gaCgpe2MoXCJTY3JpcHQgUnVudGltZSAtIHJlbG9hZGluZ1wiKSxBP2dsb2JhbFRoaXMubG9jYXRpb24/LnJlbG9hZD8uKCk6TS5zaG93KHtyZWxvYWRCdXR0b246ITB9KX1mdW5jdGlvbiBSKCl7aT8uZGlzY29ubmVjdCgpLGk9bD8ucnVudGltZS5jb25uZWN0KHtuYW1lOld9KSxpLm9uRGlzY29ubmVjdC5hZGRMaXN0ZW5lcigoKT0+e2goKX0pLGkub25NZXNzYWdlLmFkZExpc3RlbmVyKGU9PntlLl9fcGxhc21vX2NzX3JlbG9hZF9fJiZoKCksZS5fX3BsYXNtb19jc19hY3RpdmVfdGFiX18mJihBPSEwKX0pfWZ1bmN0aW9uIGooKXtpZihsPy5ydW50aW1lKXRyeXtSKCksc2V0SW50ZXJ2YWwoUiwyNGUzKX1jYXRjaHtyZXR1cm59fWooKTtQKGFzeW5jIGU9PntjKFwiU2NyaXB0IHJ1bnRpbWUgLSBvbiB1cGRhdGVkIGFzc2V0c1wiKSxlLmZpbHRlcihvPT5vLmVudkhhc2g9PT1uLmVudkhhc2gpLnNvbWUobz0+TChtb2R1bGUuYnVuZGxlLG8uaWQpKSYmKE0uc2hvdygpLGw/LnJ1bnRpbWU/aS5wb3N0TWVzc2FnZSh7X19wbGFzbW9fY3NfY2hhbmdlZF9fOiEwfSk6c2V0VGltZW91dCgoKT0+e2goKX0sNDcwMCkpfSk7XG4iLCIvKipcbiAqIE9yZGVyIFN5bmMgQWdlbnQgLSBHaG9zdC1SZWFkZXIgKENvbnRlbnQgU2NyaXB0KVxuICogQ1JJVElDQUw6IFRoaXMgbXVzdCB3b3JrIGJlZm9yZSBwb3B1cC50c3ggY2FuIGZ1bmN0aW9uXG4gKiBcbiAqIEJvdHRvbS1VcCBCdWlsZCBQcmlvcml0eTpcbiAqIDEuIFRoaXMgY29udGVudCBzY3JpcHQgY2FwdHVyZXMgTWVzc2VuZ2VyIERPTSBkYXRhXG4gKiAyLiBTYXZlcyB0byBjaHJvbWUuc3RvcmFnZS5zZXNzaW9uXG4gKiAzLiBwb3B1cC50c3ggcmVhZHMgZnJvbSBzdG9yYWdlXG4gKi9cblxuaW1wb3J0IHR5cGUgeyBQbGFzbW9DU0NvbmZpZyB9IGZyb20gXCJwbGFzbW9cIlxuXG4vLyBNYW5pZmVzdCBWMyBDb25maWd1cmF0aW9uXG5leHBvcnQgY29uc3QgY29uZmlnOiBQbGFzbW9DU0NvbmZpZyA9IHtcbiAgICBtYXRjaGVzOiBbXCJodHRwczovL3d3dy5tZXNzZW5nZXIuY29tLypcIiwgXCJodHRwczovL21lc3Nlbmdlci5jb20vKlwiXSxcbiAgICBydW5fYXQ6IFwiZG9jdW1lbnRfaWRsZVwiLFxuICAgIGFsbF9mcmFtZXM6IGZhbHNlXG59XG5cbmludGVyZmFjZSBHaG9zdE1lc3NhZ2Uge1xuICAgIHRleHQ6IHN0cmluZztcbiAgICBpc1NlbGxlcjogYm9vbGVhbjtcbiAgICB0aW1lc3RhbXA6IG51bWJlcjtcbn1cblxuLy8gQ29uc3RhbnRzXG5jb25zdCBNQVhfTUVTU0FHRVMgPSAyMDtcbmNvbnN0IFNUT1JBR0VfS0VZID0gJ2xhc3RDb252ZXJzYXRpb24nO1xuXG4vLyBNdWx0aXBsZSBzZWxlY3RvcnMgdG8gdHJ5IChNZXNzZW5nZXIgY2hhbmdlcyB0aGVzZSBmcmVxdWVudGx5KVxuY29uc3QgTUVTU0FHRV9TRUxFQ1RPUlMgPSBbXG4gICAgJ1tyb2xlPVwicHJlc2VudGF0aW9uXCJdIFtkaXI9XCJhdXRvXCJdJywgIC8vIEN1cnJlbnQgcHJpbWFyeVxuICAgICdbZGF0YS10ZXN0aWQ9XCJtZXNzYWdlX3RleHRcIl0nLCAgICAgICAgICAvLyBBbHRlcm5hdGl2ZSB0ZXN0IElEXG4gICAgJ2RpdltkaXI9XCJhdXRvXCJdW2NsYXNzKj1cIm1lc3NhZ2VcIl0nLCAgICAvLyBDbGFzcy1iYXNlZCBmYWxsYmFja1xuICAgICdbZGF0YS1zY29wZT1cIm1lc3NhZ2VzX3RhYmxlXCJdIHNwYW4nLCAgICAgLy8gTGVnYWN5IHNlbGVjdG9yXG5dO1xuXG4vLyBTZWxsZXIgZGV0ZWN0aW9uIHNlbGVjdG9yc1xuY29uc3QgU0VMTEVSX1NFTEVDVE9SUyA9IFtcbiAgICAnW2RhdGEtdGVzdGlkPVwib3V0Z29pbmdfbWVzc2FnZVwiXScsXG4gICAgJy5fX2ZiLWRhcmstbW9kZScsICAvLyBPdXRnb2luZyBtZXNzYWdlcyBvZnRlbiBoYXZlIGRhcmsgbW9kZSBjbGFzc1xuICAgICdbY2xhc3MqPVwib3V0Z29pbmdcIl0nLFxuICAgICdbZGF0YS10ZXN0aWQ9XCJtZXNzYWdlX2NvbnRhaW5lclwiXVtjbGFzcyo9XCJzZW50XCJdJyxcbl07XG5cbi8qKlxuICogVHJ5IG11bHRpcGxlIHNlbGVjdG9ycyB0byBmaW5kIG1lc3NhZ2Ugbm9kZXNcbiAqL1xuZnVuY3Rpb24gZmluZE1lc3NhZ2VOb2RlcygpOiBOb2RlTGlzdE9mPEVsZW1lbnQ+IHwgbnVsbCB7XG4gICAgZm9yIChjb25zdCBzZWxlY3RvciBvZiBNRVNTQUdFX1NFTEVDVE9SUykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3Qgbm9kZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKTtcbiAgICAgICAgICAgIGlmIChub2Rlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFtHaG9zdC1SZWFkZXJdIEZvdW5kICR7bm9kZXMubGVuZ3RofSBtZXNzYWdlcyB3aXRoIHNlbGVjdG9yOiAke3NlbGVjdG9yfWApO1xuICAgICAgICAgICAgICAgIHJldHVybiBub2RlcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGBbR2hvc3QtUmVhZGVyXSBTZWxlY3RvciBmYWlsZWQ6ICR7c2VsZWN0b3J9YCwgZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogQ2hlY2sgaWYgYSBtZXNzYWdlIG5vZGUgaXMgZnJvbSB0aGUgc2VsbGVyIChvdXRnb2luZylcbiAqL1xuZnVuY3Rpb24gaXNTZWxsZXJNZXNzYWdlKG5vZGU6IEVsZW1lbnQpOiBib29sZWFuIHtcbiAgICBmb3IgKGNvbnN0IHNlbGVjdG9yIG9mIFNFTExFUl9TRUxFQ1RPUlMpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmIChub2RlLmNsb3Nlc3Qoc2VsZWN0b3IpICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIC8vIElnbm9yZSBpbnZhbGlkIHNlbGVjdG9yc1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IHRleHQgY29udGVudCBmcm9tIGEgbWVzc2FnZSBub2RlXG4gKi9cbmZ1bmN0aW9uIGV4dHJhY3RNZXNzYWdlVGV4dChub2RlOiBFbGVtZW50KTogc3RyaW5nIHtcbiAgICAvLyBUcnkgaW5uZXJUZXh0IGZpcnN0ICh2aXNpYmxlIHRleHQpXG4gICAgY29uc3QgdGV4dCA9IChub2RlIGFzIEhUTUxFbGVtZW50KS5pbm5lclRleHQ/LnRyaW0oKTtcbiAgICBpZiAodGV4dCkgcmV0dXJuIHRleHQ7XG4gICAgXG4gICAgLy8gRmFsbGJhY2sgdG8gdGV4dENvbnRlbnRcbiAgICByZXR1cm4gbm9kZS50ZXh0Q29udGVudD8udHJpbSgpIHx8ICcnO1xufVxuXG4vKipcbiAqIE1haW4gZnVuY3Rpb246IENhcHR1cmUgbWVzc2FnZXMgYW5kIHNhdmUgdG8gc3RvcmFnZVxuICovXG5jb25zdCB1cGRhdGVCdWZmZXIgPSAoKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgbWVzc2FnZU5vZGVzID0gZmluZE1lc3NhZ2VOb2RlcygpO1xuXG4gICAgICAgIGlmICghbWVzc2FnZU5vZGVzIHx8IG1lc3NhZ2VOb2Rlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbR2hvc3QtUmVhZGVyXSBObyBtZXNzYWdlcyBmb3VuZCB5ZXQuLi4nKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENvbnZlcnQgbm9kZXMgdG8gbWVzc2FnZSBvYmplY3RzXG4gICAgICAgIGNvbnN0IG1lc3NhZ2VzOiBHaG9zdE1lc3NhZ2VbXSA9IEFycmF5LmZyb20obWVzc2FnZU5vZGVzKVxuICAgICAgICAgICAgLnNsaWNlKC1NQVhfTUVTU0FHRVMpICAvLyBLZWVwIG9ubHkgbGFzdCBOIG1lc3NhZ2VzXG4gICAgICAgICAgICAubWFwKChub2RlLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHRleHQgPSBleHRyYWN0TWVzc2FnZVRleHQobm9kZSk7XG4gICAgICAgICAgICAgICAgY29uc3QgaXNTZWxsZXIgPSBpc1NlbGxlck1lc3NhZ2Uobm9kZSk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgdGV4dCxcbiAgICAgICAgICAgICAgICAgICAgaXNTZWxsZXIsXG4gICAgICAgICAgICAgICAgICAgIHRpbWVzdGFtcDogRGF0ZS5ub3coKSAtIChtZXNzYWdlTm9kZXMubGVuZ3RoIC0gaW5kZXgpICogMTAwMCwgLy8gQXBwcm94aW1hdGUgdGltZXN0YW1wc1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmZpbHRlcihtc2cgPT4gbXNnLnRleHQubGVuZ3RoID4gMCk7ICAvLyBSZW1vdmUgZW1wdHkgbWVzc2FnZXNcblxuICAgICAgICBpZiAobWVzc2FnZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnW0dob3N0LVJlYWRlcl0gTm8gdmFsaWQgbWVzc2FnZSB0ZXh0IGV4dHJhY3RlZCcpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU2F2ZSB0byBjaHJvbWUuc3RvcmFnZS5zZXNzaW9uXG4gICAgICAgIGNocm9tZS5zdG9yYWdlLnNlc3Npb24uc2V0KHsgW1NUT1JBR0VfS0VZXTogbWVzc2FnZXMgfSwgKCkgPT4ge1xuICAgICAgICAgICAgaWYgKGNocm9tZS5ydW50aW1lLmxhc3RFcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tHaG9zdC1SZWFkZXJdIFN0b3JhZ2UgZXJyb3I6JywgY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFtHaG9zdC1SZWFkZXJdIOKchSBTYXZlZCAke21lc3NhZ2VzLmxlbmd0aH0gbWVzc2FnZXMgdG8gc3RvcmFnZWApO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbR2hvc3QtUmVhZGVyXSBMYXRlc3Q6JywgbWVzc2FnZXNbbWVzc2FnZXMubGVuZ3RoIC0gMV0/LnRleHQuc3Vic3RyaW5nKDAsIDUwKSArICcuLi4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdbR2hvc3QtUmVhZGVyXSBFcnJvciBpbiB1cGRhdGVCdWZmZXI6JywgZXJyb3IpO1xuICAgIH1cbn07XG5cbi8qKlxuICogTXV0YXRpb25PYnNlcnZlciAtIHdhdGNoZXMgZm9yIG5ldyBtZXNzYWdlc1xuICovXG5jb25zdCBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKChtdXRhdGlvbnMpID0+IHtcbiAgICAvLyBDaGVjayBpZiBhbnkgbXV0YXRpb24gYWRkZWQgbm9kZXNcbiAgICBjb25zdCBoYXNOZXdOb2RlcyA9IG11dGF0aW9ucy5zb21lKG11dGF0aW9uID0+IG11dGF0aW9uLmFkZGVkTm9kZXMubGVuZ3RoID4gMCk7XG4gICAgXG4gICAgaWYgKGhhc05ld05vZGVzKSB7XG4gICAgICAgIC8vIERlYm91bmNlOiB3YWl0IGEgYml0IGZvciBET00gdG8gc2V0dGxlXG4gICAgICAgIGNsZWFyVGltZW91dCgod2luZG93IGFzIGFueSkuX2dob3N0UmVhZGVyVGltZW91dCk7XG4gICAgICAgICh3aW5kb3cgYXMgYW55KS5fZ2hvc3RSZWFkZXJUaW1lb3V0ID0gc2V0VGltZW91dCh1cGRhdGVCdWZmZXIsIDEwMCk7XG4gICAgfVxufSk7XG5cbi8qKlxuICogSW5pdGlhbGl6ZSB0aGUgR2hvc3QtUmVhZGVyXG4gKi9cbmNvbnN0IGluaXRHaG9zdFJlYWRlciA9ICgpID0+IHtcbiAgICBjb25zb2xlLmxvZyhcIuKVlOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVl1wiKTtcbiAgICBjb25zb2xlLmxvZyhcIuKVkSAgIE9yZGVyIFN5bmM6IEdob3N0LVJlYWRlciB2MS4wICAgICAgIOKVkVwiKTtcbiAgICBjb25zb2xlLmxvZyhcIuKVkSAgIEJvdHRvbS1VcCBCdWlsZDogQ29udGVudCBTY3JpcHQgICAgIOKVkVwiKTtcbiAgICBjb25zb2xlLmxvZyhcIuKVmuKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVnVwiKTtcbiAgICBjb25zb2xlLmxvZyhcIltHaG9zdC1SZWFkZXJdIEluaXRpYWxpemluZyBvbjpcIiwgd2luZG93LmxvY2F0aW9uLmhyZWYpO1xuXG4gICAgLy8gVmVyaWZ5IGNocm9tZSBBUElzIGFyZSBhdmFpbGFibGVcbiAgICBpZiAodHlwZW9mIGNocm9tZSA9PT0gJ3VuZGVmaW5lZCcgfHwgIWNocm9tZS5zdG9yYWdlKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tHaG9zdC1SZWFkZXJdIOKdjCBDaHJvbWUgQVBJcyBub3QgYXZhaWxhYmxlIScpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gU3RhcnQgb2JzZXJ2aW5nIHRoZSBlbnRpcmUgZG9jdW1lbnQgYm9keVxuICAgIGNvbnN0IHRhcmdldE5vZGUgPSBkb2N1bWVudC5ib2R5O1xuICAgIGNvbnN0IGNvbmZpZyA9IHsgXG4gICAgICAgIGNoaWxkTGlzdDogdHJ1ZSwgXG4gICAgICAgIHN1YnRyZWU6IHRydWUsXG4gICAgICAgIGNoYXJhY3RlckRhdGE6IHRydWUsXG4gICAgICAgIGNoYXJhY3RlckRhdGFPbGRWYWx1ZTogZmFsc2VcbiAgICB9O1xuXG4gICAgdHJ5IHtcbiAgICAgICAgb2JzZXJ2ZXIub2JzZXJ2ZSh0YXJnZXROb2RlLCBjb25maWcpO1xuICAgICAgICBjb25zb2xlLmxvZygnW0dob3N0LVJlYWRlcl0g4pyFIE11dGF0aW9uT2JzZXJ2ZXIgc3RhcnRlZCcpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignW0dob3N0LVJlYWRlcl0g4p2MIEZhaWxlZCB0byBzdGFydCBvYnNlcnZlcjonLCBlKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIEluaXRpYWwgc2NyYXBlIGFmdGVyIGEgc2hvcnQgZGVsYXkgKGxldCBNZXNzZW5nZXIgbG9hZClcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coJ1tHaG9zdC1SZWFkZXJdIFJ1bm5pbmcgaW5pdGlhbCBzY3JhcGUuLi4nKTtcbiAgICAgICAgdXBkYXRlQnVmZmVyKCk7XG4gICAgfSwgMjAwMCk7XG5cbiAgICAvLyBQZXJpb2RpY2FsbHkgdXBkYXRlIHRvIGNhdGNoIGFueSBtaXNzZWQgbWVzc2FnZXNcbiAgICBzZXRJbnRlcnZhbCh1cGRhdGVCdWZmZXIsIDUwMDApO1xufTtcblxuLyoqXG4gKiBIYW5kbGUgbWVzc2FnZXMgZnJvbSBwb3B1cC9iYWNrZ3JvdW5kXG4gKi9cbmNocm9tZS5ydW50aW1lLm9uTWVzc2FnZS5hZGRMaXN0ZW5lcigocmVxdWVzdCwgc2VuZGVyLCBzZW5kUmVzcG9uc2UpID0+IHtcbiAgICBpZiAocmVxdWVzdC5hY3Rpb24gPT09ICdnZXRNZXNzYWdlcycpIHtcbiAgICAgICAgY2hyb21lLnN0b3JhZ2Uuc2Vzc2lvbi5nZXQoW1NUT1JBR0VfS0VZXSwgKGRhdGEpID0+IHtcbiAgICAgICAgICAgIHNlbmRSZXNwb25zZSh7IG1lc3NhZ2VzOiBkYXRhW1NUT1JBR0VfS0VZXSB8fCBbXSB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0cnVlOyAvLyBLZWVwIGNoYW5uZWwgb3BlbiBmb3IgYXN5bmNcbiAgICB9XG4gICAgXG4gICAgaWYgKHJlcXVlc3QuYWN0aW9uID09PSAnZm9yY2VVcGRhdGUnKSB7XG4gICAgICAgIHVwZGF0ZUJ1ZmZlcigpO1xuICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdGF0dXM6ICd1cGRhdGVkJyB9KTtcbiAgICB9XG59KTtcblxuLy8gU3RhcnQgb24gd2luZG93IGxvYWRcbmlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnbG9hZGluZycpIHtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGluaXRHaG9zdFJlYWRlcik7XG59IGVsc2Uge1xuICAgIC8vIERPTSBhbHJlYWR5IGxvYWRlZFxuICAgIGluaXRHaG9zdFJlYWRlcigpO1xufVxuXG4vLyBBbHNvIHJlLWluaXRpYWxpemUgb24gVVJMIGNoYW5nZXMgKFNQQSBuYXZpZ2F0aW9uKVxubGV0IGxhc3RVcmwgPSBsb2NhdGlvbi5ocmVmO1xubmV3IE11dGF0aW9uT2JzZXJ2ZXIoKCkgPT4ge1xuICAgIGNvbnN0IHVybCA9IGxvY2F0aW9uLmhyZWY7XG4gICAgaWYgKHVybCAhPT0gbGFzdFVybCkge1xuICAgICAgICBsYXN0VXJsID0gdXJsO1xuICAgICAgICBjb25zb2xlLmxvZygnW0dob3N0LVJlYWRlcl0gVVJMIGNoYW5nZWQsIHJlaW5pdGlhbGl6aW5nLi4uJyk7XG4gICAgICAgIHNldFRpbWVvdXQoaW5pdEdob3N0UmVhZGVyLCAxMDAwKTtcbiAgICB9XG59KS5vYnNlcnZlKGRvY3VtZW50LCB7IHN1YnRyZWU6IHRydWUsIGNoaWxkTGlzdDogdHJ1ZSB9KTtcblxuY29uc29sZS5sb2coJ1tHaG9zdC1SZWFkZXJdIFNjcmlwdCBsb2FkZWQsIHdhaXRpbmcgZm9yIHdpbmRvdy5sb2FkLi4uJyk7XG4iLCJleHBvcnRzLmludGVyb3BEZWZhdWx0ID0gZnVuY3Rpb24gKGEpIHtcbiAgcmV0dXJuIGEgJiYgYS5fX2VzTW9kdWxlID8gYSA6IHtkZWZhdWx0OiBhfTtcbn07XG5cbmV4cG9ydHMuZGVmaW5lSW50ZXJvcEZsYWcgPSBmdW5jdGlvbiAoYSkge1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoYSwgJ19fZXNNb2R1bGUnLCB7dmFsdWU6IHRydWV9KTtcbn07XG5cbmV4cG9ydHMuZXhwb3J0QWxsID0gZnVuY3Rpb24gKHNvdXJjZSwgZGVzdCkge1xuICBPYmplY3Qua2V5cyhzb3VyY2UpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgIGlmIChrZXkgPT09ICdkZWZhdWx0JyB8fCBrZXkgPT09ICdfX2VzTW9kdWxlJyB8fCBkZXN0Lmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZGVzdCwga2V5LCB7XG4gICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBzb3VyY2Vba2V5XTtcbiAgICAgIH0sXG4gICAgfSk7XG4gIH0pO1xuXG4gIHJldHVybiBkZXN0O1xufTtcblxuZXhwb3J0cy5leHBvcnQgPSBmdW5jdGlvbiAoZGVzdCwgZGVzdE5hbWUsIGdldCkge1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZGVzdCwgZGVzdE5hbWUsIHtcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIGdldDogZ2V0LFxuICB9KTtcbn07XG4iXSwibmFtZXMiOltdLCJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGVudC42NzJjYWM2Yi5qcy5tYXAifQ==
 globalThis.define=__define;  })(globalThis.define);
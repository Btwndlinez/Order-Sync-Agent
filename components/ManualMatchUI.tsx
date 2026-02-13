import { useState, useEffect, useRef } from "react"

interface ProductResult {
  id: string
  title: string
  variant_title: string
  price: number
  variant_id: string
}

interface ManualMatchUIProps {
  onSelect: (variantId: string, price: number, productTitle: string) => void
  onBack?: () => void
  showBackButton: boolean
}

export function ManualMatchUI({ onSelect, onBack, showBackButton }: ManualMatchUIProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<ProductResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)

  const SUPABASE_URL = process.env.PLASMO_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co"
  const SUPABASE_ANON_KEY = process.env.PLASMO_PUBLIC_SUPABASE_ANON_KEY || ""

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const searchProducts = async () => {
      if (query.trim().length < 2) {
        setResults([])
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/find_matching_products`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
            "apikey": SUPABASE_ANON_KEY
          },
          body: JSON.stringify({
            search_query: query,
            match_threshold: 0.3,
            match_count: 3
          })
        })

        if (!response.ok) {
          setResults([])
          return
        }

        const data = await response.json()
        setResults(data.slice(0, 3))
      } catch (err) {
        console.error("Search error:", err)
        setResults([])
      } finally {
        setLoading(false)
      }
    }

    const debounce = setTimeout(searchProducts, 200)
    return () => clearTimeout(debounce)
  }, [query])

  const handleSelect = (product: ProductResult) => {
    onSelect(product.variant_id, product.price, product.title)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, -1))
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault()
      handleSelect(results[selectedIndex])
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.headerIcon}>🔍</span>
        <span style={styles.headerText}>Manual Search</span>
      </div>

      {showBackButton && (
        <button onClick={onBack} style={styles.backButton}>
          ← Back to AI Suggestion
        </button>
      )}

      <div style={styles.searchContainer}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search products..."
          style={styles.searchInput}
        />
        {loading && <div style={styles.spinner} />}
      </div>

      <div style={styles.resultsContainer}>
        {results.map((product, index) => (
          <div
            key={product.variant_id}
            onClick={() => handleSelect(product)}
            onMouseEnter={() => setSelectedIndex(index)}
            style={{
              ...styles.resultItem,
              ...(index === selectedIndex ? styles.resultItemSelected : {})
            }}
          >
            <div style={styles.resultContent}>
              <span style={styles.resultTitle}>{product.title}</span>
              {product.variant_title && product.variant_title !== "Default Title" && (
                <span style={styles.resultVariant}>{product.variant_title}</span>
              )}
            </div>
            <span style={styles.resultPrice}>${product.price.toFixed(2)}</span>
          </div>
        ))}

        {query.length >= 2 && results.length === 0 && !loading && (
          <div style={styles.noResults}>No products found</div>
        )}

        {query.length < 2 && (
          <div style={styles.hint}>Type at least 2 characters to search</div>
        )}
      </div>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxHeight: "240px",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 16px 8px 16px",
    borderBottom: "1px solid var(--fb-border)",
  },
  headerIcon: {
    fontSize: "16px",
  },
  headerText: {
    fontSize: "14px",
    fontWeight: 600,
    color: "var(--fb-text-secondary)",
  },
  backButton: {
    display: "block",
    margin: "8px 16px",
    padding: "8px 12px",
    background: "var(--fb-bg-tertiary)",
    border: "none",
    borderRadius: "6px",
    fontSize: "13px",
    color: "var(--fb-blue)",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  searchContainer: {
    position: "relative",
    padding: "12px 16px",
  },
  searchInput: {
    width: "100%",
    padding: "10px 12px",
    background: "var(--fb-gray, #f0f2f5)",
    border: "1px solid var(--fb-border)",
    borderRadius: "6px",
    fontSize: "14px",
    color: "var(--fb-text-primary)",
    outline: "none",
    boxSizing: "border-box",
  },
  spinner: {
    position: "absolute",
    right: "28px",
    top: "20px",
    width: "16px",
    height: "16px",
    border: "2px solid var(--fb-border)",
    borderTop: "2px solid var(--fb-blue)",
    borderRadius: "50%",
    animation: "spin 0.6s linear infinite",
  },
  resultsContainer: {
    padding: "0 16px 12px 16px",
    maxHeight: "140px",
    overflowY: "auto",
  },
  resultItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 12px",
    background: "var(--fb-bg-tertiary)",
    borderRadius: "6px",
    marginBottom: "6px",
    cursor: "pointer",
    transition: "all 0.15s ease",
    border: "1px solid transparent",
  },
  resultItemSelected: {
    background: "var(--fb-blue-light)",
    borderColor: "var(--fb-blue)",
  },
  resultContent: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    overflow: "hidden",
  },
  resultTitle: {
    fontSize: "13px",
    fontWeight: 500,
    color: "var(--fb-text-primary)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  resultVariant: {
    fontSize: "11px",
    color: "var(--fb-text-tertiary)",
  },
  resultPrice: {
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--fb-blue)",
    whiteSpace: "nowrap",
    marginLeft: "12px",
  },
  noResults: {
    textAlign: "center",
    padding: "16px",
    fontSize: "13px",
    color: "var(--fb-text-tertiary)",
  },
  hint: {
    textAlign: "center",
    padding: "12px",
    fontSize: "12px",
    color: "var(--fb-text-tertiary)",
  },
}
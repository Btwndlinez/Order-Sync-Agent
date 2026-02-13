import React from 'react';
import { Bot, AlertCircle, CheckCircle2, ShoppingCart, DollarSign, Package } from 'lucide-react';
import type { AnalysisResult, Product } from '../types';

interface AIAnalysisPanelProps {
  result?: AnalysisResult;
  catalog: Product[];
}

export const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({ result, catalog }) => {
  if (!result) {
    return (
      <div className="ai-panel">
        <div className="ai-panel-header">
          <Bot size={20} />
          <h3>AI Analysis</h3>
        </div>
        <div className="ai-panel-empty">
          <div className="ai-illustration">
            <Bot size={48} color="#bcc0c4" />
          </div>
          <p>No analysis yet</p>
          <span>Send messages to detect purchase intent</span>
        </div>
      </div>
    );
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.85) return 'high';
    if (confidence >= 0.50) return 'medium';
    return 'low';
  };

  const getProductDetails = () => {
    if (!result.product_id) return null;
    const product = catalog.find(p => p.id === result.product_id);
    const variant = product?.variants.find(v => v.id === result.variant_id);
    return { product, variant };
  };

  const { product, variant } = getProductDetails() || {};

  return (
    <div className="ai-panel">
      <div className="ai-panel-header">
        <Bot size={20} />
        <h3>AI Analysis</h3>
        <span className={`confidence-badge ${getConfidenceColor(result.confidence)}`}>
          {Math.round(result.confidence * 100)}% confidence
        </span>
      </div>

      <div className="ai-panel-content">
        {result.intent_detected ? (
          <>
            <div className="ai-result-status success">
              <CheckCircle2 size={24} color="#42b72a" />
              <div>
                <h4>Purchase Intent Detected</h4>
                <p>{result.reasoning}</p>
              </div>
            </div>

            {product && (
              <div className="ai-product-match">
                <h5>Matched Product</h5>
                <div className="product-match-card">
                  <div className="product-match-icon">
                    <Package size={24} color="#1877f2" />
                  </div>
                  <div className="product-match-details">
                    <span className="product-name">{product.title}</span>
                    {variant && (
                      <span className="variant-name">{variant.title}</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="ai-order-summary">
              <h5>Order Summary</h5>
              <div className="order-summary-row">
                <span><ShoppingCart size={16} /> Quantity</span>
                <strong>{result.quantity}</strong>
              </div>
              {result.total_value && (
                <div className="order-summary-row">
                  <span><DollarSign size={16} /> Total</span>
                  <strong>${result.total_value.toFixed(2)}</strong>
                </div>
              )}
            </div>

            <div className="ai-actions">
              <button className="fb-btn fb-btn-success">
                <ShoppingCart size={16} />
                Generate Checkout Link
              </button>
              <button className="fb-btn fb-btn-secondary">
                Edit Details
              </button>
            </div>
          </>
        ) : (
          <div className="ai-result-status neutral">
            <AlertCircle size={24} color="#65676b" />
            <div>
              <h4>No Purchase Intent</h4>
              <p>{result.reasoning}</p>
            </div>
          </div>
        )}

        {result.trigger_message && (
          <div className="ai-trigger-message">
            <h5>Trigger Message</h5>
            <blockquote>"{result.trigger_message}"</blockquote>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * CSV Column Mapping View
 * UI for manually overriding auto-mapped CSV columns
 */

import { useState, useEffect } from 'react';
import { autoMapHeaders, getMappingConfidence, type CanonicalField } from '../utils/csvParser';

interface CSVColumnMapperProps {
  headers: string[];
  previewData: Record<string, string>[];
  onConfirm: (mappings: Record<CanonicalField, string | null>) => void;
  onCancel: () => void;
}

const FIELD_LABELS: Record<CanonicalField, string> = {
  title: 'Product Title',
  sku: 'SKU',
  price: 'Price',
  link: 'Checkout Link'
};

const FIELD_REQUIRED: Record<CanonicalField, boolean> = {
  title: true,
  sku: true,
  price: true,
  link: false
};

export default function CSVColumnMapper({ 
  headers, 
  previewData, 
  onConfirm, 
  onCancel 
}: CSVColumnMapperProps) {
  const [mappings, setMappings] = useState<Record<CanonicalField, string | null>>({
    title: null,
    sku: null,
    price: null,
    link: null
  });

  // Auto-map headers on mount
  useEffect(() => {
    const autoMappings = autoMapHeaders(headers, 0.6);
    setMappings(autoMappings);
  }, [headers]);

  const handleMappingChange = (field: CanonicalField, csvHeader: string | null) => {
    setMappings(prev => ({
      ...prev,
      [field]: csvHeader
    }));
  };

  const handleConfirm = () => {
    onConfirm(mappings);
  };

  const canConfirm = mappings.title && mappings.sku && mappings.price;

  const canonicalFields: CanonicalField[] = ['title', 'sku', 'price', 'link'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Map CSV Columns</h3>
        <p className="text-sm text-slate-600 mt-1">
          Match your CSV columns to our required fields
        </p>
      </div>

      {/* Mapping Interface */}
      <div className="space-y-4">
        {canonicalFields.map(field => {
          const confidence = getMappingConfidence(field, mappings[field]);
          
          return (
            <div key={field} className="flex items-start gap-4">
              {/* Internal Field */}
              <div className="w-32 flex-shrink-0">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-slate-700">
                    {FIELD_LABELS[field]}
                  </span>
                  {FIELD_REQUIRED[field] && (
                    <span className="text-red-500">*</span>
                  )}
                </div>
                <p className={`text-xs mt-0.5 ${confidence.color}`}>
                  {confidence.label}
                </p>
              </div>

              {/* Arrow */}
              <div className="text-slate-400 pt-1">←</div>

              {/* CSV Header Dropdown */}
              <div className="flex-1">
                <select
                  value={mappings[field] || ''}
                  onChange={(e) => handleMappingChange(field, e.target.value || null)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1877F2] ${
                    mappings[field] 
                      ? 'border-slate-200 bg-white text-slate-900' 
                      : 'border-red-300 bg-red-50 text-red-700'
                  }`}
                >
                  <option value="">Select column...</option>
                  {headers.map(header => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}
      </div>

      {/* Data Preview */}
      <div>
        <h4 className="text-sm font-medium text-slate-700 mb-2">Data Preview</h4>
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                {canonicalFields.map(field => (
                  mappings[field] ? (
                    <th 
                      key={field} 
                      className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-200"
                    >
                      {FIELD_LABELS[field]}
                    </th>
                  ) : null
                ))}
              </tr>
            </thead>
            <tbody>
              {previewData.slice(0, 3).map((row, idx) => (
                <tr key={idx} className="border-b border-slate-100 last:border-0">
                  {canonicalFields.map(field => (
                    mappings[field] ? (
                      <td key={field} className="px-3 py-2 text-slate-700">
                        {row[mappings[field]!] || '-'}
                      </td>
                    ) : null
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {previewData.length > 3 && (
          <p className="text-xs text-slate-500 mt-1">
            Showing 3 of {previewData.length} rows
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-slate-200">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 px-4 border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={!canConfirm}
          className="flex-1 py-2.5 px-4 bg-[#1877F2] hover:bg-[#166fe5] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          Confirm Import
        </button>
      </div>
    </div>
  );
}

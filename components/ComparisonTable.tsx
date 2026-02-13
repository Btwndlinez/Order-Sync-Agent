/**
 * Order Sync Agent Comparison Component - Shows competitive advantages
 */

function ComparisonTable() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-slate-900 mb-8">
          Why Order Sync Agent Beats Complex Bots & Expensive Platforms
        </h2>
        <p className="text-lg text-slate-600 mb-12 max-w-4xl mx-auto">
          Don't build complex AI bots. Don't pay $299/month for Stripe links you have to manually create.
        </p>
      </div>
      
      <div className="overflow-x-auto shadow-lg border border-slate-200 rounded-xl">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">
                Feature
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">
Order Sync Agent
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">
                Manual Stripe Links
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">
                Complex Bot Platforms
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-200">
              <td className="px-6 py-4 text-sm text-slate-600">
                <span className="text-blue-500 mr-2">✓</span>
                AI Context Awareness
              </td>
              <td className="px-6 py-4 text-sm text-slate-900">
                Understands natural customer messages
              </td>
              <td className="px-6 py-4 text-sm text-slate-900">
                <span className="text-blue-500 mr-2">✓</span>
                Set up in 30 seconds
              </td>
              <td className="px-6 py-4 text-sm text-slate-600">
                <span className="text-red-500 mr-2">✗</span>
                Complex setup required
              </td>
              <td className="px-6 py-4 text-sm text-slate-900">
                <span className="text-red-500 mr-2">✗</span>
                Expensive add-ons
              </td>
            </tr>
            
            <tr className="border-b border-slate-200">
              <td className="px-6 py-4 text-sm text-slate-600">
                <span className="text-blue-500 mr-2">✓</span>
                No Tab-Switching
              </td>
              <td className="px-6 py-4 text-sm text-slate-900">
                Generate links without leaving Messenger
              </td>
              <td className="px-6 py-4 text-sm text-slate-900">
                <span className="text-blue-500 mr-2">✓</span>
                Stay in the flow
              </td>
              <td className="px-6 py-4 text-sm text-slate-600">
                <span className="text-red-500 mr-2">✗</span>
                Zero context loss
              </td>
              <td className="px-6 py-4 text-sm text-slate-900">
                <span className="text-red-500 mr-2">✗</span>
                Juggling multiple tools
              </td>
              <td className="px-6 py-4 text-sm text-slate-900">
                <span className="text-red-500 mr-2">✗</span>
                High learning curve
              </td>
            </tr>
            
            <tr className="border-b border-slate-200">
              <td className="px-6 py-4 text-sm text-slate-600">
                <span className="text-blue-500 mr-2">✓</span>
                Human-First Design
              </td>
              <td className="px-6 py-4 text-sm text-slate-900">
                Built for sellers, by sellers
              </td>
              <td className="px-6 py-4 text-sm text-slate-900">
                <span className="text-blue-500 mr-2">✓</span>
                Keep it human-friendly
              </td>
              <td className="px-6 py-4 text-sm text-slate-600">
                <span className="text-red-500 mr-2">✗</span>
                Technical interfaces
              </td>
              <td className="px-6 py-4 text-sm text-slate-900">
                <span className="text-red-500 mr-2">✗</span>
                Rigid user experience
              </td>
            </tr>
            
            <tr className="border-b border-slate-200">
              <td className="px-6 py-4 text-sm text-slate-600">
                <span className="text-blue-500 mr-2">✓</span>
                Instant Setup
              </td>
              <td className="px-6 py-4 text-sm text-slate-900">
                <span className="text-blue-500 mr-2">✓</span>
                Ready in 30 seconds
              </td>
              <td className="px-6 py-4 text-sm text-slate-600">
                <span className="text-red-500 mr-2">✗</span>
                Free to start
              </td>
              <td className="px-6 py-4 text-sm text-slate-900">
                <span className="text-red-500 mr-2">✗</span>
                Weeks of configuration
              </td>
              <td className="px-6 py-4 text-sm text-slate-900">
                <span className="text-red-500 mr-2">✗</span>
                Expensive consultants
              </td>
            </tr>
            
            <tr className="bg-slate-50">
              <td className="px-6 py-4 text-sm text-slate-600">
                <span className="text-blue-500 mr-2">✓</span>
                Pricing
              </td>
              <td className="px-6 py-4 text-sm text-slate-900">
                <span className="text-blue-500 mr-2">✓</span>
                Simple monthly plans ($0-$49)
              </td>
              <td className="px-6 py-4 text-sm text-slate-900">
                <span className="text-blue-500 mr-2">✓</span>
                Transparent and predictable
              </td>
              <td className="px-6 py-4 text-sm text-slate-600">
                <span className="text-red-500 mr-2">✗</span>
                Hidden fees & overages
              </td>
              <td className="px-6 py-4 text-sm text-slate-900">
                <span className="text-red-500 mr-2">✗</span>
                Transaction charges
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div className="text-center mt-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          Clear Winner
        </div>
        <p className="text-lg text-slate-900 mb-4">
          Order Sync Agent combines AI simplicity with human-centered design for the perfect social commerce solution.
        </p>
        <button
          onClick={() => window.open('#pricing', '_blank')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
        >
          Choose Your Plan & Start Selling
        </button>
      </div>
    </div>
  )
}

export default ComparisonTable
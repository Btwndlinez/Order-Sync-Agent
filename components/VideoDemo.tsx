/**
 * VideoDemo Component - 90-second Loom demo placeholder
 * Professional video showcase for product demonstration
 */

export default function VideoDemo() {
  return (
    <section className="py-12 md:py-16 px-4 bg-slate-50">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
            See Order Sync Agent in Action
          </h2>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            Watch how Order Sync Agent extracts order details from any Messenger chat and generates a Stripe checkout link in seconds
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Video Embed - Replace src with actual Loom/YouTube embed */}
          <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl">
            <div className="relative aspect-video">
              <iframe 
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0&rel=0"
                title="Order Sync Agent Demo"
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            
            {/* Video info below */}
            <div className="bg-white p-6 border-t border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                From Message to Payment in 3 Clicks
              </h3>
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Real-time extraction
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Instant checkout generation
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  No copy-paste errors
                </span>
              </div>
            </div>
          </div>
          
          {/* Call to action */}
          <div className="text-center mt-8">
            <p className="text-slate-600 mb-4">
              Ready to eliminate manual data entry forever?
            </p>
            <button
              onClick={() => {
                // This will be handled by the parent component
                const event = new CustomEvent('openWaitlist')
                window.dispatchEvent(event)
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-medium text-lg transition-all hover:scale-105 shadow-lg shadow-blue-500/30"
            >
              Join the First Cohort
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
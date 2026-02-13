/**
 * Platform Safety FAQ - Technical Safety & Trust Building
 * Accordion-style FAQ addressing marketplace API and automation fears
 */

import { useState } from "react"

interface FAQItem {
  question: string
  answer: string
  technical?: boolean
}

export default function AccordionFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const technicalFAQs: FAQItem[] = [
    {
      question: "How is this different from a bot?",
      answer: "Bots perform automated actions (like bulk-listing) that trigger platform bans. Order Sync Agent is a read-only assistant that extracts data for you to review and send manually. Every action requires human approval before execution.",
      technical: true
    },
    {
      question: "Do you scrape my account?",
      answer: "No. We use activeTab permissions to read only the specific conversation you have open. We do not crawl your profile, access your login credentials, or perform any automated browsing of your account.",
      technical: true
    },
    {
      question: "Is my data safe?",
      answer: "All order extractions are encrypted via Supabase (AES-256) and are never sold or used to train third-party AI models. Your data remains private and is used only for generating checkout links.",
      technical: true
    },
    {
      question: "Does this violate Meta's TOS?",
      answer: "By keeping 'Human-in-the-loop' for every action, you remain in compliance with policies against unauthorized automation. Order Sync Agent acts as a sophisticated copy-paste tool that you control completely.",
      technical: true
    },
    {
      question: "What permissions does Order Sync Agent need?",
      answer: "Minimal permissions only: activeTab (to read current conversation) and storage (to save preferences). No background access, no site-wide access, no credential access.",
      technical: true
    },
    {
      question: "Can this get my account banned?",
      answer: "No. Because Order Sync Agent never performs automated actions and requires human approval for everything, it operates within platform guidelines. It's essentially a smart clipboard, not an automated system.",
      technical: true
    }
  ]

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="py-12 md:py-16 px-4 bg-slate-50">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v.01M15.543 8.543a2.5 2.5 0 00-3.086 3.086" />
            </svg>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
            Platform Safety FAQ
          </h2>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            Technical answers to keep your marketplace account secure while accelerating your workflow
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {technicalFAQs.map((faq, idx) => (
            <div 
              key={idx} 
              className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300 hover:shadow-md"
            >
              <button
                onClick={() => toggleFAQ(idx)}
                className="w-full px-6 py-4 text-left hover:bg-slate-50 transition-colors duration-200 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  {faq.technical && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4m-4-4h-12" />
                      </svg>
                      Technical
                    </span>
                  )}
                  <span className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                    {faq.question}
                  </span>
                </div>
                <svg 
                  className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${openIndex === idx ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Answer Panel */}
              <div 
                className={`transition-all duration-300 ease-in-out ${
                  openIndex === idx 
                    ? 'max-h-96 opacity-100' 
                    : 'max-h-0 opacity-0 overflow-hidden'
                }`}
              >
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
                  <div className="prose prose-sm text-slate-700 leading-relaxed">
                    {faq.answer.split('. ').map((sentence, idx) => (
                      <p key={idx} className="mb-2">
                        {sentence.trim() + (idx < faq.answer.split('. ').length - 1 ? '.' : '')}
                      </p>
                    ))}
                  </div>
                  
                  {/* Trust Indicators */}
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="flex flex-wrap gap-2">
                      {faq.question.toLowerCase().includes('bot') && (
                        <>
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Human-in-the-loop
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S.458 14.057.458 10H1a1 1 0 110-2h.458zM16 8v1a1 1 0 002 0V8a1 1 0 00-2 0z" clipRule="evenodd" />
                            </svg>
                            Read-only
                          </span>
                        </>
                      )}
                      {faq.question.toLowerCase().includes('scrape') && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 1.971 0 .646-.054 1.289-.166 1.971l-4.999 5a1 1 0 01-1.18.134l-4-4a1 1 0 00-.356-.717L8.05 5.106a1 1 0 111.494 0l3.044 3.044-3.044 3.044a1 1 0 01-1.494 0l-3.044-3.044L4.556 9.056a1 1 0 01-.356.717L0 14.999a1 1 0 001.18.134l5 5a1 1 0 001.18-.134z" clipRule="evenodd" />
                          </svg>
                          Minimal permissions
                        </span>
                      )}
                      {faq.question.toLowerCase().includes('safe') && (
                        <>
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 1.971 0 .646-.054 1.289-.166 1.971l-4.999 5a1 1 0 01-1.18.134l-4-4a1 1 0 00-.356-.717L8.05 5.106a1 1 0 111.494 0l3.044 3.044-3.044 3.044a1 1 0 01-1.494 0l-3.044-3.044L4.556 9.056a1 1 0 01-.356.717L0 14.999a1 1 0 001.18.134l5 5a1 1 0 001.18-.134z" clipRule="evenodd" />
                            </svg>
                            AES-256 encryption
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000 2h6a2 2 0 002-2h2a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" clipRule="evenodd" />
                            </svg>
                            TOS compliant
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Trust Banner */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v.01M15.543 8.543a2.5 2.5 0 00-3.086 3.086" />
            </svg>
            <span className="text-sm font-medium text-blue-900">
              Built for platform safety and seller protection
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
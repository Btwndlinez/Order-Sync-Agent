import { useState } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ConversationList } from './components/ConversationList';
import { ChatView } from './components/ChatView';
import { AIAnalysisPanel } from './components/AIAnalysisPanel';
import { CatalogView } from './components/CatalogView';
import { AnalyticsView } from './components/AnalyticsView';
import { TestRunner } from './components/TestRunner';
import type { Conversation, Product, ViewMode, TestCase } from './types';
import testData from '../tests/test-conversations.json';
import './styles/facebook-theme.css';
import './styles/app.css';

// Sample initial data
const initialConversations: Conversation[] = [
  {
    id: 'conv_001',
    buyerName: 'Sarah Johnson',
    messages: [
      { role: 'buyer', text: 'Hi! Is the red sweatshirt still available?', timestamp: '2024-02-07T10:00:00Z' },
      { role: 'seller', text: 'Yes! What size do you need?', timestamp: '2024-02-07T10:01:00Z' },
      { role: 'buyer', text: 'Large please. I\'ll take it!', timestamp: '2024-02-07T10:02:00Z' },
    ],
    status: 'pending',
    lastActivity: '2024-02-07T10:02:00Z',
  },
  {
    id: 'conv_002',
    buyerName: 'Mike Chen',
    messages: [
      { role: 'buyer', text: 'How much for the beanie?', timestamp: '2024-02-07T11:00:00Z' },
      { role: 'seller', text: '$25 each', timestamp: '2024-02-07T11:01:00Z' },
      { role: 'buyer', text: 'Can I get 3?', timestamp: '2024-02-07T11:02:00Z' },
    ],
    status: 'active',
    lastActivity: '2024-02-07T11:02:00Z',
  },
  {
    id: 'conv_003',
    buyerName: 'Emma Wilson',
    messages: [
      { role: 'buyer', text: 'Do you have any jackets?', timestamp: '2024-02-07T12:00:00Z' },
      { role: 'seller', text: 'Yes, I have bomber jackets and denim jackets', timestamp: '2024-02-07T12:01:00Z' },
      { role: 'buyer', text: 'What sizes?', timestamp: '2024-02-07T12:02:00Z' },
    ],
    status: 'active',
    lastActivity: '2024-02-07T12:02:00Z',
  },
];

const initialProducts: Product[] = [
  {
    id: 'prod_001',
    title: 'Red Crewneck Sweatshirt',
    variants: [
      { id: 'var_s', title: 'Small', price: '35.00' },
      { id: 'var_m', title: 'Medium', price: '35.00' },
      { id: 'var_l', title: 'Large', price: '35.00' },
    ],
  },
  {
    id: 'prod_002',
    title: 'Classic Beanie',
    variants: [
      { id: 'var_001', title: 'Default', price: '25.00' },
    ],
  },
  {
    id: 'prod_003',
    title: 'Black Bomber Jacket',
    variants: [
      { id: 'var_m', title: 'Medium', price: '85.00' },
      { id: 'var_l', title: 'Large', price: '85.00' },
    ],
  },
];

function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('conversations');
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [testCases] = useState<TestCase[]>(testData.test_cases as unknown as TestCase[]);

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  const handleUpdateConversation = (updated: Conversation) => {
    setConversations(prev => 
      prev.map(c => c.id === updated.id ? updated : c)
    );
  };

  const renderContent = () => {
    switch (currentView) {
      case 'conversations':
        return (
          <div className="conversations-layout">
            <div className="conversations-sidebar">
              <ConversationList
                conversations={conversations}
                selectedId={selectedConversationId}
                onSelect={setSelectedConversationId}
              />
            </div>
            <div className="conversations-main">
              {selectedConversation ? (
                <ChatView
                  conversation={selectedConversation}
                  onUpdateConversation={handleUpdateConversation}
                  catalog={products}
                />
              ) : (
                <div className="empty-selection">
                  <div className="empty-icon">
                    <span>💬</span>
                  </div>
                  <h3>Select a conversation</h3>
                  <p>Choose a conversation from the list to view and analyze</p>
                </div>
              )}
            </div>
            <div className="conversations-panel">
              <AIAnalysisPanel 
                result={selectedConversation?.detectedIntent}
                catalog={products}
              />
            </div>
          </div>
        );
      case 'catalog':
        return <CatalogView products={products} onUpdateProducts={setProducts} />;
      case 'analytics':
        return <AnalyticsView conversations={conversations} />;
      case 'tests':
        return <TestRunner testCases={testCases} />;
      default:
        return null;
    }
  };

  return (
    <div className="app">
      <Header currentView={currentView} onViewChange={setCurrentView} />
      <div className="app-body">
        <Sidebar currentView={currentView} onViewChange={setCurrentView} />
        <main className="app-content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;

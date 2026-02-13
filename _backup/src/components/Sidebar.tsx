import React from 'react';
import { Home, ShoppingBag, BarChart3, TestTube, Settings, HelpCircle } from 'lucide-react';
import type { ViewMode } from '../types';

interface SidebarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const menuItems: { id: ViewMode; icon: React.ReactNode; label: string }[] = [
    { id: 'conversations', icon: <Home size={22} />, label: 'Conversations' },
    { id: 'catalog', icon: <ShoppingBag size={22} />, label: 'Product Catalog' },
    { id: 'analytics', icon: <BarChart3 size={22} />, label: 'Analytics' },
    { id: 'tests', icon: <TestTube size={22} />, label: 'Test Suite' },
  ];

  const bottomItems = [
    { icon: <Settings size={22} />, label: 'Settings' },
    { icon: <HelpCircle size={22} />, label: 'Help' },
  ];

  return (
    <aside className="fb-sidebar">
      <div className="fb-sidebar-menu">
        {menuItems.map(item => (
          <button
            key={item.id}
            className={`fb-sidebar-item ${currentView === item.id ? 'active' : ''}`}
            onClick={() => onViewChange(item.id)}
          >
            <span className="fb-sidebar-icon">{item.icon}</span>
            <span className="fb-sidebar-label">{item.label}</span>
          </button>
        ))}
      </div>
      
      <div className="fb-sidebar-divider" />
      
      <div className="fb-sidebar-bottom">
        {bottomItems.map((item, idx) => (
          <button key={idx} className="fb-sidebar-item">
            <span className="fb-sidebar-icon">{item.icon}</span>
            <span className="fb-sidebar-label">{item.label}</span>
          </button>
        ))}
      </div>
    </aside>
  );
};

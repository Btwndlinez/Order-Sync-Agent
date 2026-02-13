import React from 'react';
import { Home, ShoppingBag, BarChart3, TestTube, Search, Bell, Menu } from 'lucide-react';
import type { ViewMode } from '../types';

interface HeaderProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onViewChange }) => {
  const navItems: { id: ViewMode; icon: React.ReactNode; label: string }[] = [
    { id: 'conversations', icon: <Home size={20} />, label: 'Conversations' },
    { id: 'catalog', icon: <ShoppingBag size={20} />, label: 'Catalog' },
    { id: 'analytics', icon: <BarChart3 size={20} />, label: 'Analytics' },
    { id: 'tests', icon: <TestTube size={20} />, label: 'Tests' },
  ];

  return (
    <header className="fb-header">
      <div className="fb-header-left">
        <div className="fb-logo">
          <div className="fb-logo-icon">
            <ShoppingBag size={24} color="white" />
          </div>
          <span className="fb-logo-text">Order Sync Agent</span>
        </div>
        <div className="fb-search">
          <Search size={16} color="#65676b" />
          <input 
            type="text" 
            placeholder="Search conversations..." 
            className="fb-search-input"
          />
        </div>
      </div>

      <nav className="fb-header-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`fb-nav-btn ${currentView === item.id ? 'active' : ''}`}
            onClick={() => onViewChange(item.id)}
            title={item.label}
          >
            {item.icon}
            <span className="fb-nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="fb-header-right">
        <button className="fb-icon-btn">
          <Bell size={20} />
        </button>
        <button className="fb-icon-btn">
          <Menu size={20} />
        </button>
        <div className="fb-header-avatar">
          <div className="avatar-placeholder">JS</div>
        </div>
      </div>
    </header>
  );
};

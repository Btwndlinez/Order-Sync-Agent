import React from 'react';
import { TrendingUp, Users, CheckCircle2, Clock } from 'lucide-react';
import type { Conversation } from '../types';

interface AnalyticsViewProps {
  conversations: Conversation[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ conversations }) => {
  const stats = {
    total: conversations.length,
    active: conversations.filter(c => c.status === 'active').length,
    pending: conversations.filter(c => c.status === 'pending').length,
    completed: conversations.filter(c => c.status === 'completed').length,
    withIntent: conversations.filter(c => c.detectedIntent?.intent_detected).length,
    avgConfidence: conversations
      .filter(c => c.detectedIntent)
      .reduce((acc, c) => acc + (c.detectedIntent?.confidence || 0), 0) / 
      conversations.filter(c => c.detectedIntent).length || 0,
  };

  const recentActivity = [...conversations]
    .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
    .slice(0, 5);

  return (
    <div className="analytics-view">
      <div className="analytics-header">
        <h2>Analytics Dashboard</h2>
        <span className="last-updated">Last updated: {new Date().toLocaleString()}</span>
      </div>

      <div className="analytics-grid">
        <div className="analytics-card">
          <div className="analytics-icon blue">
            <Users size={24} />
          </div>
          <div className="analytics-info">
            <span className="analytics-value">{stats.total}</span>
            <span className="analytics-label">Total Conversations</span>
          </div>
        </div>

        <div className="analytics-card">
          <div className="analytics-icon green">
            <CheckCircle2 size={24} />
          </div>
          <div className="analytics-info">
            <span className="analytics-value">{stats.withIntent}</span>
            <span className="analytics-label">Intents Detected</span>
          </div>
        </div>

        <div className="analytics-card">
          <div className="analytics-icon yellow">
            <Clock size={24} />
          </div>
          <div className="analytics-info">
            <span className="analytics-value">{stats.pending}</span>
            <span className="analytics-label">Pending Orders</span>
          </div>
        </div>

        <div className="analytics-card">
          <div className="analytics-icon purple">
            <TrendingUp size={24} />
          </div>
          <div className="analytics-info">
            <span className="analytics-value">{Math.round(stats.avgConfidence * 100)}%</span>
            <span className="analytics-label">Avg Confidence</span>
          </div>
        </div>
      </div>

      <div className="analytics-sections">
        <div className="analytics-section">
          <h3>Status Distribution</h3>
          <div className="status-bars">
            <div className="status-bar-item">
              <div className="status-bar-header">
                <span>Active</span>
                <span>{stats.active}</span>
              </div>
              <div className="status-bar">
                <div 
                  className="status-bar-fill active" 
                  style={{ width: `${(stats.active / stats.total) * 100}%` }}
                />
              </div>
            </div>
            <div className="status-bar-item">
              <div className="status-bar-header">
                <span>Pending</span>
                <span>{stats.pending}</span>
              </div>
              <div className="status-bar">
                <div 
                  className="status-bar-fill pending" 
                  style={{ width: `${(stats.pending / stats.total) * 100}%` }}
                />
              </div>
            </div>
            <div className="status-bar-item">
              <div className="status-bar-header">
                <span>Completed</span>
                <span>{stats.completed}</span>
              </div>
              <div className="status-bar">
                <div 
                  className="status-bar-fill completed" 
                  style={{ width: `${(stats.completed / stats.total) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="analytics-section">
          <h3>Recent Activity</h3>
          <div className="activity-list">
            {recentActivity.map(conversation => (
              <div key={conversation.id} className="activity-item">
                <div className="activity-avatar">
                  {conversation.buyerName.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <div className="activity-info">
                  <span className="activity-name">{conversation.buyerName}</span>
                  <span className="activity-status">
                    {conversation.detectedIntent?.intent_detected 
                      ? 'Purchase intent detected' 
                      : 'Conversation updated'}
                  </span>
                </div>
                <span className="activity-time">
                  {new Date(conversation.lastActivity).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Clock, CheckCircle2 } from 'lucide-react';
import type { Conversation, AnalysisResult } from '../types';

interface ConversationCardProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}

const getStatusIcon = (status: Conversation['status']) => {
  switch (status) {
    case 'active':
      return <CheckCircle2 size={14} color="#42b72a" />;
    case 'pending':
      return <Clock size={14} color="#f7b928" />;
    case 'completed':
      return <CheckCircle2 size={14} color="#1877f2" />;
    default:
      return null;
  }
};

const getConfidenceBadge = (result?: AnalysisResult) => {
  if (!result || !result.intent_detected) return null;
  
  if (result.confidence >= 0.85) {
    return <span className="confidence-badge high">{Math.round(result.confidence * 100)}%</span>;
  } else if (result.confidence >= 0.50) {
    return <span className="confidence-badge medium">{Math.round(result.confidence * 100)}%</span>;
  }
  return <span className="confidence-badge low">{Math.round(result.confidence * 100)}%</span>;
};

export const ConversationCard: React.FC<ConversationCardProps> = ({
  conversation,
  isSelected,
  onClick,
}) => {
  const lastMessage = conversation.messages[conversation.messages.length - 1];
  
  return (
    <div 
      className={`conversation-card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="conversation-avatar">
        {conversation.buyerAvatar ? (
          <img src={conversation.buyerAvatar} alt={conversation.buyerName} />
        ) : (
          <div className="avatar-placeholder">
            {conversation.buyerName.split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
        )}
      </div>
      
      <div className="conversation-info">
        <div className="conversation-header">
          <h4 className="conversation-name">{conversation.buyerName}</h4>
          <span className="conversation-time">
            {new Date(conversation.lastActivity).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        </div>
        
        <p className="conversation-preview">
          {lastMessage ? lastMessage.text : 'No messages yet'}
        </p>
        
        <div className="conversation-footer">
          <div className="conversation-status">
            {getStatusIcon(conversation.status)}
            <span className="status-text">{conversation.status}</span>
          </div>
          {getConfidenceBadge(conversation.detectedIntent)}
        </div>
      </div>
    </div>
  );
};

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedId,
  onSelect,
}) => {
  return (
    <div className="conversation-list">
      <div className="conversation-list-header">
        <h3>Recent Conversations</h3>
        <span className="conversation-count">{conversations.length}</span>
      </div>
      
      <div className="conversation-items">
        {conversations.map(conversation => (
          <ConversationCard
            key={conversation.id}
            conversation={conversation}
            isSelected={selectedId === conversation.id}
            onClick={() => onSelect(conversation.id)}
          />
        ))}
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, MoreHorizontal, Phone, Video, MessageCircle } from 'lucide-react';
import type { Conversation, Message } from '../types';
import { analyzeConversationLocal } from '../utils/api';

interface ChatMessageProps {
  message: Message;
  isBuyer: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isBuyer }) => {
  return (
    <div className={`chat-message ${isBuyer ? 'buyer' : 'seller'}`}>
      <div className="message-bubble">
        <p className="message-text">{message.text}</p>
        <span className="message-time">
          {new Date(message.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </span>
      </div>
    </div>
  );
};

interface ChatViewProps {
  conversation: Conversation;
  onUpdateConversation: (updated: Conversation) => void;
  catalog: any[];
}

export const ChatView: React.FC<ChatViewProps> = ({ 
  conversation, 
  onUpdateConversation,
  catalog 
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation.messages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      role: 'buyer',
      text: newMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    const updatedConversation = {
      ...conversation,
      messages: [...conversation.messages, message],
      lastActivity: new Date().toISOString(),
    };

    onUpdateConversation(updatedConversation);
    setNewMessage('');

    // Trigger AI analysis
    setIsAnalyzing(true);
    try {
      const result = await analyzeConversationLocal({
        messages: updatedConversation.messages,
        shopify_products: catalog,
      });
      
      onUpdateConversation({
        ...updatedConversation,
        detectedIntent: result,
        status: result.intent_detected ? 'pending' : 'active',
      });
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-view">
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="chat-avatar">
            <div className="avatar-placeholder">
              {conversation.buyerName.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
          </div>
          <div className="chat-header-text">
            <h3>{conversation.buyerName}</h3>
            <span className="chat-status">
              {conversation.status === 'active' ? 'Active now' : 'Offline'}
            </span>
          </div>
        </div>
        <div className="chat-header-actions">
          <button className="chat-action-btn">
            <Phone size={20} />
          </button>
          <button className="chat-action-btn">
            <Video size={20} />
          </button>
          <button className="chat-action-btn">
            <MoreHorizontal size={20} />
          </button>
        </div>
      </div>

      <div className="chat-messages">
        {conversation.messages.length === 0 ? (
          <div className="chat-empty">
            <div className="chat-empty-icon">
              <MessageCircle size={48} color="#bcc0c4" />
            </div>
            <p>No messages yet</p>
            <span>Start a conversation to detect purchase intent</span>
          </div>
        ) : (
          <>
            {conversation.messages.map((msg, idx) => (
              <ChatMessage 
                key={idx} 
                message={msg} 
                isBuyer={msg.role === 'buyer'} 
              />
            ))}
            {isAnalyzing && (
              <div className="analysis-indicator">
                <div className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span>Analyzing intent...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="chat-input-area">
        <button className="chat-input-btn">
          <Paperclip size={20} />
        </button>
        <div className="chat-input-wrapper">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="chat-input"
          />
          <button className="chat-input-btn emoji">
            <Smile size={20} />
          </button>
        </div>
        <button 
          className="chat-send-btn"
          onClick={handleSend}
          disabled={!newMessage.trim()}
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

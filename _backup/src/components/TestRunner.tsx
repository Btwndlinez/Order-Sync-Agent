import React, { useState } from 'react';
import { Play, CheckCircle2, XCircle, AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import type { TestCase, TestRunResult } from '../types';
import { analyzeConversationLocal } from '../utils/api';

interface TestRunnerProps {
  testCases: TestCase[];
}

export const TestRunner: React.FC<TestRunnerProps> = ({ testCases }) => {
  const [results, setResults] = useState<TestRunResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string | null>(null);

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);

    for (const testCase of testCases) {
      setCurrentTest(testCase.id);
      
      try {
        const result = await analyzeConversationLocal({
          messages: testCase.conversation,
          shopify_products: testCase.catalog,
        });

        const passed = checkTestPass(result, testCase.expected);
        
        setResults(prev => [...prev, {
          testCase,
          result,
          passed,
          timestamp: new Date().toISOString(),
        }]);
      } catch (error) {
        setResults(prev => [...prev, {
          testCase,
          result: {
            intent_detected: false,
            confidence: 0,
            product_id: null,
            variant_id: null,
            product_title: null,
            variant_title: null,
            quantity: 0,
            total_value: null,
            trigger_message: null,
            reasoning: `Error: ${error}`,
          },
          passed: false,
          timestamp: new Date().toISOString(),
        }]);
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setIsRunning(false);
    setCurrentTest(null);
  };

  const checkTestPass = (result: any, expected: any): boolean => {
    if (expected.intent_detected !== undefined && result.intent_detected !== expected.intent_detected) {
      return false;
    }
    if (expected.product_id && result.product_id !== expected.product_id) {
      return false;
    }
    if (expected.variant_id && result.variant_id !== expected.variant_id) {
      return false;
    }
    if (expected.quantity && result.quantity !== expected.quantity) {
      return false;
    }
    return true;
  };

  const passedCount = results.filter(r => r.passed).length;
  const passRate = results.length > 0 ? (passedCount / results.length) * 100 : 0;

  return (
    <div className="test-runner">
      <div className="test-header">
        <h2>Test Suite</h2>
        <div className="test-stats">
          {results.length > 0 && (
            <div className="test-summary">
              <span className={`pass-rate ${passRate >= 90 ? 'good' : passRate >= 70 ? 'warning' : 'bad'}`}>
                {passedCount}/{results.length} passed ({Math.round(passRate)}%)
              </span>
            </div>
          )}
          <button 
            className="fb-btn fb-btn-primary"
            onClick={runTests}
            disabled={isRunning}
          >
            {isRunning ? (
              <>
                <RefreshCw size={18} className="spin" />
                Running...
              </>
            ) : (
              <>
                <Play size={18} />
                Run Tests
              </>
            )}
          </button>
        </div>
      </div>

      <div className="test-progress">
        {isRunning && (
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(results.length / testCases.length) * 100}%` }}
            />
          </div>
        )}
      </div>

      <div className="test-cases-list">
        {testCases.map((testCase, index) => {
          const result = results.find(r => r.testCase.id === testCase.id);
          
          return (
            <div 
              key={testCase.id} 
              className={`test-case-card ${result ? (result.passed ? 'passed' : 'failed') : ''} ${currentTest === testCase.id ? 'running' : ''}`}
            >
              <div className="test-case-header">
                <div className="test-case-info">
                  <span className="test-number">#{index + 1}</span>
                  <h4>{testCase.name}</h4>
                </div>
                <div className="test-case-status">
                  {!result && currentTest !== testCase.id && (
                    <Clock size={18} color="#8c939d" />
                  )}
                  {currentTest === testCase.id && (
                    <RefreshCw size={18} className="spin" color="#1877f2" />
                  )}
                  {result && result.passed && (
                    <CheckCircle2 size={18} color="#42b72a" />
                  )}
                  {result && !result.passed && (
                    <XCircle size={18} color="#f02849" />
                  )}
                </div>
              </div>

              <div className="test-case-details">
                <div className="test-detail-row">
                  <span className="test-label">Messages:</span>
                  <span className="test-value">{testCase.conversation.length}</span>
                </div>
                <div className="test-detail-row">
                  <span className="test-label">Products:</span>
                  <span className="test-value">{testCase.catalog.length}</span>
                </div>
                
                {result && (
                  <>
                    <div className="test-divider" />
                    <div className="test-detail-row">
                      <span className="test-label">Intent:</span>
                      <span className={`test-value ${result.result.intent_detected ? 'success' : 'neutral'}`}>
                        {result.result.intent_detected ? 'Detected' : 'Not detected'}
                      </span>
                    </div>
                    {result.result.intent_detected && (
                      <div className="test-detail-row">
                        <span className="test-label">Confidence:</span>
                        <span className="test-value">{Math.round(result.result.confidence * 100)}%</span>
                      </div>
                    )}
                    {!result.passed && (
                      <div className="test-fail-reason">
                        <AlertTriangle size={14} />
                        <span>Expected: {JSON.stringify(testCase.expected)}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { RuleEngine, Issue, CodeIssue } from '../lib/RuleEngine';
import workflowData from '../data/workflows.json';
import { AlertTriangle, CheckCircle, Code, FileText, Info, Shield, Zap } from 'lucide-react';

const RuleDashboard: React.FC = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [codeIssues, setCodeIssues] = useState<CodeIssue[]>([]);
  const [activeTab, setActiveTab] = useState<'workflows' | 'code'>('workflows');
  const [codeSample, setCodeSample] = useState(`// Sample function to validate
function calculate_total(items) {
  let total_price = 0;
  items.forEach(item => {
    total_price += item.price;
  })
  return total_price;
}

const API_KEY = "12345";
`);

  useEffect(() => {
    // Initialize Engine
    const engine = new RuleEngine(workflowData.rules, workflowData.workflows);
    const analysisResults = engine.analyze();
    setIssues(analysisResults);

    // Initial code analysis
    const codeResults = engine.codeValidator.analyze(codeSample, 'javascript');
    setCodeIssues(codeResults);
  }, []);

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const code = e.target.value;
    setCodeSample(code);
    const engine = new RuleEngine([], []);
    const results = engine.codeValidator.analyze(code, 'javascript'); // Defaulting to JS for demo
    setCodeIssues(results);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
      <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Shield className="text-purple-600" />
            Rule Validation System
          </h2>
          <p className="text-sm text-gray-500">Comprehensive analysis of business rules and code coherence</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('workflows')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'workflows' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Zap size={16} /> Workflow Rules
          </button>
          <button 
            onClick={() => setActiveTab('code')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'code' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Code size={16} /> Code Analysis
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'workflows' ? (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="text-sm text-gray-500 mb-1">Total Rules Analyzed</div>
                <div className="text-2xl font-bold text-gray-800">{workflowData.rules.length}</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="text-sm text-gray-500 mb-1">Issues Detected</div>
                <div className="text-2xl font-bold text-red-600">{issues.length}</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="text-sm text-gray-500 mb-1">Optimization Score</div>
                <div className="text-2xl font-bold text-green-600">
                  {Math.max(0, 100 - (issues.length * 10))}%
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <AlertTriangle size={18} />
                Detected Issues & Recommendations
              </h3>
              
              {issues.length === 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center text-green-800">
                  <CheckCircle className="mx-auto mb-2" size={32} />
                  <p className="font-medium">No workflow issues detected.</p>
                </div>
              ) : (
                issues.map(issue => (
                  <div key={issue.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${getSeverityColor(issue.severity)}`}>
                          {issue.severity}
                        </span>
                        <span className="font-semibold text-gray-800">{issue.title}</span>
                      </div>
                      <span className="text-xs text-gray-400 font-mono">{issue.id}</span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{issue.description}</p>
                    
                    {issue.suggestion && (
                      <div className="bg-blue-50 border border-blue-100 rounded p-3 flex gap-3">
                        <Info className="text-blue-500 flex-shrink-0 mt-0.5" size={16} />
                        <div>
                          <div className="text-xs font-semibold text-blue-700 uppercase mb-1">Recommendation</div>
                          <p className="text-sm text-blue-800">{issue.suggestion}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                      <span className="text-xs text-gray-400">Affected Rules:</span>
                      {issue.affectedRules.map(ruleId => (
                        <span key={ruleId} className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                          {ruleId}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex gap-6">
            <div className="flex-1 flex flex-col h-full">
              <div className="mb-2 flex justify-between items-center">
                <h3 className="font-semibold text-gray-700">Code Validator</h3>
                <span className="text-xs text-gray-400">JavaScript/TypeScript/Python supported</span>
              </div>
              <textarea 
                className="flex-1 w-full bg-gray-900 text-gray-100 font-mono text-sm p-4 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={codeSample}
                onChange={handleCodeChange}
                spellCheck={false}
              />
            </div>
            
            <div className="w-96 flex flex-col overflow-y-auto">
               <h3 className="font-semibold text-gray-700 mb-4">Analysis Report</h3>
               
               <div className="space-y-3">
                 {codeIssues.length === 0 ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center text-green-800">
                      <CheckCircle className="mx-auto mb-2" size={24} />
                      <p className="text-sm font-medium">No code issues found.</p>
                    </div>
                 ) : (
                   codeIssues.map((issue, idx) => (
                    <div key={idx} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm border-l-4 border-l-yellow-400">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-gray-700">{issue.title}</span>
                        <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">Line {issue.line}</span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{issue.description}</p>
                      <div className="text-xs bg-gray-50 p-2 rounded text-gray-500">
                        <span className="font-semibold text-gray-600">Fix: </span>
                        {issue.suggestion}
                      </div>
                    </div>
                   ))
                 )}
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RuleDashboard;

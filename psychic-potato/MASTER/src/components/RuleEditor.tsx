import React, { useState, useEffect } from 'react';
import { useRulesStore } from '../store/useRulesStore';
import { Rule, RuleType, RuleStatus } from '../types/rules';
import { ArrowLeft, Save } from 'lucide-react';

interface RuleEditorProps {
  ruleId?: string;
  onClose: () => void;
}

const RuleEditor: React.FC<RuleEditorProps> = ({ ruleId, onClose }) => {
  const { addRule, updateRule, getRule } = useRulesStore();
  
  const [formData, setFormData] = useState<Partial<Rule>>({
    name: '',
    description: '',
    rule_type: 'validation',
    status: 'draft',
    priority: 50,
    enabled: true,
    conditions: [],
    actions: [],
    tags: []
  });

  useEffect(() => {
    if (ruleId) {
      const existingRule = getRule(ruleId);
      if (existingRule) {
        setFormData(existingRule);
      }
    }
  }, [ruleId, getRule]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ruleId) {
      updateRule(ruleId, formData);
    } else {
      addRule(formData as any);
    }
    onClose();
  };

  return (
    <div className="h-full bg-white p-6 overflow-y-auto">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {ruleId ? 'Edit Rule' : 'Create New Rule'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        {/* Basic Info */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rule Type</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={formData.rule_type}
                onChange={e => setFormData({...formData, rule_type: e.target.value as RuleType})}
              >
                <option value="validation">Validation</option>
                <option value="automation">Automation</option>
                <option value="business">Business</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value as RuleStatus})}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Priority (1-100)</label>
               <input
                type="number"
                min="1"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={formData.priority}
                onChange={e => setFormData({...formData, priority: parseInt(e.target.value)})}
               />
            </div>
          </div>
        </div>

        {/* JSON Editors for Conditions/Actions (Simplified for MVP) */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
           <h2 className="text-lg font-semibold text-gray-800 mb-4">Logic Definition</h2>
           <div className="space-y-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Conditions (JSON)</label>
               <div className="text-xs text-gray-500 mb-2">Define rule triggers. Example: {`[{ "field": "status", "operator": "equals", "value": "active" }]`}</div>
               <textarea
                 rows={5}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                 value={JSON.stringify(formData.conditions, null, 2)}
                 onChange={e => {
                    try {
                        setFormData({...formData, conditions: JSON.parse(e.target.value)})
                    } catch (err) {
                        // Allow typing invalid JSON temporarily
                    }
                 }}
               />
             </div>

             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Actions (JSON)</label>
               <div className="text-xs text-gray-500 mb-2">Define execution steps. Example: {`[{ "type": "log", "params": { "level": "info" } }]`}</div>
               <textarea
                 rows={5}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                 value={JSON.stringify(formData.actions, null, 2)}
                 onChange={e => {
                    try {
                        setFormData({...formData, actions: JSON.parse(e.target.value)})
                    } catch (err) {
                        // Allow typing invalid JSON temporarily
                    }
                 }}
               />
             </div>
           </div>
        </div>

        <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Save size={18} />
              Save Rule
            </button>
        </div>
      </form>
    </div>
  );
};

export default RuleEditor;

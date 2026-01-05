import React, { useState } from 'react';
import { useRulesStore } from '../store/useRulesStore';
import { Search, Plus, Filter, Edit, Trash2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { RuleType, RuleStatus } from '../types/rules';

interface RulesListProps {
  onEdit: (id: string) => void;
  onCreate: () => void;
}

const RulesList: React.FC<RulesListProps> = ({ onEdit, onCreate }) => {
  const { rules, filter, setFilter, deleteRule } = useRulesStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRules = rules.filter(rule => {
    const matchesSearch = rule.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          rule.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filter.type || rule.rule_type === filter.type;
    const matchesStatus = !filter.status || rule.status === filter.status;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusIcon = (status: RuleStatus) => {
    switch (status) {
      case 'active': return <CheckCircle size={16} className="text-green-500" />;
      case 'inactive': return <XCircle size={16} className="text-gray-400" />;
      case 'draft': return <AlertCircle size={16} className="text-yellow-500" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rule Management</h1>
          <p className="text-sm text-gray-500">Define and manage business logic rules</p>
        </div>
        <button 
          onClick={onCreate}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          Create Rule
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search rules..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-500" />
          <select 
            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filter.type || ''}
            onChange={(e) => setFilter({ ...filter, type: e.target.value as RuleType || undefined })}
          >
            <option value="">All Types</option>
            <option value="validation">Validation</option>
            <option value="automation">Automation</option>
            <option value="business">Business</option>
          </select>

          <select 
            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filter.status || ''}
            onChange={(e) => setFilter({ ...filter, status: e.target.value as RuleStatus || undefined })}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Updated</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredRules.length === 0 ? (
               <tr>
                 <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                   No rules found matching your criteria.
                 </td>
               </tr>
            ) : (
              filteredRules.map((rule) => (
                <tr key={rule.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{rule.name}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">{rule.description}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full 
                      ${rule.rule_type === 'validation' ? 'bg-purple-100 text-purple-700' :
                        rule.rule_type === 'automation' ? 'bg-blue-100 text-blue-700' :
                        'bg-orange-100 text-orange-700'}`}>
                      {rule.rule_type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(rule.status)}
                      <span className="text-sm capitalize text-gray-700">{rule.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {rule.priority}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(rule.updated_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => onEdit(rule.id)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => deleteRule(rule.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RulesList;

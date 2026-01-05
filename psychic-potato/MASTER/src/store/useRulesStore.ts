import { create } from 'zustand';
import { Rule, RuleFilter } from '../types/rules';

interface RulesState {
  rules: Rule[];
  isLoading: boolean;
  error: string | null;
  filter: RuleFilter;

  // Lifecycle
  addRule: (rule: Omit<Rule, 'id' | 'created_at' | 'updated_at' | 'version'>) => void;
  updateRule: (id: string, updates: Partial<Rule>) => void;
  deleteRule: (id: string) => void;
  
  // Management
  setFilter: (filter: RuleFilter) => void;
  getRule: (id: string) => Rule | undefined;
}

// Mock Initial Data
const initialRules: Rule[] = [
  {
    id: 'rule_1',
    rule_type: 'validation',
    name: 'Device IP Validation',
    description: 'Ensure all active devices have a valid IP address assigned.',
    conditions: [
      { field: 'status', operator: 'equals', value: 'Active' },
      { field: 'ip_address', operator: 'exists', value: true }
    ],
    actions: [
      { type: 'log', params: { level: 'error', message: 'Missing IP for active device' } }
    ],
    priority: 90,
    enabled: true,
    tags: ['device', 'security'],
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1
  }
];

export const useRulesStore = create<RulesState>((set, get) => ({
  rules: initialRules,
  isLoading: false,
  error: null,
  filter: {},

  addRule: (ruleData) => {
    const newRule: Rule = {
      ...ruleData,
      id: `rule_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1
    };
    set((state) => ({ rules: [...state.rules, newRule] }));
  },

  updateRule: (id, updates) => {
    set((state) => ({
      rules: state.rules.map((rule) => 
        rule.id === id 
          ? { ...rule, ...updates, updated_at: new Date().toISOString(), version: rule.version + 1 }
          : rule
      )
    }));
  },

  deleteRule: (id) => {
    set((state) => ({
      rules: state.rules.filter((rule) => rule.id !== id)
    }));
  },

  setFilter: (filter) => set({ filter }),
  
  getRule: (id) => get().rules.find((r) => r.id === id),
}));

export type RuleType = 'validation' | 'automation' | 'business';
export type RuleStatus = 'active' | 'inactive' | 'draft';

export interface RuleCondition {
  field: string;
  operator: 'equals' | 'contains' | 'gt' | 'lt' | 'exists' | 'regex';
  value: any;
}

export interface RuleAction {
  type: 'log' | 'notify' | 'update_status' | 'trigger_job';
  params: Record<string, any>;
}

export interface Rule {
  id: string;
  rule_type: RuleType;
  name: string;
  description: string;
  conditions: RuleCondition[];
  actions: RuleAction[];
  priority: number;
  enabled: boolean;
  tags: string[];
  status: RuleStatus;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface RuleFilter {
  type?: RuleType;
  status?: RuleStatus;
  search?: string;
}

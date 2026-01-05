export interface Workflow {
  id: string;
  name: string;
  steps: any[];
}

export interface Rule {
  id: string;
  name: string;
  description: string;
  condition: string;
  action: string;
  params?: any;
  category: string;
  status?: string;
}

export interface Issue {
  id: string;
  type: 'conflict' | 'redundancy' | 'inefficiency' | 'optimization';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  affectedRules: string[];
  suggestion?: string;
}

export interface CodeIssue extends Issue {
  line?: number;
  column?: number;
  snippet?: string;
  file?: string;
}

export class CodeValidator {
  public analyze(code: string, language: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    
    issues.push(...this.checkNamingConventions(code, language));
    issues.push(...this.checkDocumentation(code, language));
    issues.push(...this.checkModularity(code));

    return issues;
  }

  private checkNamingConventions(code: string, language: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      // Simple heuristic for variable declarations
      // JS/TS: const my_var = ... (should be myVar)
      if (language === 'typescript' || language === 'javascript') {
        const match = line.match(/(?:const|let|var)\s+([a-z]+_[a-z]+)\s*=/);
        if (match) {
          issues.push({
            id: `naming-${index}`,
            type: 'inefficiency', // Coding standard violation
            severity: 'medium',
            title: 'Naming Convention Violation',
            description: `Variable '${match[1]}' uses snake_case. Use camelCase for ${language}.`,
            line: index + 1,
            affectedRules: ['naming-convention'],
            suggestion: `Rename to '${this.toCamelCase(match[1])}'`
          });
        }
      }
      // Python: camelCaseVariable = ... (should be snake_case)
      if (language === 'python') {
        const match = line.match(/^\s*([a-z]+[A-Z][a-zA-Z]*)\s*=/);
        if (match) {
          issues.push({
            id: `naming-${index}`,
            type: 'inefficiency',
            severity: 'medium',
            title: 'Naming Convention Violation',
            description: `Variable '${match[1]}' uses camelCase. Use snake_case for Python.`,
            line: index + 1,
            affectedRules: ['naming-convention'],
            suggestion: `Rename to '${this.toSnakeCase(match[1])}'`
          });
        }
      }
    });
    return issues;
  }

  private checkDocumentation(code: string, language: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    // Check for function definitions without preceding comments
    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
      let isFunc = false;
      if (['typescript', 'javascript'].includes(language)) {
        isFunc = /function\s+\w+/.test(line) || /const\s+\w+\s*=\s*\(.*\)\s*=>/.test(line);
      } else if (language === 'python') {
        isFunc = /def\s+\w+/.test(line);
      }

      if (isFunc) {
        // Check previous lines for comments
        const prevLine = index > 0 ? lines[index - 1].trim() : '';
        const hasDoc = prevLine.startsWith('//') || prevLine.startsWith('/*') || prevLine.startsWith('*') || prevLine.startsWith('#');
        
        if (!hasDoc) {
          issues.push({
            id: `doc-${index}`,
            type: 'inefficiency',
            severity: 'low',
            title: 'Missing Documentation',
            description: 'Function declaration found without preceding documentation.',
            line: index + 1,
            affectedRules: ['doc-completeness'],
            suggestion: 'Add a JSDoc/Docstring comment explaining the function purpose and parameters.'
          });
        }
      }
    });

    return issues;
  }

  private checkModularity(code: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = code.split('\n');
    
    // Simple check: File too long?
    if (lines.length > 300) {
      issues.push({
        id: 'mod-length',
        type: 'inefficiency',
        severity: 'low',
        title: 'File Too Long',
        description: `File has ${lines.length} lines, exceeding recommended limit of 300.`,
        affectedRules: ['modularity'],
        suggestion: 'Break down into smaller modules or components.'
      });
    }

    return issues;
  }

  private toCamelCase(str: string) {
    return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
  }

  private toSnakeCase(str: string) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}

export class RuleEngine {
  private rules: Rule[];
  private workflows: Workflow[];
  public codeValidator: CodeValidator;

  constructor(rules: Rule[], workflows: Workflow[]) {
    this.rules = rules;
    this.workflows = workflows;
    this.codeValidator = new CodeValidator();
  }

  public analyze(): Issue[] {
    const issues: Issue[] = [];
    
    issues.push(...this.detectConflicts());
    issues.push(...this.detectRedundancies());
    issues.push(...this.detectInefficiencies());

    return issues;
  }

  private detectConflicts(): Issue[] {
    const issues: Issue[] = [];
    // Group by condition
    const map = new Map<string, Rule[]>();
    
    this.rules.forEach(r => {
      if (!map.has(r.condition)) map.set(r.condition, []);
      map.get(r.condition)?.push(r);
    });

    map.forEach((group, condition) => {
      // Check for retention conflicts (Archive vs Retain)
      const retentionRules = group.filter(r => r.category === 'retention');
      if (retentionRules.length > 1) {
        // simplistic check: if actions are different
        const actions = new Set(retentionRules.map(r => r.action));
        if (actions.has('ARCHIVE_DATA') && actions.has('RETAIN_DATA')) {
          issues.push({
            id: `conf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'conflict',
            severity: 'high',
            title: 'Conflicting Data Retention Policies',
            description: `Rules [${retentionRules.map(r => r.name).join(', ')}] define contradictory actions for the same condition: "${condition}". One archives data while the other retains it.`,
            affectedRules: retentionRules.map(r => r.id),
            suggestion: 'Harmonize retention policies. Usually, "Retain" overrides "Archive" for compliance, but storage costs should be considered.'
          });
        }
      }
    });

    return issues;
  }

  private detectRedundancies(): Issue[] {
    const issues: Issue[] = [];
    const map = new Map<string, Rule[]>();
    
    this.rules.forEach(r => {
      const key = `${r.condition}|${r.action}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)?.push(r);
    });

    // Same condition AND same action type
    map.forEach((group, key) => {
      if (group.length > 1) {
        issues.push({
          id: `red-${Date.now()}-${Math.random()}`,
          type: 'redundancy',
          severity: 'medium',
          title: 'Redundant Rule Logic',
          description: `Multiple rules perform ${group[0].action} under condition "${group[0].condition}".`,
          affectedRules: group.map(r => r.id),
          suggestion: `Merge these rules into a single rule with multiple recipients or parameters: ${group.map(r => r.name).join(' + ')}`
        });
      }
    });

    // Similar conditions (broad overlap check - simplistic for now)
    // E.g., multiple notifications for same event
    const conditionMap = new Map<string, Rule[]>();
    this.rules.forEach(r => {
        if (!conditionMap.has(r.condition)) conditionMap.set(r.condition, []);
        conditionMap.get(r.condition)?.push(r);
    });

    conditionMap.forEach((group, condition) => {
        const notifications = group.filter(r => r.category === 'notification');
        if (notifications.length > 1) {
             issues.push({
                id: `opt-${Date.now()}-${Math.random()}`,
                type: 'optimization',
                severity: 'low',
                title: 'Multiple Notifications',
                description: `${notifications.length} separate notification rules trigger on "${condition}".`,
                affectedRules: notifications.map(r => r.id),
                suggestion: 'Consider consolidating into a single notification service call with a distribution list.'
             });
        }
    });

    return issues;
  }

  private detectInefficiencies(): Issue[] {
    const issues: Issue[] = [];
    
    // Check for obsolete rules
    const obsolete = this.rules.filter(r => r.status === 'obsolete' || r.status === 'deprecated');
    if (obsolete.length > 0) {
      issues.push({
        id: `obs-${Date.now()}`,
        type: 'inefficiency',
        severity: 'low',
        title: 'Obsolete Rules Detected',
        description: 'Rules marked as obsolete or deprecated are still present in the active set.',
        affectedRules: obsolete.map(r => r.id),
        suggestion: 'Remove these rules to improve processing performance.'
      });
    }

    return issues;
  }

  public getRule(id: string) {
    return this.rules.find(r => r.id === id);
  }
}

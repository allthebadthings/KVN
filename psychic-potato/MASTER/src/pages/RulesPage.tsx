import React, { useState } from 'react';
import RulesList from '../components/RulesList';
import RuleEditor from '../components/RuleEditor';

const RulesPage: React.FC = () => {
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleEdit = (id: string) => {
    setEditingRuleId(id);
    setIsCreating(false);
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingRuleId(null);
  };

  const handleClose = () => {
    setEditingRuleId(null);
    setIsCreating(false);
  };

  if (isCreating || editingRuleId) {
    return (
      <RuleEditor 
        ruleId={editingRuleId || undefined} 
        onClose={handleClose} 
      />
    );
  }

  return (
    <RulesList 
      onEdit={handleEdit} 
      onCreate={handleCreate} 
    />
  );
};

export default RulesPage;

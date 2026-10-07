import React from 'react';
import { CheckIcon } from './Icons';
import { PASSWORD_RULES } from '../utils';

interface PasswordRulesListProps {
  id: string;          // referenced by the password field's aria-describedby
  password: string;
}

// Live checklist of the password policy rules, shown under a new-password field.
// Used by Signup, Reset Password and Change Password so they always match.
const PasswordRulesList: React.FC<PasswordRulesListProps> = ({ id, password }) => (
  <ul id={id} className="mt-2 space-y-1">
    {PASSWORD_RULES.map((rule) => {
      const met = rule.test(password);
      return (
        <li
          key={rule.id}
          className={`flex items-center gap-2 text-sm ${met ? 'text-brand-light-blue' : 'text-gray-600'}`}
        >
          <span aria-hidden="true" className="w-4 flex-shrink-0 text-center">
            {met ? <CheckIcon className="w-4 h-4" /> : '•'}
          </span>
          {rule.label}
          <span className="sr-only">{met ? ' — done' : ' — not yet'}</span>
        </li>
      );
    })}
  </ul>
);

export default PasswordRulesList;

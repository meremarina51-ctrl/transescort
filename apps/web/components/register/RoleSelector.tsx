import { FC } from 'react';
import { OPTIONS } from './constants';
import { RegistrableRole } from './types';

interface IProps {
  value: RegistrableRole;
  onChange: (role: RegistrableRole) => void;
}

export const RoleSelector: FC<IProps> = ({ value, onChange }) => (
  <div>
    <label className="mb-2 block font-body text-xs uppercase tracking-wide text-white/40">
      Я регистрируюсь как
    </label>
    <div className="grid grid-cols-2 gap-2">
      {OPTIONS.map(([role, label]) => (
        <button
          key={role}
          type="button"
          onClick={() => onChange(role)}
          className={`rounded-lg border py-2.5 font-body text-sm font-medium transition-colors ${value === role
              ? 'border-accent/40 bg-accent/10 text-accent'
              : 'border-white/10 text-white/40 hover:text-white/70'
            }`}
        >
          {label}
        </button>
      ))}
    </div>
  </div>
);

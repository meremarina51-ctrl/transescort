import { FC } from 'react';
import { Select } from '@/components/Select';
import { RequiredMark } from './RequiredMark';
import { CONTACT_METHOD_OPTIONS } from './constants';

interface IProps {
  contactMethod: string | null;
  onContactMethodChange: (value: string | null) => void;
  contactValue: string;
  onContactValueChange: (value: string) => void;
}

export const ContactFields: FC<IProps> = ({ contactMethod, onContactMethodChange, contactValue, onContactValueChange }) => (
  <>
    <div>
      <label className="mb-1 block font-body text-xs uppercase tracking-wide text-white/40">
        Способ связи
        <RequiredMark />
      </label>
      <Select value={contactMethod} onChange={onContactMethodChange} options={CONTACT_METHOD_OPTIONS} />
    </div>
    <div>
      <label className="mb-1 block font-body text-xs uppercase tracking-wide text-white/40">
        Контакт
        <RequiredMark />
      </label>
      <input
        type="text"
        value={contactValue}
        onChange={(e) => onContactValueChange(e.target.value)}
        required
        placeholder="@username, номер или email"
        className="input"
      />
    </div>
  </>
);

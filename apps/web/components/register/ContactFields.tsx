import { FC } from 'react';
import { useTranslations } from 'next-intl';
import { Select } from '@/components/ui/Select';
import { RequiredMark } from './RequiredMark';
import { getContactMethodOptions } from './constants';

interface IProps {
  contactMethod: string | null;
  onContactMethodChange: (value: string | null) => void;
  contactValue: string;
  onContactValueChange: (value: string) => void;
}

export const ContactFields: FC<IProps> = ({ contactMethod, onContactMethodChange, contactValue, onContactValueChange }) => {
  const t = useTranslations('auth.register');
  const CONTACT_METHOD_OPTIONS = getContactMethodOptions(t);

  return (
    <>
      <div>
        <label className="mb-1 block font-body text-xs uppercase tracking-wide text-white/40">
          {t('contactMethodLabel')}
          <RequiredMark />
        </label>
        <Select value={contactMethod} onChange={onContactMethodChange} options={CONTACT_METHOD_OPTIONS} />
      </div>
      <div>
        <label className="mb-1 block font-body text-xs uppercase tracking-wide text-white/40">
          {t('contactValueLabel')}
          <RequiredMark />
        </label>
        <input
          type="text"
          value={contactValue}
          onChange={(e) => onContactValueChange(e.target.value)}
          required
          placeholder={t('contactValuePlaceholder')}
          className="input"
        />
      </div>
    </>
  );
};

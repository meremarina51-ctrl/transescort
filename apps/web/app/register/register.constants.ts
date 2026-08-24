import { Role } from '@/lib/enums';

export type RegistrableRole = Role.Client | Role.Performer;

export const CONTACT_METHOD_OPTIONS = [
  { value: 'telegram', label: 'Telegram' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Телефон' },
  { value: 'whatsapp', label: 'WhatsApp' },
];

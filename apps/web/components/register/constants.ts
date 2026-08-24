import { Role } from "@/lib/enums";

export const CONTACT_METHOD_OPTIONS = [
  { value: 'telegram', label: 'Telegram' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Телефон' },
  { value: 'whatsapp', label: 'WhatsApp' },
];

export const OPTIONS = [
  [Role.Client, 'Клиент'],
  [Role.Performer, 'Исполнитель'],
] as const;

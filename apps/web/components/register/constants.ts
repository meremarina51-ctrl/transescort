import { Role } from "@/lib/enums";

type Translate = (key: string) => string;

export const getContactMethodOptions = (t: Translate) => [
  { value: 'telegram', label: t('contactMethodTelegram') },
  { value: 'email', label: t('contactMethodEmail') },
  { value: 'phone', label: t('contactMethodPhone') },
  { value: 'whatsapp', label: t('contactMethodWhatsapp') },
];

export const getRoleOptions = (t: Translate) => [
  [Role.Client, t('roleClient')],
  [Role.Performer, t('rolePerformer')],
] as const;

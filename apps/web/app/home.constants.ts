import { Lock, BadgeCheck, Smartphone, type LucideIcon } from 'lucide-react';

export interface Feature {
  Icon: LucideIcon;
  title: string;
  text: string;
}

export const FEATURES: Feature[] = [
  {
    Icon: Lock,
    title: 'Приватность',
    text: 'Полная анонимность и конфиденциальность всех взаимодействий',
  },
  {
    Icon: BadgeCheck,
    title: 'Верификация',
    text: 'Каждая модель проходит тщательную проверку подлинности и качества',
  },
  {
    Icon: Smartphone,
    title: 'Удобная платформа',
    text: 'Современный интерфейс с мгновенной связью',
  },
];

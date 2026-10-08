import { Globe } from 'lucide-react';
import type { NavItem } from '@/components/SidebarShell';
import { ROUTES } from '@/lib/routes';

/** Shared "back to the public site" link, shown in the header of every cabinet-style sidebar shell. */
export const getSiteLink = (t: (key: string) => string): NavItem => ({ href: ROUTES.HOME, label: t('siteLink'), icon: Globe });

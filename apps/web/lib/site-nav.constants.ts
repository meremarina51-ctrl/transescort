import { Globe } from 'lucide-react';
import type { NavItem } from '@/components/SidebarShell';

/** Shared "back to the public site" link, shown in the header of every cabinet-style sidebar shell. */
export const SITE_LINK: NavItem = { href: '/', label: 'На сайт', icon: Globe };

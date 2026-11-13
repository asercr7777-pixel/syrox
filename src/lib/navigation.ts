import {
  LayoutDashboard,
  Target,
  Dumbbell,
  TrendingUp,
  Trophy,
  UserRound,
  Settings,
} from 'lucide-react';

export type ViewId =
  | 'dashboard'
  | 'quests'
  | 'workout'
  | 'evolution'
  | 'challenges'
  | 'profile'
  | 'settings';

export interface NavItem {
  id: ViewId;
  label: string;
  shortLabel: string;
  icon: typeof LayoutDashboard;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', shortLabel: 'Home', icon: LayoutDashboard },
  { id: 'quests', label: 'Quests', shortLabel: 'Quests', icon: Target },
  { id: 'workout', label: 'Training', shortLabel: 'Training', icon: Dumbbell },
  { id: 'evolution', label: 'Evolution', shortLabel: 'Evolution', icon: TrendingUp },
  { id: 'challenges', label: 'Challenges', shortLabel: 'Challenges', icon: Trophy },
  { id: 'profile', label: 'Hunter Profile', shortLabel: 'Profile', icon: UserRound },
  { id: 'settings', label: 'Settings', shortLabel: 'Settings', icon: Settings },
];

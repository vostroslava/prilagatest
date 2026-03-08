import type { LucideIcon } from "lucide-react";
import {
  ArrowDownToLine,
  ArrowRightLeft,
  BarChart3,
  Bell,
  BookOpenText,
  BrainCircuit,
  Flame,
  GitCompareArrows,
  Home,
  Info,
  Plus,
  Search,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";

export interface DashboardNavItem {
  key: string;
  label: string;
  icon?: LucideIcon;
}

export interface DashboardTestBlockPreset {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  accent: "cyan" | "teal" | "orange";
  fallbackProgress: number;
}

export interface DashboardQuickActionPreset {
  key: string;
  label: string;
  icon: LucideIcon;
}

export interface DashboardJourneyStep {
  key: string;
  label: string;
}

export interface DashboardComparisonPreset {
  id: string;
  leftName: string;
  rightName: string;
  dateLabel: string;
  connected: boolean;
  leftTone: string;
  rightTone: string;
}

export const DASHBOARD_TOP_NAV: DashboardNavItem[] = [
  { key: "home", label: "Главная" },
  { key: "tests", label: "Тесты" },
  { key: "profile", label: "Мой профиль" },
  { key: "compare", label: "Сравнение" },
  { key: "export", label: "Экспорт" },
];

export const DASHBOARD_SIDEBAR_NAV: DashboardNavItem[] = [
  { key: "home", label: "Главная", icon: Home },
  { key: "tests", label: "Тесты", icon: BookOpenText },
  { key: "profile", label: "Мой профиль", icon: UserRound },
  { key: "compare", label: "Сравнение", icon: UsersRound },
  { key: "export", label: "Экспорт", icon: ArrowDownToLine },
  { key: "analytics", label: "Аналитика", icon: BarChart3 },
];

export const DASHBOARD_TEST_BLOCK_PRESETS: DashboardTestBlockPreset[] = [
  {
    id: "big-five",
    title: "Большая пятёрка",
    subtitle: "50 вопросов",
    icon: Sparkles,
    accent: "cyan",
    fallbackProgress: 30,
  },
  {
    id: "ipip-ipc",
    title: "Межличностный стиль",
    subtitle: "32 вопроса",
    icon: UsersRound,
    accent: "teal",
    fallbackProgress: 12,
  },
  {
    id: "conflict-profile",
    title: "Конфликтный профиль",
    subtitle: "12 вопросов",
    icon: Flame,
    accent: "orange",
    fallbackProgress: 0,
  },
];

export const DASHBOARD_QUICK_ACTIONS: DashboardQuickActionPreset[] = [
  { key: "create", label: "Создать профиль", icon: Plus },
  { key: "compare", label: "Сравнить людей", icon: ArrowRightLeft },
  { key: "export", label: "Экспорт данных", icon: ArrowDownToLine },
  { key: "info", label: "История тестов", icon: Info },
];

export const DASHBOARD_TOP_ACTIONS = [Search, Bell, BrainCircuit] as const;

export const DASHBOARD_JOURNEY_STEPS: DashboardJourneyStep[] = [
  { key: "intro", label: "Знакомство" },
  { key: "big-five", label: "Большая\nпятёрка" },
  { key: "ipip-ipc", label: "Межличн. стиль" },
  { key: "conflict", label: "Конфликты" },
  { key: "profile", label: "Профиль" },
];

export const DASHBOARD_RECENT_COMPARISONS: DashboardComparisonPreset[] = [
  {
    id: "alex-kate",
    leftName: "Алексей",
    rightName: "Екатерина",
    dateLabel: "12.04.2025",
    connected: true,
    leftTone: "from-cyan-400 to-sky-500",
    rightTone: "from-emerald-300 to-cyan-500",
  },
  {
    id: "alex-ivan",
    leftName: "Алексей",
    rightName: "Иван",
    dateLabel: "05.04.2025",
    connected: true,
    leftTone: "from-cyan-400 to-sky-500",
    rightTone: "from-orange-300 to-amber-500",
  },
];

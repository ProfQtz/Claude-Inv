import {
  Award,
  Brain,
  Calculator,
  CalendarDays,
  Crosshair,
  Dice5,
  Fish,
  Flame,
  GraduationCap,
  Hand,
  Layers,
  type LucideIcon,
  Medal,
  PartyPopper,
  Repeat,
  Spade,
  Sparkles,
  Swords,
  Target,
  Trophy,
  TrendingUp,
} from "lucide-react";

/** Icons referenced by name from course data, drills and achievements. */
export const ICONS: Record<string, LucideIcon> = {
  spade: Spade,
  trophy: Trophy,
  layers: Layers,
  swords: Swords,
  hand: Hand,
  calculator: Calculator,
  crosshair: Crosshair,
  brain: Brain,
  medal: Medal,
  dice: Dice5,
  repeat: Repeat,
  target: Target,
  party: PartyPopper,
  sparkles: Sparkles,
  graduation: GraduationCap,
  flame: Flame,
  calendar: CalendarDays,
  award: Award,
  trending: TrendingUp,
  fish: Fish,
};

export function NamedIcon({ name, size = 20, strokeWidth = 2 }: { name: string; size?: number; strokeWidth?: number }) {
  const Icon = ICONS[name] ?? Spade;
  return <Icon size={size} strokeWidth={strokeWidth} aria-hidden="true" />;
}

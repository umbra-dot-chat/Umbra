import React, { forwardRef, useMemo, useCallback, useState } from 'react';
import { View, Pressable, Text as RNText } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

type CalendarSize = 'sm' | 'md' | 'lg';
const calendarSizeMap: Record<CalendarSize, { cellSize: number; fontSize: number; headerFontSize: number; gap: number; padding: number }> = {
  sm: { cellSize: 28, fontSize: defaultTypography.sizes.xs.fontSize, headerFontSize: 13, gap: defaultSpacing['2xs'], padding: defaultSpacing.sm },
  md: { cellSize: 36, fontSize: defaultTypography.sizes.sm.fontSize, headerFontSize: 14, gap: defaultSpacing.xs, padding: defaultSpacing.md },
  lg: { cellSize: 44, fontSize: defaultTypography.sizes.base.fontSize, headerFontSize: 16, gap: defaultSpacing.xs, padding: defaultSpacing.lg },
};

export interface CalendarProps {
  value?: Date; defaultValue?: Date; onChange?: (date: Date) => void; size?: CalendarSize;
  minDate?: Date; maxDate?: Date; disabledDates?: Date[]; locale?: string;
  weekStartsOn?: 0 | 1; showOutsideDays?: boolean; style?: ViewStyle;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function buildGrid(year: number, month: number, weekStartsOn: 0 | 1): Date[] {
  const first = new Date(year, month, 1);
  let off = first.getDay() - weekStartsOn; if (off < 0) off += 7;
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) days.push(new Date(year, month, 1 - off + i));
  return days;
}

function getDayHeaders(locale: string, weekStartsOn: 0 | 1): string[] {
  const h: string[] = []; const base = new Date(1970, 0, 4);
  const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short' });
  for (let i = 0; i < 7; i++) {
    const d = new Date(base); d.setDate(base.getDate() + ((weekStartsOn + i) % 7));
    h.push(fmt.format(d).slice(0, 2));
  }
  return h;
}

export const Calendar = forwardRef<View, CalendarProps>(function Calendar(
  { value, defaultValue, onChange, size = 'md', minDate, maxDate, disabledDates,
    locale = 'en-US', weekStartsOn = 0, showOutsideDays = true, style: userStyle }, ref,
) {
  const { theme } = useTheme();
  const tc = theme.colors; const cfg = calendarSizeMap[size];
  const [intVal, setIntVal] = useState<Date | undefined>(defaultValue);
  const sel = value !== undefined ? value : intVal;
  const today = useMemo(() => new Date(), []);
  const init = sel ?? defaultValue ?? today;
  const [dispMonth, setDispMonth] = useState(new Date(init.getFullYear(), init.getMonth(), 1));
  const dY = dispMonth.getFullYear(); const dM = dispMonth.getMonth();

  const label = useMemo(() => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(dispMonth), [locale, dispMonth]);
  const headers = useMemo(() => getDayHeaders(locale, weekStartsOn), [locale, weekStartsOn]);
  const grid = useMemo(() => buildGrid(dY, dM, weekStartsOn), [dY, dM, weekStartsOn]);

  const isDisabled = useCallback((d: Date) => {
    if (minDate && d < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())) return true;
    if (maxDate && d > new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate())) return true;
    return disabledDates ? disabledDates.some((x) => isSameDay(x, d)) : false;
  }, [minDate, maxDate, disabledDates]);

  const prev = useCallback(() => setDispMonth((p) => new Date(p.getFullYear(), p.getMonth() - 1, 1)), []);
  const next = useCallback(() => setDispMonth((p) => new Date(p.getFullYear(), p.getMonth() + 1, 1)), []);

  const onDay = useCallback((d: Date) => {
    if (isDisabled(d)) return;
    if (d.getMonth() !== dM) setDispMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    if (value === undefined) setIntVal(d);
    onChange?.(d);
  }, [isDisabled, dM, value, onChange]);

  const gw = cfg.cellSize * 7 + cfg.gap * 6;
  const ic = cfg.cellSize < 36 ? 16 : 20;

  return (
    <View ref={ref} style={[{ padding: cfg.padding, alignSelf: 'flex-start' }, userStyle]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: cfg.gap * 2, width: gw }}>
        <Pressable onPress={prev} accessibilityLabel="Previous month" style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: defaultRadii.md }}>
          <Svg width={ic} height={ic} viewBox="0 0 24 24" fill="none"><Path d="M15 18l-6-6 6-6" stroke={tc.text.secondary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>
        </Pressable>
        <RNText style={{ fontSize: cfg.headerFontSize, fontWeight: defaultTypography.weights.semibold, color: tc.text.primary } as TextStyle}>{label}</RNText>
        <Pressable onPress={next} accessibilityLabel="Next month" style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: defaultRadii.md }}>
          <Svg width={ic} height={ic} viewBox="0 0 24 24" fill="none"><Path d="M9 18l6-6-6-6" stroke={tc.text.secondary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: gw, gap: cfg.gap }}>
        {headers.map((h, i) => (
          <View key={'h-'+i} style={{ width: cfg.cellSize, height: cfg.cellSize, alignItems: 'center', justifyContent: 'center' }}>
            <RNText style={{ fontSize: cfg.fontSize - 2, fontWeight: defaultTypography.weights.semibold, color: tc.text.muted } as TextStyle}>{h}</RNText>
          </View>
        ))}
        {grid.map((d, i) => {
          const out = d.getMonth() !== dM;
          const dis = isDisabled(d);
          const isSel = sel ? isSameDay(d, sel) : false;
          const isToday = isSameDay(d, today);
          if (out && !showOutsideDays) return <View key={'e-'+i} style={{ width: cfg.cellSize, height: cfg.cellSize }} />;
          return (
            <Pressable key={d.getFullYear()+'-'+d.getMonth()+'-'+d.getDate()} onPress={() => onDay(d)} disabled={dis}
              style={({ pressed }) => ({
                width: cfg.cellSize, height: cfg.cellSize, alignItems: 'center', justifyContent: 'center',
                borderRadius: cfg.cellSize / 2,
                backgroundColor: isSel ? tc.accent.primary : pressed ? tc.accent.highlight : 'transparent',
                opacity: dis ? 0.3 : out ? 0.4 : 1,
                borderWidth: isToday && !isSel ? 1 : 0,
                borderColor: isToday && !isSel ? tc.text.muted : undefined,
              })}>
              <RNText style={{ fontSize: cfg.fontSize, fontWeight: isSel || isToday ? '600' : '400',
                color: isSel ? tc.text.inverse : tc.text.primary } as TextStyle}>
                {d.getDate()}
              </RNText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
});

Calendar.displayName = 'Calendar';

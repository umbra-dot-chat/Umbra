import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import { View, Pressable, Modal, FlatList, SafeAreaView, StyleSheet, Text as RNText } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

type TimePickerSize = 'sm' | 'md' | 'lg';
type TimePickerFormat = '12h' | '24h';
const sizeMap: Record<TimePickerSize, { height: number; fontSize: number; paddingX: number; iconSize: number; colW: number }> = {
  sm: { height: 32, fontSize: defaultTypography.sizes.sm.fontSize, paddingX: 10, iconSize: 14, colW: 52 },
  md: { height: 40, fontSize: defaultTypography.sizes.sm.fontSize, paddingX: 14, iconSize: 16, colW: 60 },
  lg: { height: 48, fontSize: defaultTypography.sizes.base.fontSize, paddingX: 16, iconSize: 18, colW: 72 },
};

export interface TimePickerProps {
  value?: string; defaultValue?: string; onChange?: (time: string) => void;
  size?: TimePickerSize; format?: TimePickerFormat; minuteStep?: number;
  placeholder?: string; disabled?: boolean; label?: string; error?: string | boolean; style?: ViewStyle;
}

function parseTime(t: string) { const m = t.match(/^(\d{1,2}):(\d{2})$/); if (!m) return null; const h = +m[1], mi = +m[2]; return h >= 0 && h <= 23 && mi >= 0 && mi <= 59 ? { hour24: h, minute: mi } : null; }
function to12h(h24: number) { const p: 'AM'|'PM' = h24 >= 12 ? 'PM' : 'AM'; let h = h24 % 12; if (!h) h = 12; return { hour12: h, period: p }; }
function to24h(h12: number, p: 'AM'|'PM') { return p === 'AM' ? (h12 === 12 ? 0 : h12) : (h12 === 12 ? 12 : h12 + 12); }
function pad(n: number) { return n.toString().padStart(2, '0'); }
function fmtDisplay(t: string, f: TimePickerFormat) { const p = parseTime(t); if (!p) return ''; if (f === '24h') return pad(p.hour24)+':'+pad(p.minute); const { hour12, period } = to12h(p.hour24); return hour12+':'+pad(p.minute)+' '+period; }

const IH = 44;

export const TimePicker = forwardRef<View, TimePickerProps>(function TimePicker(
  { value: cv, defaultValue, onChange, size = 'md', format = '12h', minuteStep = 1,
    placeholder = 'Select time', disabled = false, label, error, style: us }, ref,
) {
  const { theme } = useTheme();
  const tc = theme.colors; const cfg = sizeMap[size];
  const isCtrl = cv !== undefined;
  const [iv, setIv] = useState<string|undefined>(defaultValue);
  const val = isCtrl ? cv : iv;
  const [open, setOpen] = useState(false);
  const hasErr = !!error; const errMsg = typeof error === 'string' ? error : undefined;
  const parsed = val ? parseTime(val) : null;
  const sH24 = parsed?.hour24 ?? null; const sMin = parsed?.minute ?? null;
  const s12 = sH24 !== null ? to12h(sH24) : null;
  const hours = useMemo(() => format === '24h' ? Array.from({length:24},(_,i)=>i) : Array.from({length:12},(_,i)=>i+1), [format]);
  const mins = useMemo(() => { const r: number[] = []; for (let i=0;i<60;i+=minuteStep) r.push(i); return r; }, [minuteStep]);
  const commit = useCallback((h: number, m: number) => { const s = pad(h)+':'+pad(m); if (!isCtrl) setIv(s); onChange?.(s); }, [isCtrl, onChange]);
  const onHour = useCallback((h: number) => { const m = sMin ?? 0; format === '24h' ? commit(h,m) : commit(to24h(h, s12?.period??'AM'),m); }, [format, sMin, s12, commit]);
  const onMin = useCallback((m: number) => { commit(sH24 ?? (format==='24h'?0:12), m); }, [format, sH24, commit]);
  const onPeriod = useCallback((p: 'AM'|'PM') => { commit(to24h(s12?.hour12??12, p), sMin??0); }, [s12, sMin, commit]);

  const tStyle = useMemo<ViewStyle>(() => ({ flexDirection:'row', alignItems:'center', height:cfg.height, paddingHorizontal:cfg.paddingX, borderRadius:defaultRadii.md, borderWidth:1, borderColor: hasErr ? tc.status.danger : tc.border.subtle, backgroundColor:tc.background.surface, gap:defaultSpacing.sm, opacity: disabled?0.4:1 }), [cfg,hasErr,tc,disabled]);
  const disp = val ? fmtDisplay(val, format) : '';

  const renderCol = (data: (number|string)[], selVal: number|string|null, onSel: (v:any)=>void, kp: string) => (
    <FlatList data={data} keyExtractor={(it) => kp+'-'+it} showsVerticalScrollIndicator={false}
      style={{ width: cfg.colW, maxHeight: IH*5 }}
      getItemLayout={(_,idx) => ({ length:IH, offset:IH*idx, index:idx })}
      renderItem={({ item }) => {
        const isSel = item === selVal;
        return (<Pressable onPress={() => onSel(item)} style={({ pressed }) => ({ height:IH, alignItems:'center', justifyContent:'center', backgroundColor: isSel?tc.accent.highlight : pressed?tc.accent.highlight:'transparent', borderRadius:defaultRadii.md })}>
          <RNText style={{ fontSize:cfg.fontSize, fontWeight: isSel?'600':'400', color: isSel?tc.accent.primary:tc.text.onRaised } as TextStyle}>
            {typeof item === 'number' ? (kp==='h' && format==='12h' ? String(item) : pad(item)) : item}
          </RNText>
        </Pressable>);
      }} />
  );

  return (
    <View ref={ref} style={[{gap:defaultSpacing.sm}, us]}>
      {label && <RNText style={{fontSize:defaultTypography.sizes.sm.fontSize,fontWeight:defaultTypography.weights.medium,color:tc.text.primary} as TextStyle}>{label}</RNText>}
      <Pressable onPress={() => !disabled && setOpen(true)} disabled={disabled} accessibilityRole="button" style={tStyle}>
        <Svg width={cfg.iconSize} height={cfg.iconSize} viewBox="0 0 24 24" fill="none"><Path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke={tc.text.secondary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>
        <RNText style={{flex:1,fontSize:cfg.fontSize,color:disp?tc.text.primary:tc.text.muted} as TextStyle} numberOfLines={1}>{disp || placeholder}</RNText>
      </Pressable>
      {errMsg && <RNText style={{fontSize:defaultTypography.sizes.xs.fontSize,color:tc.status.danger} as TextStyle}>{errMsg}</RNText>}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)} statusBarTranslucent>
        <Pressable style={[StyleSheet.absoluteFill,{backgroundColor:'rgba(0,0,0,0.5)'}]} onPress={() => setOpen(false)}>
          <SafeAreaView style={{flex:1,justifyContent:'center',alignItems:'center'}}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={{flexDirection:'row',backgroundColor:tc.background.raised,borderRadius:defaultRadii.xl,overflow:'hidden',padding:defaultSpacing.sm,gap:defaultSpacing.xs,shadowColor:'#000',shadowOffset:{width:0,height:8},shadowOpacity:0.2,shadowRadius:24,elevation:8}}>
                {renderCol(hours, format==='24h'?sH24:s12?.hour12??null, onHour, 'h')}
                <View style={{width:1,backgroundColor:tc.border.subtle,marginVertical:defaultSpacing.sm}} />
                {renderCol(mins, sMin, onMin, 'm')}
                {format==='12h' && <><View style={{width:1,backgroundColor:tc.border.subtle,marginVertical:defaultSpacing.sm}} />{renderCol(['AM','PM'], s12?.period??null, onPeriod, 'p')}</>}
              </View>
            </Pressable>
          </SafeAreaView>
        </Pressable>
      </Modal>
    </View>
  );
});

TimePicker.displayName = 'TimePicker';

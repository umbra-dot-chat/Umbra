import React, { forwardRef, useMemo, useState, useCallback, useEffect } from 'react';
import { View, Pressable, Modal, ScrollView, SafeAreaView, StyleSheet, Text as RNText } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import Svg, { Path, Polyline } from 'react-native-svg';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

type DRPSize = 'sm' | 'md' | 'lg';
export interface DateRange { start: Date | null; end: Date | null; }
const sizeMap: Record<DRPSize, { height: number; fontSize: number; paddingX: number; iconSize: number; cellSize: number; hFs: number }> = {
  sm: { height: 32, fontSize: defaultTypography.sizes.sm.fontSize, paddingX: 10, iconSize: 14, cellSize: 28, hFs: 13 },
  md: { height: 40, fontSize: defaultTypography.sizes.sm.fontSize, paddingX: 14, iconSize: 16, cellSize: 36, hFs: 14 },
  lg: { height: 48, fontSize: defaultTypography.sizes.base.fontSize, paddingX: 16, iconSize: 18, cellSize: 44, hFs: 16 },
};

export interface DateRangePickerProps {
  value?: DateRange; defaultValue?: DateRange; onChange?: (r: DateRange) => void;
  size?: DRPSize; placeholder?: string; minDate?: Date; maxDate?: Date;
  disabled?: boolean; label?: string; style?: ViewStyle;
}

const DN = ['Su','Mo','Tu','We','Th','Fr','Sa'];
const MN = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function isSameDay(a: Date, b: Date) { return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
function isBefore(a: Date, b: Date) { return new Date(a.getFullYear(),a.getMonth(),a.getDate()).getTime() < new Date(b.getFullYear(),b.getMonth(),b.getDate()).getTime(); }
function isBetween(d: Date, s: Date, e: Date) { const dt=new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime(); return dt > new Date(s.getFullYear(),s.getMonth(),s.getDate()).getTime() && dt < new Date(e.getFullYear(),e.getMonth(),e.getDate()).getTime(); }
function dim(y: number, m: number) { return new Date(y, m+1, 0).getDate(); }
function fdow(y: number, m: number) { return new Date(y, m, 1).getDay(); }
function fds(d: Date) { const ms=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']; return ms[d.getMonth()]+' '+d.getDate(); }

function CalMonth({ year, month, rs, re, onPress, minD, maxD, cs, fs, tc }: any) {
  const dm = dim(year, month); const fd = fdow(year, month);
  const cells: {date:Date;out:boolean}[] = [];
  const pd = dim(year, month-1);
  for (let i=fd-1;i>=0;i--) cells.push({date:new Date(year,month-1,pd-i),out:true});
  for (let d=1;d<=dm;d++) cells.push({date:new Date(year,month,d),out:false});
  const rem = 42 - cells.length;
  for (let d=1;d<=rem;d++) cells.push({date:new Date(year,month+1,d),out:true});
  const gw = cs * 7 + 2 * 6;
  return (
    <View style={{width:gw}}>
      <View style={{flexDirection:'row',flexWrap:'wrap',gap:defaultSpacing['2xs']}}>
        {DN.map((d) => <View key={d} style={{width:cs,height:cs,alignItems:'center',justifyContent:'center'}}><RNText style={{fontSize:fs-2,fontWeight:defaultTypography.weights.semibold,color:tc.text.muted} as TextStyle}>{d}</RNText></View>)}
        {cells.map((c,idx) => {
          const dis = c.out || (minD && isBefore(c.date,minD)) || (maxD && isBefore(maxD,c.date));
          const isS = rs && isSameDay(c.date,rs); const isE = re && isSameDay(c.date,re);
          const inR = rs && re && isBetween(c.date,rs,re);
          const isT = isSameDay(c.date, new Date());
          let bg = 'transparent';
          if (isS || isE) bg = tc.accent.primary;
          else if (inR) bg = tc.accent.highlight;
          return (<Pressable key={idx} onPress={() => !dis && onPress(c.date)} disabled={dis}
            style={{width:cs,height:cs,alignItems:'center',justifyContent:'center',borderRadius:isS||isE?cs/2:inR?4:cs/2,backgroundColor:bg,opacity:dis?0.3:1,borderWidth:isT&&!isS&&!isE?1:0,borderColor:isT?tc.text.muted:undefined}}>
            <RNText style={{fontSize:fs,fontWeight:isS||isE||isT?'600':'400',color:isS||isE?tc.text.inverse:tc.text.primary} as TextStyle}>{c.date.getDate()}</RNText>
          </Pressable>);
        })}
      </View>
    </View>
  );
}

export const DateRangePicker = forwardRef<View, DateRangePickerProps>(function DateRangePicker(
  { value: cv, defaultValue, onChange, size='md', placeholder='Select dates', minDate, maxDate, disabled=false, label, style: us }, ref,
) {
  const { theme } = useTheme();
  const tc = theme.colors; const cfg = sizeMap[size];
  const isCtrl = cv !== undefined;
  const [iv, setIv] = useState<DateRange>(defaultValue ?? {start:null,end:null});
  const cr = isCtrl ? cv! : iv;
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<'start'|'end'>('start');
  const [pending, setPending] = useState<Date|null>(null);
  const now = new Date();
  const [dY, setDY] = useState(cr.start?.getFullYear() ?? now.getFullYear());
  const [dM, setDM] = useState(cr.start?.getMonth() ?? now.getMonth());
  const rY = dM===11?dY+1:dY; const rM = dM===11?0:dM+1;

  const goPrev = useCallback(() => setDM(p => { if(p===0){setDY(y=>y-1);return 11;} return p-1; }), []);
  const goNext = useCallback(() => setDM(p => { if(p===11){setDY(y=>y+1);return 0;} return p+1; }), []);

  const onDatePress = useCallback((d: Date) => {
    if (phase==='start') { setPending(d); setPhase('end'); }
    else { const s=pending!; if(isBefore(d,s)){setPending(d);setPhase('end');return;} const nr={start:s,end:d}; if(!isCtrl) setIv(nr); onChange?.(nr); setPending(null); setPhase('start'); setOpen(false); }
  }, [phase, pending, isCtrl, onChange]);

  const as = phase==='end' ? pending : cr.start;
  const ae = phase==='end' ? null : cr.end;

  useEffect(() => { if(cr.start){setDY(cr.start.getFullYear());setDM(cr.start.getMonth());} }, [cr.start?.getTime()]);

  const hv = cr.start != null && cr.end != null;
  const tStyle = useMemo<ViewStyle>(() => ({flexDirection:'row',alignItems:'center',height:cfg.height,paddingHorizontal:cfg.paddingX,borderRadius:defaultRadii.md,borderWidth:1,borderColor:tc.border.subtle,backgroundColor:tc.background.surface,gap:defaultSpacing.sm,opacity:disabled?0.4:1}), [cfg,tc,disabled]);

  const closeAndReset = useCallback(() => { setOpen(false); if(phase==='end'){setPending(null);setPhase('start');} }, [phase]);

  return (
    <View ref={ref} style={[{gap:defaultSpacing.sm},us]}>
      {label && <RNText style={{fontSize:defaultTypography.sizes.sm.fontSize,fontWeight:defaultTypography.weights.medium,color:tc.text.primary} as TextStyle}>{label}</RNText>}
      <Pressable onPress={() => !disabled && setOpen(true)} disabled={disabled} accessibilityRole="button" style={tStyle}>
        <Svg width={cfg.iconSize} height={cfg.iconSize} viewBox="0 0 24 24" fill="none"><Path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke={tc.text.secondary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>
        <RNText style={{flex:1,fontSize:cfg.fontSize,color:hv?tc.text.primary:tc.text.muted} as TextStyle} numberOfLines={1}>
          {hv && cr.start && cr.end ? fds(cr.start)+' – '+fds(cr.end) : placeholder}
        </RNText>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={closeAndReset} statusBarTranslucent>
        <Pressable style={[StyleSheet.absoluteFill,{backgroundColor:'rgba(0,0,0,0.5)'}]} onPress={closeAndReset}>
          <SafeAreaView style={{flex:1,justifyContent:'center',alignItems:'center'}}>
            <Pressable onPress={(e)=>e.stopPropagation()}>
              <View style={{backgroundColor:tc.background.raised,borderRadius:defaultRadii.xl,overflow:'hidden',padding:defaultSpacing.md,shadowColor:'#000',shadowOffset:{width:0,height:8},shadowOpacity:0.2,shadowRadius:24,elevation:8}}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{flexDirection:'row',gap:defaultSpacing.lg}}>
                    <View>
                      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:defaultSpacing.sm}}>
                        <Pressable onPress={goPrev} style={{width:28,height:28,alignItems:'center',justifyContent:'center'}}>
                          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none"><Polyline points="15 18 9 12 15 6" stroke={tc.text.secondary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>
                        </Pressable>
                        <RNText style={{fontSize:cfg.hFs,fontWeight:defaultTypography.weights.semibold,color:tc.text.onRaised} as TextStyle}>{MN[dM]} {dY}</RNText>
                        <View style={{width:28}} />
                      </View>
                      <CalMonth year={dY} month={dM} rs={as} re={ae} onPress={onDatePress} minD={minDate} maxD={maxDate} cs={cfg.cellSize} fs={cfg.fontSize} tc={tc} />
                    </View>
                    <View>
                      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:defaultSpacing.sm}}>
                        <View style={{width:28}} />
                        <RNText style={{fontSize:cfg.hFs,fontWeight:defaultTypography.weights.semibold,color:tc.text.onRaised} as TextStyle}>{MN[rM]} {rY}</RNText>
                        <Pressable onPress={goNext} style={{width:28,height:28,alignItems:'center',justifyContent:'center'}}>
                          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none"><Polyline points="9 18 15 12 9 6" stroke={tc.text.secondary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>
                        </Pressable>
                      </View>
                      <CalMonth year={rY} month={rM} rs={as} re={ae} onPress={onDatePress} minD={minDate} maxD={maxDate} cs={cfg.cellSize} fs={cfg.fontSize} tc={tc} />
                    </View>
                  </View>
                </ScrollView>
              </View>
            </Pressable>
          </SafeAreaView>
        </Pressable>
      </Modal>
    </View>
  );
});

DateRangePicker.displayName = 'DateRangePicker';

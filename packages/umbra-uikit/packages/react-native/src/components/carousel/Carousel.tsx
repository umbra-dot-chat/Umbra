import React, { forwardRef, useState, useCallback, useMemo, useEffect, useRef, Children } from 'react';
import { View, FlatList, Pressable, Dimensions } from 'react-native';
import type { ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { defaultSpacing, defaultRadii } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

export interface CarouselProps {
  children: React.ReactNode; autoPlay?: boolean; autoPlayInterval?: number; loop?: boolean;
  showArrows?: boolean; showDots?: boolean; onChange?: (index: number) => void;
  defaultIndex?: number; index?: number; aspectRatio?: number; style?: ViewStyle;
}

export const Carousel = forwardRef<View, CarouselProps>(function Carousel(
  { children, autoPlay=false, autoPlayInterval=5000, loop=true, showArrows=true, showDots=true,
    onChange, defaultIndex=0, index: ci, aspectRatio, style: us }, ref,
) {
  const { theme } = useTheme();
  const tc = theme.colors;
  const slides = useMemo(() => Children.toArray(children), [children]);
  const cnt = slides.length;
  const flRef = useRef<FlatList>(null);
  const isCtrl = ci !== undefined;
  const [ii, setIi] = useState(defaultIndex);
  const cur = isCtrl ? ci : ii;
  const [cw, setCw] = useState(Dimensions.get('window').width);

  const goTo = useCallback((n: number) => {
    let r = n;
    if (loop) r = ((n % cnt) + cnt) % cnt;
    else r = Math.max(0, Math.min(n, cnt - 1));
    if (!isCtrl) setIi(r);
    onChange?.(r);
    flRef.current?.scrollToIndex({ index: r, animated: true });
  }, [isCtrl, loop, cnt, onChange]);

  const goNext = useCallback(() => goTo(cur + 1), [goTo, cur]);
  const goPrev = useCallback(() => goTo(cur - 1), [goTo, cur]);

  const timerRef = useRef<ReturnType<typeof setInterval>|null>(null);
  useEffect(() => {
    if (!autoPlay || cnt <= 1) return;
    timerRef.current = setInterval(goNext, autoPlayInterval);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [autoPlay, autoPlayInterval, cnt, goNext]);

  const onEnd = useCallback((e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / cw);
    const r = Math.max(0, Math.min(idx, cnt - 1));
    if (!isCtrl) setIi(r);
    onChange?.(r);
  }, [cw, cnt, isCtrl, onChange]);

  const canPrev = loop || cur > 0;
  const canNext = loop || cur < cnt - 1;

  return (
    <View ref={ref} style={[{overflow:'hidden',borderRadius:defaultRadii.md}, aspectRatio?{aspectRatio}:undefined, us]}
      onLayout={(e) => setCw(e.nativeEvent.layout.width)}>
      <FlatList ref={flRef} data={slides} horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onEnd} initialScrollIndex={defaultIndex}
        getItemLayout={(_,i) => ({length:cw,offset:cw*i,index:i})}
        keyExtractor={(_,i) => 'slide-'+i}
        renderItem={({item}) => <View style={{width:cw,flex:1}}>{item as React.ReactNode}</View>} />
      {showArrows && canPrev && (
        <Pressable onPress={goPrev} accessibilityLabel="Previous slide"
          style={{position:'absolute',left:8,top:'50%',marginTop:-16,width:32,height:32,borderRadius:defaultRadii.xl,backgroundColor:'rgba(0,0,0,0.4)',alignItems:'center',justifyContent:'center'}}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M15 18l-6-6 6-6" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>
        </Pressable>
      )}
      {showArrows && canNext && (
        <Pressable onPress={goNext} accessibilityLabel="Next slide"
          style={{position:'absolute',right:8,top:'50%',marginTop:-16,width:32,height:32,borderRadius:defaultRadii.xl,backgroundColor:'rgba(0,0,0,0.4)',alignItems:'center',justifyContent:'center'}}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M9 18l6-6-6-6" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>
        </Pressable>
      )}
      {showDots && cnt > 1 && (
        <View style={{position:'absolute',bottom:12,alignSelf:'center',flexDirection:'row',gap:defaultSpacing.sm}}>
          {slides.map((_,i) => (
            <Pressable key={i} onPress={() => goTo(i)} accessibilityLabel={'Go to slide '+(i+1)}
              style={{width:8,height:8,borderRadius:defaultRadii.sm,backgroundColor:i===cur?'#fff':'rgba(255,255,255,0.4)'}} />
          ))}
        </View>
      )}
    </View>
  );
});

Carousel.displayName = 'Carousel';

/**
 * @module components/call-pip-widget
 * @description React Native CallPipWidget for the Wisp design system.
 *
 * A freely draggable floating PiP widget that displays the active call
 * with a small video preview (or avatar fallback), caller name,
 * live call duration, and mute/end-call controls.
 *
 * Unlike CallMiniWindow this widget does **not** snap to corners --
 * it stays wherever the user drops it, using PanResponder for free-drag.
 */

import React, {
  forwardRef,
  useMemo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  PanResponder,
} from 'react-native';
import type { ViewStyle, TextStyle, GestureResponderEvent, PanResponderGestureState } from 'react-native';
import type { CallPipWidgetProps } from '@coexist/wisp-core/types/CallPipWidget.types';
import {
  resolvePipBackground,
  resolvePipBorder,
  resolvePipShadow,
} from '@coexist/wisp-core/styles/CallPipWidget.styles';
import { defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';
import Svg, { Line, Path } from 'react-native-svg';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PIP_WIDTH = 160;
const PIP_HEIGHT = 120;
const BUTTON_SIZE = 28;

// ---------------------------------------------------------------------------
// SVG Icons
// ---------------------------------------------------------------------------

function MicIcon({ size = 14, color }: { size?: number; color?: string }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <Path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <Line x1={12} y1={19} x2={12} y2={23} />
      <Line x1={8} y1={23} x2={16} y2={23} />
    </Svg>
  );
}

function MicOffIcon({ size = 14, color }: { size?: number; color?: string }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Line x1={1} y1={1} x2={23} y2={23} />
      <Path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
      <Path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .67-.08 1.32-.22 1.94" />
    </Svg>
  );
}

function PhoneOffIcon({ size = 14, color }: { size?: number; color?: string }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M10.1 13.9a14 14 0 0 0 3.732 2.668 1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2 18 18 0 0 1-12.728-5.272" />
      <Path d="M22 2 2 22" />
      <Path d="M4.76 13.582A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 .244.473" />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Default Avatar
// ---------------------------------------------------------------------------

function DefaultAvatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#333',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Text style={{ color: '#fff', fontSize: size * 0.35, fontWeight: '600' }}>
        {initials}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// CallPipWidget
// ---------------------------------------------------------------------------

/**
 * CallPipWidget -- A freely draggable floating PiP widget for active calls.
 *
 * @remarks
 * Renders a compact 160x120 floating widget with absolute positioning.
 * The widget is draggable via PanResponder and stays wherever the user
 * drops it (no corner snapping). Displays a small video preview (or
 * avatar when the camera is off), the caller name, a live call duration
 * timer, and small mute / end-call buttons.
 *
 * @example
 * ```tsx
 * <CallPipWidget
 *   stream={remoteStream}
 *   callerName="Jane Doe"
 *   connectedAt={Date.now()}
 *   isMuted={false}
 *   isCameraOff={false}
 *   onPress={() => navigateToCall()}
 *   onEndCall={() => endCall()}
 *   onToggleMute={() => toggleMute()}
 *   initialPosition={{ x: 20, y: 80 }}
 * />
 * ```
 */
export const CallPipWidget = forwardRef<View, CallPipWidgetProps>(
  function CallPipWidget(
    {
      stream,
      callerName,
      connectedAt,
      isMuted,
      isCameraOff,
      onPress,
      onEndCall,
      onToggleMute,
      initialPosition = { x: 16, y: 80 },
    },
    ref,
  ) {
    const { theme } = useTheme();
    const isDark = theme.mode === 'dark';

    // -- Animated position ---------------------------------------------------

    const pan = useRef(
      new Animated.ValueXY({ x: initialPosition.x, y: initialPosition.y }),
    ).current;

    const panResponder = useMemo(
      () =>
        PanResponder.create({
          onStartShouldSetPanResponder: () => true,
          onMoveShouldSetPanResponder: (
            _evt: GestureResponderEvent,
            gestureState: PanResponderGestureState,
          ) => {
            // Only capture the gesture when the finger has moved a meaningful distance
            return (
              Math.abs(gestureState.dx) > 4 || Math.abs(gestureState.dy) > 4
            );
          },
          onPanResponderGrant: () => {
            pan.setOffset({
              x: (pan.x as unknown as { _value: number })._value,
              y: (pan.y as unknown as { _value: number })._value,
            });
            pan.setValue({ x: 0, y: 0 });
          },
          onPanResponderMove: Animated.event(
            [null, { dx: pan.x, dy: pan.y }],
            { useNativeDriver: false },
          ),
          onPanResponderRelease: () => {
            pan.flattenOffset();
          },
        }),
      [pan],
    );

    // -- Call duration timer --------------------------------------------------

    const [elapsed, setElapsed] = useState<string>('00:00');

    useEffect(() => {
      if (connectedAt === null) {
        setElapsed('00:00');
        return;
      }

      // Calculate immediately
      setElapsed(formatDuration(Date.now() - connectedAt));

      const intervalId = setInterval(() => {
        setElapsed(formatDuration(Date.now() - connectedAt));
      }, 1000);

      return () => clearInterval(intervalId);
    }, [connectedAt]);

    // -- Callbacks -----------------------------------------------------------

    const handlePress = useCallback(() => {
      onPress();
    }, [onPress]);

    const handleEndCall = useCallback(() => {
      onEndCall();
    }, [onEndCall]);

    const handleToggleMute = useCallback(() => {
      onToggleMute();
    }, [onToggleMute]);

    // -- Resolved styles -----------------------------------------------------

    const background = useMemo(() => resolvePipBackground(isDark), [isDark]);
    const border = useMemo(() => resolvePipBorder(isDark), [isDark]);
    const shadow = useMemo(() => resolvePipShadow(isDark), [isDark]);

    const containerStyle: ViewStyle = useMemo(
      () => ({
        position: 'absolute',
        width: PIP_WIDTH,
        height: PIP_HEIGHT,
        borderRadius: defaultRadii.xl,
        backgroundColor: background,
        borderWidth: 1,
        borderColor: border,
        overflow: 'hidden',
        zIndex: 9999,
        ...shadow,
      }),
      [background, border, shadow],
    );

    const videoAreaStyle: ViewStyle = {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? '#111' : '#E5E5E5',
    };

    const bottomBarStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 8,
      paddingVertical: 4,
      backgroundColor: background,
    };

    const callerNameStyle: TextStyle = {
      fontSize: defaultTypography.sizes['2xs'].fontSize,
      lineHeight: defaultTypography.sizes['2xs'].lineHeight,
      fontWeight: String(defaultTypography.weights.medium) as TextStyle['fontWeight'],
      color: isDark ? '#FFFFFF' : '#000000',
      flex: 1,
      marginRight: 4,
    };

    const durationStyle: TextStyle = {
      fontSize: defaultTypography.sizes['2xs'].fontSize,
      lineHeight: defaultTypography.sizes['2xs'].lineHeight,
      fontWeight: String(defaultTypography.weights.regular) as TextStyle['fontWeight'],
      color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
      fontVariant: ['tabular-nums'],
      marginRight: 6,
    };

    const muteButtonStyle: ViewStyle = {
      width: BUTTON_SIZE,
      height: BUTTON_SIZE,
      borderRadius: BUTTON_SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isMuted
        ? (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)')
        : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'),
    };

    const endCallButtonStyle: ViewStyle = {
      width: BUTTON_SIZE,
      height: BUTTON_SIZE,
      borderRadius: BUTTON_SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#E53935',
      marginLeft: 4,
    };

    const muteIconColor = isMuted
      ? (isDark ? '#FF6B6B' : '#D32F2F')
      : (isDark ? '#FFFFFF' : '#333333');

    // -- Render ---------------------------------------------------------------

    return (
      <Animated.View
        ref={ref as React.Ref<View>}
        accessibilityRole="none"
        accessibilityLabel={`Picture-in-picture call with ${callerName}`}
        style={[containerStyle, { transform: pan.getTranslateTransform() }]}
        {...panResponder.panHandlers}
      >
        {/* Tappable video / avatar area */}
        <Pressable
          onPress={handlePress}
          accessibilityRole="button"
          accessibilityLabel="Expand call"
          style={videoAreaStyle}
        >
          {isCameraOff || !stream ? (
            <DefaultAvatar name={callerName} size={36} />
          ) : (
            // When a live stream is available and camera is on,
            // the consumer should render their own RTCView inside
            // the Pressable via composition. For now show the avatar
            // as a placeholder since RTCView is platform-specific.
            <DefaultAvatar name={callerName} size={36} />
          )}
        </Pressable>

        {/* Bottom bar: name + duration + controls */}
        <View style={bottomBarStyle}>
          <Text style={callerNameStyle} numberOfLines={1}>
            {callerName}
          </Text>

          <Text style={durationStyle}>{elapsed}</Text>

          <Pressable
            onPress={handleToggleMute}
            accessibilityRole="button"
            accessibilityLabel={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            style={muteButtonStyle}
          >
            {isMuted ? (
              <MicOffIcon size={14} color={muteIconColor} />
            ) : (
              <MicIcon size={14} color={muteIconColor} />
            )}
          </Pressable>

          <Pressable
            onPress={handleEndCall}
            accessibilityRole="button"
            accessibilityLabel="End call"
            style={endCallButtonStyle}
          >
            <PhoneOffIcon size={14} color="#FFFFFF" />
          </Pressable>
        </View>
      </Animated.View>
    );
  },
);

CallPipWidget.displayName = 'CallPipWidget';

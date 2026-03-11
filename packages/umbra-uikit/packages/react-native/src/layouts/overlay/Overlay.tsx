import React, { forwardRef, useMemo } from 'react';
import { View, Pressable, Modal, StyleSheet, Platform } from 'react-native';
import { zIndex } from '@coexist/wisp-core/tokens/z-index';

// Aurora backdrop CSS (web only)
let auroraInjected = false;
function injectAuroraCSS() {
  if (auroraInjected || Platform.OS !== 'web') return;
  auroraInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    @keyframes wisp-aurora-a { 0%,100% { transform: translate(-20%,-20%); } 50% { transform: translate(20%,20%); } }
    @keyframes wisp-aurora-b { 0%,100% { transform: translate(20%,20%); } 50% { transform: translate(-20%,-20%); } }
  `;
  document.head.appendChild(style);
}

type OverlayBackdrop = 'dim' | 'blur' | 'transparent';

export interface OverlayProps {
  /** Content to render above the backdrop. */
  children?: React.ReactNode;
  /** Whether the overlay is visible. @default false */
  open?: boolean;
  /** Backdrop style. @default 'dim' */
  backdrop?: OverlayBackdrop;
  /** Center children within the overlay. @default true */
  center?: boolean;
  /** Called when the backdrop area is pressed. */
  onBackdropPress?: () => void;
  /** Whether to use a Modal (presents above everything). @default true */
  useModal?: boolean;
  /** Whether the modal is transparent. @default true */
  transparent?: boolean;
  /** Animation type for the Modal. @default 'fade' */
  animationType?: 'none' | 'slide' | 'fade';
  style?: object;
}

const backdropColors: Record<OverlayBackdrop, string> = {
  dim: 'rgba(0, 0, 0, 0.5)',
  blur: 'rgba(0, 0, 0, 0.3)',
  transparent: 'transparent',
};

export const Overlay = forwardRef<View, OverlayProps>(function Overlay(
  {
    children,
    open = false,
    backdrop = 'dim',
    center = true,
    onBackdropPress,
    useModal = true,
    transparent = true,
    animationType = 'fade',
    style: userStyle,
  },
  ref,
) {
  const containerStyle = useMemo(
    () => [
      styles.container,
      {
        backgroundColor: backdropColors[backdrop],
        alignItems: center ? ('center' as const) : undefined,
        justifyContent: center ? ('center' as const) : undefined,
      },
      userStyle,
    ],
    [backdrop, center, userStyle],
  );

  if (!open) return null;

  if (Platform.OS === 'web' && backdrop === 'dim') injectAuroraCSS();

  const content = (
    <View ref={ref} style={containerStyle}>
      {/* Aurora gradient blobs (web only, dim backdrop) */}
      {Platform.OS === 'web' && backdrop === 'dim' && (
        <>
          <View style={{
            position: 'absolute',
            width: '60%',
            height: '60%',
            top: '10%',
            left: '10%',
            borderRadius: 9999,
            background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)',
            animation: 'wisp-aurora-a 8s ease-in-out infinite',
            pointerEvents: 'none',
          } as any} />
          <View style={{
            position: 'absolute',
            width: '50%',
            height: '50%',
            bottom: '10%',
            right: '10%',
            borderRadius: 9999,
            background: 'radial-gradient(circle, rgba(236,72,153,0.04) 0%, transparent 70%)',
            animation: 'wisp-aurora-b 10s ease-in-out infinite',
            pointerEvents: 'none',
          } as any} />
        </>
      )}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onBackdropPress}
      />
      {children}
    </View>
  );

  if (useModal) {
    return (
      <Modal
        visible={open}
        transparent={transparent}
        animationType={animationType}
        onRequestClose={onBackdropPress}
        statusBarTranslucent
      >
        {content}
      </Modal>
    );
  }

  return content;
});

Overlay.displayName = 'Overlay';

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: zIndex.overlay,
  },
});

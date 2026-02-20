/**
 * Shared layout chrome for wallet creation / import flows.
 *
 * - On web: renders as an Overlay with a centered white modal panel.
 * - On native (iOS/Android): renders as a full-screen view with a back button.
 *
 * Contains:
 * - ProgressSteps at the top
 * - Scrollable step content with animated transitions
 * - Footer bar for navigation buttons
 */

import React, { useRef } from 'react';
import { View, ScrollView, Platform, type ViewStyle } from 'react-native';
import { Overlay, ProgressSteps, Separator, Presence, Button, Text } from '@coexist/wisp-react-native';
import type { ProgressStep, PresenceAnimation } from '@coexist/wisp-react-native';

export interface WalletFlowLayoutProps {
  open: boolean;
  onClose: () => void;
  steps: ProgressStep[];
  currentStep: number;
  onStepClick?: (index: number) => void;
  children: React.ReactNode;
  footer: React.ReactNode;
  /** Whether tapping the backdrop closes the flow (only safe on step 0). @default false */
  allowBackdropClose?: boolean;
}

export function WalletFlowLayout({
  open,
  onClose,
  steps,
  currentStep,
  onStepClick,
  children,
  footer,
  allowBackdropClose = false,
}: WalletFlowLayoutProps) {
  // Track previous step to determine animation direction
  const prevStepRef = useRef(currentStep);
  const direction: PresenceAnimation =
    currentStep >= prevStepRef.current ? 'slideUp' : 'slideDown';
  prevStepRef.current = currentStep;

  if (!open) return null;

  const content = (
    <>
      {/* Step indicator */}
      <View style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 }}>
        <ProgressSteps
          steps={steps}
          currentStep={currentStep}
          orientation="horizontal"
          size="sm"
          onStepClick={onStepClick}
        />
      </View>

      <Separator spacing="none" />

      {/* Step content — animated on step change */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Presence key={currentStep} visible animation={direction} duration={250}>
          {children}
        </Presence>
      </ScrollView>

      <Separator spacing="none" />

      {/* Footer */}
      <View style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
        {footer}
      </View>
    </>
  );

  // Native: full-screen view
  if (Platform.OS !== 'web') {
    return (
      <View style={fullScreenStyle}>
        {content}
      </View>
    );
  }

  // Web: centered modal overlay
  return (
    <Overlay
      open={open}
      backdrop="dim"
      center
      onBackdropPress={allowBackdropClose ? onClose : undefined}
      useModal={false}
    >
      <View style={modalStyle}>
        {content}
      </View>
    </Overlay>
  );
}

const fullScreenStyle: ViewStyle = {
  flex: 1,
  backgroundColor: '#FFFFFF',
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 100,
};

const modalStyle: ViewStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  width: '90%',
  maxWidth: 520,
  maxHeight: '85%',
  overflow: 'hidden',
  ...(Platform.OS === 'web'
    ? ({
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      } as any)
    : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.25,
        shadowRadius: 25,
        elevation: 24,
      }),
};

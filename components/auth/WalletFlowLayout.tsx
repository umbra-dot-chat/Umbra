/**
 * Shared modal chrome for wallet creation / import flows.
 *
 * Renders an Overlay with a white modal panel containing:
 * - ProgressSteps at the top
 * - Scrollable step content with animated transitions
 * - Footer bar for navigation buttons
 */

import React, { useRef } from 'react';
import { View, ScrollView, Platform, type ViewStyle } from 'react-native';
import { Overlay, ProgressSteps, Separator, Presence } from '@coexist/wisp-react-native';
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

  return (
    <Overlay
      open={open}
      backdrop="dim"
      center
      onBackdropPress={allowBackdropClose ? onClose : undefined}
      useModal={false}
    >
      <View style={modalStyle}>
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
      </View>
    </Overlay>
  );
}

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

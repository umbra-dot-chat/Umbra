/**
 * Shared layout chrome for wallet creation / import flows.
 *
 * - On web: renders as an Overlay with a centered white modal panel.
 * - On native (iOS/Android): renders as a full-screen view with a header bar
 *   (back button + step title) below the safe area.
 *
 * Contains:
 * - Header bar with back button (native) or in-content (web)
 * - ProgressSteps step indicator
 * - Scrollable step content with animated transitions
 * - Footer bar for navigation buttons
 */

import React, { useRef } from 'react';
import { View, ScrollView, Platform, Pressable, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Overlay, ProgressSteps, Separator, Presence, Text } from '@coexist/wisp-react-native';
import type { ProgressStep, PresenceAnimation } from '@coexist/wisp-react-native';
import { ArrowLeftIcon, XIcon } from '@/components/icons';

export interface WalletFlowLayoutProps {
  open: boolean;
  onClose: () => void;
  /** Called when the header back button is pressed. Falls back to onClose if not provided. */
  onBack?: () => void;
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
  onBack,
  steps,
  currentStep,
  onStepClick,
  children,
  footer,
  allowBackdropClose = false,
}: WalletFlowLayoutProps) {
  const insets = useSafeAreaInsets();
  const isNative = Platform.OS !== 'web';

  // Track previous step to determine animation direction
  const prevStepRef = useRef(currentStep);
  const direction: PresenceAnimation =
    currentStep >= prevStepRef.current ? 'slideUp' : 'slideDown';
  prevStepRef.current = currentStep;

  if (!open) return null;

  const isFirstStep = currentStep === 0;
  const stepTitle = steps[currentStep]?.label ?? '';

  // Header back action: go back if not first step, otherwise close
  const handleHeaderBack = () => {
    if (isFirstStep) {
      onClose();
    } else if (onBack) {
      onBack();
    } else {
      onClose();
    }
  };

  const content = (
    <>
      {/* Native header bar — safe area + back button + title */}
      {isNative && (
        <View style={{ backgroundColor: '#FFFFFF' }}>
          {/* Safe area spacer */}
          <View style={{ height: insets.top }} />

          {/* Header bar */}
          <View style={headerBarStyle}>
            <Pressable
              onPress={handleHeaderBack}
              style={headerBackButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {isFirstStep ? (
                <XIcon size={20} color="#333333" />
              ) : (
                <ArrowLeftIcon size={20} color="#333333" />
              )}
            </Pressable>

            <Text size="md" weight="semibold" style={{ flex: 1, textAlign: 'center' }}>
              {stepTitle}
            </Text>

            {/* Spacer to balance the back button */}
            <View style={{ width: 40 }} />
          </View>

          <Separator spacing="none" />
        </View>
      )}

      {/* Step indicator — use xs on native to fit more steps on narrow screens */}
      <View style={{ paddingHorizontal: isNative ? 20 : 24, paddingTop: isNative ? 12 : 24, paddingBottom: isNative ? 12 : 16 }}>
        <ProgressSteps
          steps={steps}
          currentStep={currentStep}
          orientation="horizontal"
          size={isNative ? 'xs' : 'sm'}
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
      <View style={{ paddingHorizontal: 24, paddingVertical: 16, paddingBottom: isNative ? Math.max(insets.bottom, 16) : 16 }}>
        {footer}
      </View>
    </>
  );

  // Native: full-screen view
  if (isNative) {
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

const headerBarStyle: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  height: 48,
  paddingHorizontal: 12,
};

const headerBackButton: ViewStyle = {
  width: 40,
  height: 40,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 20,
};

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

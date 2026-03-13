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
import { ScrollView, Platform, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Overlay, ProgressSteps, Separator, Presence, Text, Box, Button, useTheme } from '@coexist/wisp-react-native';
import type { ProgressStep, PresenceAnimation } from '@coexist/wisp-react-native';
import { ArrowLeftIcon, XIcon } from '@/components/ui';
import { dbg } from '@/utils/debug';

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
  /** Test ID for E2E testing */
  testID?: string;
  /** Accessibility label for screen readers */
  accessibilityLabel?: string;
  /** Test ID for the back/close button */
  backButtonTestID?: string;
  /** Accessibility label for the back/close button */
  backButtonAccessibilityLabel?: string;
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
  testID,
  accessibilityLabel,
  backButtonTestID,
  backButtonAccessibilityLabel,
}: WalletFlowLayoutProps) {
  if (__DEV__) dbg.trackRender('WalletFlowLayout');
  const insets = useSafeAreaInsets();
  const isNative = Platform.OS !== 'web';
  const { theme } = useTheme();
  const tc = theme.colors;

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
        <Box style={{ backgroundColor: tc.background.canvas }}>
          {/* Safe area spacer */}
          <Box style={{ height: insets.top }} />

          {/* Header bar */}
          <Box style={headerBarStyle}>
            <Button
              variant="tertiary"
              onPress={handleHeaderBack}
              style={headerBackButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              testID={backButtonTestID}
              accessibilityLabel={backButtonAccessibilityLabel}
            >
              {isFirstStep ? (
                <XIcon size={20} color={tc.text.primary} />
              ) : (
                <ArrowLeftIcon size={20} color={tc.text.primary} />
              )}
            </Button>

            <Text size="md" weight="semibold" style={{ flex: 1, textAlign: 'center' }}>
              {stepTitle}
            </Text>

            {/* Spacer to balance the back button */}
            <Box style={{ width: 40 }} />
          </Box>

          <Separator spacing="none" />
        </Box>
      )}

      {/* Step indicator — xs on native (compact), sm on web */}
      <Box style={{ paddingHorizontal: isNative ? 20 : 24, paddingTop: isNative ? 12 : 24, paddingBottom: isNative ? 12 : 16 }}>
        <ProgressSteps
          steps={steps}
          currentStep={currentStep}
          orientation="horizontal"
          size={isNative ? 'xs' : 'sm'}
          onStepClick={onStepClick}
        />
      </Box>

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
      <Box style={{ paddingHorizontal: 24, paddingVertical: 16, paddingBottom: isNative ? Math.max(insets.bottom, 16) : 16 }}>
        {footer}
      </Box>
    </>
  );

  // Native: full-screen view
  if (isNative) {
    return (
      <Box style={{...fullScreenStyle, backgroundColor: tc.background.canvas}} testID={testID} accessibilityLabel={accessibilityLabel}>
        {content}
      </Box>
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
      <Box style={{...modalStyle, backgroundColor: tc.background.raised ?? tc.background.canvas}} testID={testID} accessibilityLabel={accessibilityLabel}>
        {content}
      </Box>
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
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 100,
};

const modalStyle: ViewStyle = {
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

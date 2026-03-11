/**
 * @module ThemeEditor (React Native)
 * @description Live theme customization panel for React Native.
 * Exposes controls for every configurable token in the Wisp theme system.
 * Changes propagate instantly to all components in the tree via context.
 */

import React, { forwardRef, useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import type { ViewStyle } from 'react-native';
import type { ThemeOverrides } from '@coexist/wisp-core/theme/create-theme';
import {
  themeEditorTabs,
  getGroupsForTab,
  getNestedValue,
  setNestedValue,
  type ThemeEditorTab,
} from '@coexist/wisp-core/theme/editor-fields';
import { useTheme } from '../../providers';
import { Card } from '../../layouts/card';
import { VStack, HStack } from '../../layouts/stack';
import { ScrollArea } from '../../layouts/scroll-area';
import { Text } from '../../primitives/text';
import { Toggle } from '../../primitives/toggle';
import { Button } from '../../primitives/button';
import { Separator } from '../../layouts/separator';
import { Tabs, TabList, Tab, TabPanel } from '../tabs';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '../accordion';
import { ThemeEditorField } from './ThemeEditorField';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ThemeEditorProps {
  defaultTab?: ThemeEditorTab;
  activeTab?: ThemeEditorTab;
  onTabChange?: (tab: ThemeEditorTab) => void;
  showModeToggle?: boolean;
  showReset?: boolean;
  maxHeight?: number;
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ThemeEditor = forwardRef<View, ThemeEditorProps>(
  function ThemeEditor(
    {
      defaultTab = 'colors',
      activeTab: controlledTab,
      onTabChange,
      showModeToggle = true,
      showReset = true,
      maxHeight = 480,
      style: userStyle,
    },
    ref,
  ) {
    const {
      theme,
      mode,
      toggleMode,
      overrides,
      setOverrides,
      resetOverrides,
    } = useTheme();

    // Tab state
    const [uncontrolledTab, setUncontrolledTab] = useState<string>(defaultTab);
    const isTabControlled = controlledTab !== undefined;
    const currentTab = isTabControlled ? controlledTab : uncontrolledTab;

    const handleTabChange = useCallback(
      (value: string) => {
        if (!isTabControlled) {
          setUncontrolledTab(value);
        }
        onTabChange?.(value as ThemeEditorTab);
      },
      [isTabControlled, onTabChange],
    );

    const tabGroups = useMemo(
      () =>
        Object.fromEntries(
          themeEditorTabs.map((t) => [t.value, getGroupsForTab(t.value)]),
        ),
      [],
    );

    const handleFieldChange = useCallback(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (path: string, value: any) => {
        const newOverrides = setNestedValue(
          { ...overrides } as Record<string, unknown>,
          path,
          value,
        ) as Omit<ThemeOverrides, 'mode'>;
        setOverrides(newOverrides);
      },
      [overrides, setOverrides],
    );

    return (
      <Card
        ref={ref}
        variant="outlined"
        padding="md"
        style={userStyle}
      >
        <VStack gap="md">
          {showModeToggle && (
            <>
              <HStack
                gap="md"
                style={{ justifyContent: 'space-between', alignItems: 'center' } as ViewStyle}
              >
                <Text size="sm" weight="semibold">
                  Dark Mode
                </Text>
                <Toggle
                  checked={mode === 'dark'}
                  onChange={toggleMode}
                  size="sm"
                />
              </HStack>
              <Separator />
            </>
          )}

          <Tabs value={currentTab} onChange={handleTabChange}>
            <TabList>
              {themeEditorTabs.map((t) => (
                <Tab key={t.value} value={t.value}>
                  {t.label}
                </Tab>
              ))}
            </TabList>

            {themeEditorTabs.map((t) => (
              <TabPanel key={t.value} value={t.value}>
                <ScrollArea maxHeight={maxHeight}>
                  <Accordion type="single" collapsible>
                    {tabGroups[t.value]?.map((group) => (
                      <AccordionItem key={group.name} value={group.name}>
                        <AccordionTrigger>{group.name}</AccordionTrigger>
                        <AccordionContent>
                          <VStack gap="xs">
                            {group.fields.map((field) => (
                              <ThemeEditorField
                                key={field.path}
                                field={field}
                                value={getNestedValue(
                                  theme as unknown as Record<string, unknown>,
                                  field.path,
                                )}
                                onChange={(val) =>
                                  handleFieldChange(field.path, val)
                                }
                              />
                            ))}
                          </VStack>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </ScrollArea>
              </TabPanel>
            ))}
          </Tabs>

          {showReset && (
            <>
              <Separator />
              <Button
                variant="secondary"
                size="sm"
                onPress={resetOverrides}
              >
                Reset to Defaults
              </Button>
            </>
          )}
        </VStack>
      </Card>
    );
  },
);

ThemeEditor.displayName = 'ThemeEditor';

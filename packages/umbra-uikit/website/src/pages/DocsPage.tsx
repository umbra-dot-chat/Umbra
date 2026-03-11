import React from 'react';
import {
  Text,
  VStack,
  HStack,
  Card,
  Badge,
  Separator,
  Progress,
  useThemeColors,
} from '@wisp-ui/react';
import { useNavigate } from 'react-router-dom';
import { allEntries, entriesByCategory } from '../registry';
import {
  Layers,
  LayoutGrid,
  Component,
  Palette,
  FlaskConical,
  CheckCircle2,
  XCircle,
  FileCode2,
  Box,
  GitBranch,
  Shield,
  Clock,
} from 'lucide-react';
import testStats from '../generated/test-stats.json';

// ─── Test stats from generated JSON ─────────────────────────────
// Run `node website/scripts/generate-test-stats.mjs` to refresh.
// The pre-build hook (`pnpm run stats`) also runs it automatically.
const TEST_STATS = {
  totalFiles: testStats.totalFiles,
  totalTests: testStats.totalTests,
  passed: testStats.passed,
  failed: testStats.failed,
  duration: testStats.duration,
  timestamp: testStats.timestamp as string,
  success: testStats.success,
};

const COVERAGE = testStats.coverage;

// ─── Helper components ──────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{ size?: number | string; color?: string }>;
  color?: string;
}) {
  const colors = useThemeColors();
  return (
    <Card variant="outlined" padding="md" radius="md" style={{ flex: '1 1 160px', minWidth: 140 }}>
      <VStack gap="xs">
        <HStack gap="xs" align="center">
          <Icon size={16} color={color ?? colors.text.muted} />
          <Text size="xs" color="secondary" weight="medium">
            {label}
          </Text>
        </HStack>
        <Text size="display-xs" weight="bold">
          {value}
        </Text>
        {sub && (
          <Text size="xs" color="tertiary">
            {sub}
          </Text>
        )}
      </VStack>
    </Card>
  );
}

function CategoryRow({
  label,
  count,
  icon: Icon,
  path,
}: {
  label: string;
  count: number;
  icon: React.ComponentType<{ size?: number | string; color?: string }>;
  path: string;
}) {
  const navigate = useNavigate();
  const colors = useThemeColors();
  return (
    <div
      onClick={() => navigate(path)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        borderRadius: 8,
        cursor: 'pointer',
        transition: 'background-color 150ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = colors.accent.highlight;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <HStack gap="sm" align="center">
        <Icon size={16} color={colors.text.muted} />
        <Text size="sm" weight="medium">
          {label}
        </Text>
      </HStack>
      <Badge size="sm" variant="default">
        {count}
      </Badge>
    </div>
  );
}

// ─── DocsPage ───────────────────────────────────────────────────

export function DocsPage() {
  const colors = useThemeColors();

  const tokensCount = entriesByCategory('tokens').length;
  const primitivesCount = entriesByCategory('primitives').length;
  const layoutsCount = entriesByCategory('layouts').length;
  const componentsCount = entriesByCategory('components').length;
  const totalComponents = allEntries.length;
  const passRate = Math.round((TEST_STATS.passed / TEST_STATS.totalTests) * 100);

  return (
    <VStack gap="xl" style={{ maxWidth: 860 }}>
      {/* Header */}
      <div>
        <Text size="display-sm" weight="bold">
          Documentation
        </Text>
        <div style={{ marginTop: 6 }}>
          <Text size="md" color="secondary">
            Overview of the Wisp design system — architecture, component inventory, test coverage,
            and project health.
          </Text>
        </div>
      </div>

      {/* Quick stats */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <StatCard label="Components" value={totalComponents} sub="across all categories" icon={Box} />
        <StatCard label="Test Suites" value={TEST_STATS.totalFiles} sub={`${TEST_STATS.totalTests} assertions`} icon={FlaskConical} />
        <StatCard label="Pass Rate" value={`${passRate}%`} sub={`${TEST_STATS.passed} / ${TEST_STATS.totalTests}`} icon={CheckCircle2} color={colors.status.success} />
        <StatCard label="Test Files" value={COVERAGE.primitives + COVERAGE.components + COVERAGE.layouts} sub="primitives + components + layouts" icon={FileCode2} />
      </div>

      <Separator />

      {/* Architecture */}
      <VStack gap="md">
        <Text size="lg" weight="bold">
          Architecture
        </Text>
        <Text size="sm" color="secondary" style={{ lineHeight: 1.6 }}>
          Wisp follows a three-layer architecture for maximum portability. The core package contains
          framework-agnostic types, design tokens, and pure style-builder functions. The React package
          composes these into real components using hooks and refs. The website package documents and
          showcases everything with live examples and props tables.
        </Text>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 4 }}>
          <Card variant="outlined" padding="sm" radius="md" style={{ flex: '1 1 180px' }}>
            <VStack gap="2xs">
              <HStack gap="xs" align="center">
                <GitBranch size={14} color={colors.text.muted} />
                <Text size="xs" weight="bold">@wisp-ui/core</Text>
              </HStack>
              <Text size="xs" color="tertiary">
                Types, tokens, style builders — zero React dependency
              </Text>
            </VStack>
          </Card>
          <Card variant="outlined" padding="sm" radius="md" style={{ flex: '1 1 180px' }}>
            <VStack gap="2xs">
              <HStack gap="xs" align="center">
                <Component size={14} color={colors.text.muted} />
                <Text size="xs" weight="bold">@wisp-ui/react</Text>
              </HStack>
              <Text size="xs" color="tertiary">
                React components — forwardRef, hooks, useMemo, portals
              </Text>
            </VStack>
          </Card>
          <Card variant="outlined" padding="sm" radius="md" style={{ flex: '1 1 180px' }}>
            <VStack gap="2xs">
              <HStack gap="xs" align="center">
                <FileCode2 size={14} color={colors.text.muted} />
                <Text size="xs" weight="bold">@wisp/website</Text>
              </HStack>
              <Text size="xs" color="tertiary">
                Documentation site — registry, live previews, code samples
              </Text>
            </VStack>
          </Card>
        </div>
      </VStack>

      <Separator />

      {/* Component inventory */}
      <VStack gap="md">
        <Text size="lg" weight="bold">
          Component Inventory
        </Text>
        <Text size="sm" color="secondary">
          Browse all {totalComponents} documented elements across four categories.
        </Text>

        <Card variant="outlined" padding="sm" radius="md">
          <VStack gap="2xs">
            <CategoryRow label="Tokens" count={tokensCount} icon={Palette} path="/tokens" />
            <CategoryRow label="Primitives" count={primitivesCount} icon={Layers} path="/primitives" />
            <CategoryRow label="Layouts" count={layoutsCount} icon={LayoutGrid} path="/layouts" />
            <CategoryRow label="Components" count={componentsCount} icon={Component} path="/components" />
          </VStack>
        </Card>
      </VStack>

      <Separator />

      {/* Test coverage */}
      <VStack gap="md">
        <HStack gap="sm" align="center">
          <Shield size={18} color={colors.text.primary} />
          <Text size="lg" weight="bold">
            Test Coverage
          </Text>
        </HStack>
        <Text size="sm" color="secondary">
          Automated test suite powered by Vitest + React Testing Library with V8 coverage.
          Tests verify rendering, sizing, variants, accessibility, keyboard navigation, and WCAG contrast ratios.
        </Text>

        {/* Test result bars */}
        <Card variant="outlined" padding="md" radius="md">
          <VStack gap="md">
            {/* Pass / Fail summary */}
            <HStack gap="md" style={{ flexWrap: 'wrap' }}>
              <VStack gap="xs" style={{ flex: 1, minWidth: 120 }}>
                <HStack gap="xs" align="center">
                  <CheckCircle2 size={14} color={colors.status.success} />
                  <Text size="xs" weight="medium" color="secondary">
                    Passed
                  </Text>
                </HStack>
                <Text size="display-xs" weight="bold">
                  {TEST_STATS.passed}
                </Text>
              </VStack>
              <VStack gap="xs" style={{ flex: 1, minWidth: 120 }}>
                <HStack gap="xs" align="center">
                  <XCircle size={14} color={colors.status.danger} />
                  <Text size="xs" weight="medium" color="secondary">
                    Failed
                  </Text>
                </HStack>
                <Text size="display-xs" weight="bold">
                  {TEST_STATS.failed}
                </Text>
              </VStack>
              <VStack gap="xs" style={{ flex: 1, minWidth: 120 }}>
                <Text size="xs" weight="medium" color="secondary">
                  Test Suites
                </Text>
                <Text size="display-xs" weight="bold">
                  {TEST_STATS.totalFiles}
                </Text>
              </VStack>
              <VStack gap="xs" style={{ flex: 1, minWidth: 120 }}>
                <Text size="xs" weight="medium" color="secondary">
                  Duration
                </Text>
                <Text size="display-xs" weight="bold">
                  {TEST_STATS.duration}
                </Text>
              </VStack>
            </HStack>

            <Separator spacing="sm" />

            {/* Progress bar */}
            <VStack gap="xs">
              <HStack justify="between" align="center">
                <Text size="xs" weight="medium">
                  Overall Pass Rate
                </Text>
                <Text size="xs" weight="bold" style={{ color: colors.status.success }}>
                  {passRate}%
                </Text>
              </HStack>
              <Progress value={passRate} size="md" />
            </VStack>

            <Separator spacing="sm" />

            {/* File coverage breakdown */}
            <VStack gap="sm">
              <Text size="xs" weight="semibold" color="secondary">
                Test File Breakdown
              </Text>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {[
                  { label: 'Primitives', val: COVERAGE.primitives },
                  { label: 'Components', val: COVERAGE.components },
                  { label: 'Layouts', val: COVERAGE.layouts },
                ].map((m) => {
                  const pct = TEST_STATS.totalFiles > 0 ? Math.round((m.val / TEST_STATS.totalFiles) * 100) : 0;
                  return (
                    <VStack key={m.label} gap="2xs" style={{ flex: '1 1 140px', minWidth: 120 }}>
                      <HStack justify="between" align="center">
                        <Text size="xs" color="secondary">
                          {m.label}
                        </Text>
                        <Text size="xs" weight="bold">
                          {m.val} files
                        </Text>
                      </HStack>
                      <Progress value={pct} size="sm" />
                    </VStack>
                  );
                })}
              </div>
            </VStack>

            {/* Last updated */}
            {TEST_STATS.timestamp && (
              <>
                <Separator spacing="sm" />
                <HStack gap="xs" align="center">
                  <Clock size={12} color={colors.text.muted} />
                  <Text size="xs" color="tertiary">
                    Last run: {new Date(TEST_STATS.timestamp).toLocaleString()}
                  </Text>
                </HStack>
              </>
            )}
          </VStack>
        </Card>
      </VStack>

      <Separator />

      {/* Testing philosophy */}
      <VStack gap="md">
        <Text size="lg" weight="bold">
          Testing Philosophy
        </Text>
        <VStack gap="sm">
          {[
            { title: 'Rendering', desc: 'Every component renders without crashing across all size/variant combinations.' },
            { title: 'Accessibility', desc: 'ARIA roles, keyboard navigation, focus management, and screen reader compatibility.' },
            { title: 'WCAG Contrast', desc: 'Automated contrast ratio checks against WCAG AA/AA-large thresholds for both themes.' },
            { title: 'Theme Awareness', desc: 'Components tested in both light and dark modes via WispProvider wrapping.' },
            { title: 'Interaction', desc: 'Click, hover, focus, blur, and keyboard events validated with React Testing Library.' },
          ].map((item) => (
            <HStack key={item.title} gap="sm" align="start">
              <CheckCircle2
                size={14}
                color={colors.status.success}
                style={{ marginTop: 3, flexShrink: 0 }}
              />
              <VStack gap="2xs">
                <Text size="sm" weight="semibold">
                  {item.title}
                </Text>
                <Text size="xs" color="secondary">
                  {item.desc}
                </Text>
              </VStack>
            </HStack>
          ))}
        </VStack>
      </VStack>

      {/* Bottom spacer */}
      <div style={{ height: 48 }} />
    </VStack>
  );
}

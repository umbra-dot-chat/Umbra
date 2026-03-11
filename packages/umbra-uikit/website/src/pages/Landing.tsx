import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useTheme,
  useThemeColors,
  Text,
  Button,
  HStack,
  VStack,
  Card,
  Separator,
  Container,
  Input,
  Badge,
  Toggle,
  Grid,
  GridItem,
  Avatar,
  Checkbox,
  Radio,
  RadioGroup,
  Slider,
  Progress,
  Spinner,
  Tag,
  Chip,
  Kbd,
  Alert,
  Skeleton,
  Tabs,
  TabList,
  Tab,
  TabPanel,
  Tooltip,
  SegmentedControl,
  Rating,
  Indicator,
  Stack,
  Box,
  Center,
  Spacer,
} from '@wisp-ui/react';
import {
  Palette,
  Monitor,
  Layers,
  ArrowRight,
  Github,
  Search,
  User,
  Bell,
  Settings,
  Check,
  Star,
  Heart,
  Mail,
  Lock,
} from 'lucide-react';
import { ThemeToggle } from '../shared/ThemeToggle';

// ---------------------------------------------------------------------------
// Landing Page
// ---------------------------------------------------------------------------

export function Landing({ onSearchOpen }: { onSearchOpen?: () => void }) {
  const { mode, toggleMode } = useTheme();
  const colors = useThemeColors();

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: colors.background.canvas,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top nav */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 32px',
          height: 64,
          borderBottom: `1px solid ${colors.border.subtle}`,
        }}
      >
        <HStack gap="sm" align="center">
          <img
            src={`${import.meta.env.BASE_URL}${mode === 'light' ? 'wisp-logo-dark.png' : 'wisp-logo.png'}`}
            alt="Wisp"
            style={{ width: 36, height: 36 }}
          />
          <Text size="xl" weight="bold">
            wisp
          </Text>
          <Text size="sm" color="tertiary" weight="semibold">
            UI Kit
          </Text>
        </HStack>

        {/* Search trigger */}
        <div
          onClick={onSearchOpen}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '8px 16px',
            borderRadius: 8,
            border: `1px solid ${colors.border.subtle}`,
            cursor: 'pointer',
            flex: 1,
            maxWidth: 400,
            marginLeft: 32,
            marginRight: 32,
          }}
        >
          <Search size={18} color={colors.text.muted} />
          <Text size="md" color="tertiary">
            Search…
          </Text>
          <Kbd size="md" style={{ marginLeft: 'auto' }}>⌘K</Kbd>
        </div>

        <HStack gap="sm" align="center">
          <ThemeToggle mode={mode} onToggle={toggleMode} />
          <LandingNavLink label="Docs" to="/docs" />
          <LandingNavLink label="Components" to="/components" />
        </HStack>
      </header>

      {/* Hero */}
      <HeroSection />

      {/* Features */}
      <FeaturesSection />

      {/* Component showcase */}
      <ShowcaseSection />

      {/* Footer */}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function LandingNavLink({ label, to }: { label: string; to: string }) {
  const navigate = useNavigate();

  return (
    <Button variant="tertiary" size="sm" onClick={() => navigate(to)}>
      {label}
    </Button>
  );
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

function HeroSection() {
  const navigate = useNavigate();
  const { mode } = useTheme();
  const colors = useThemeColors();

  return (
    <section
      style={{
        padding: '80px 32px 60px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24,
      }}
    >
      <img
        src={`${import.meta.env.BASE_URL}${mode === 'light' ? 'wisp-logo-dark.png' : 'wisp-logo.png'}`}
        alt="Wisp logo"
        style={{ width: 192, height: 192 }}
      />
      <Text size="display-2xl" weight="bold">
        wisp
      </Text>

      <Text size="xl" color="secondary" style={{ maxWidth: 520 }}>
        A monochrome, cross-platform UI kit for React. 90+ components, fully tokenized.
      </Text>

      <HStack gap="sm" style={{ marginTop: 8 }}>
        <Button
          variant="primary"
          size="lg"
          iconRight={<ArrowRight size={18} />}
          onClick={() => navigate('/primitives')}
        >
          Browse Components
        </Button>
        <Button
          variant="secondary"
          size="lg"
          iconLeft={<Github size={18} />}
          onClick={() => window.open('https://github.com/InfamousVague/Wisp', '_blank')}
        >
          GitHub
        </Button>
      </HStack>

      {/* Live component strip */}
      <div style={{ marginTop: 40, width: '100%', maxWidth: 700 }}>
        <ComponentStrip />
      </div>
    </section>
  );
}

/** Expanded strip of live Wisp components to showcase the kit. */
function ComponentStrip() {
  const colors = useThemeColors();

  return (
    <Card variant="outlined" padding="lg" radius="lg">
      <VStack gap="lg">
        {/* Row 1: Buttons */}
        <HStack gap="sm" align="center" justify="center" style={{ flexWrap: 'wrap' }}>
          <Button variant="primary" size="md">Primary</Button>
          <Button variant="secondary" size="md">Secondary</Button>
          <Button variant="tertiary" size="md">Tertiary</Button>
          <Button variant="destructive-outline" size="md">Delete</Button>
        </HStack>
        {/* Row 2: Form controls */}
        <HStack gap="md" align="center" justify="center" style={{ flexWrap: 'wrap' }}>
          <Input size="md" placeholder="Search…" icon={Search as any} style={{ maxWidth: 200 }} />
          <Toggle size="md" defaultChecked />
          <Checkbox size="md" defaultChecked />
          <Rating size="md" defaultValue={4} />
        </HStack>
        {/* Row 3: Status elements */}
        <HStack gap="sm" align="center" justify="center" style={{ flexWrap: 'wrap' }}>
          <Badge variant="default" size="md">Default</Badge>
          <Badge variant="success" size="md" dot>Active</Badge>
          <Badge variant="warning" size="md">Pending</Badge>
          <Badge variant="danger" size="md">Error</Badge>
          <Badge variant="info" size="md">v0.1</Badge>
          <Tag size="md">React</Tag>
          <Tag size="md">TypeScript</Tag>
        </HStack>
      </VStack>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const FEATURES = [
  {
    icon: Palette,
    title: 'Monochrome by Design',
    description:
      'Grayscale palette with color reserved for status and accent. Stays elegant across every context.',
  },
  {
    icon: Monitor,
    title: 'Cross-Platform',
    description:
      'React + React Native foundations. System fonts, responsive tokens, platform-adaptive behavior.',
  },
  {
    icon: Layers,
    title: 'Full Token System',
    description:
      'Colors, spacing, typography, radii, shadows, motion — everything is tokenized and themeable.',
  },
];

function FeaturesSection() {
  const colors = useThemeColors();

  return (
    <section
      style={{
        padding: '60px 32px',
        borderTop: `1px solid ${colors.border.subtle}`,
      }}
    >
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <Grid columns={3} gap="lg">
          {FEATURES.map((f) => (
            <GridItem key={f.title}>
              <Card variant="outlined" padding="lg" radius="lg">
                <VStack gap="md">
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: colors.background.raised,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <f.icon size={20} color={colors.text.onRaised} />
                  </div>
                  <Text size="md" weight="bold">
                    {f.title}
                  </Text>
                  <Text size="sm" color="secondary">
                    {f.description}
                  </Text>
                </VStack>
              </Card>
            </GridItem>
          ))}
        </Grid>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Showcase Section
// ---------------------------------------------------------------------------

function ShowcaseCard({
  title,
  description,
  to,
  children,
}: {
  title: string;
  description: string;
  to: string;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const colors = useThemeColors();
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      onClick={() => navigate(to)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: 'pointer' }}
    >
      <Card
        variant="outlined"
        padding="none"
        radius="lg"
        style={{
          overflow: 'hidden',
          transition: 'border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease',
          borderColor: hovered ? colors.text.secondary : colors.border.strong,
          boxShadow: hovered ? `0 0 0 1px ${colors.text.secondary}` : 'none',
          transform: hovered ? 'translateY(-2px)' : undefined,
        }}
      >
        <div
          style={{
            padding: 20,
            height: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {children}
        </div>
        <div
          style={{
            padding: '12px 16px',
            borderTop: `1px solid ${colors.border.subtle}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Text size="sm" weight="bold">
              {title}
            </Text>
            <Text size="xs" color="secondary">
              {description}
            </Text>
          </div>
          <ArrowRight size={16} color={colors.text.secondary} style={{ opacity: hovered ? 1 : 0, transition: 'opacity 150ms ease' }} />
        </div>
      </Card>
    </div>
  );
}

function ShowcaseSection() {
  const navigate = useNavigate();
  const colors = useThemeColors();

  return (
    <section
      style={{
        padding: '60px 32px',
        borderTop: `1px solid ${colors.border.subtle}`,
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <VStack gap="xl">
          <VStack gap="xs" align="center" style={{ textAlign: 'center' }}>
            <Text size="display-sm" weight="bold">
              90+ Components
            </Text>
            <Text size="md" color="secondary" style={{ maxWidth: 520 }}>
              Primitives, layouts, and compound components — all built on the same token system.
            </Text>
          </VStack>

          <Grid columns={2} gap="lg">
            {/* Primitives showcase */}
            <GridItem>
              <ShowcaseCard title="Primitives" description="Buttons, inputs, badges, toggles, and more" to="/primitives/button">
                <VStack gap="md">
                  <HStack gap="sm" align="center" style={{ flexWrap: 'wrap' }}>
                    <Button variant="primary" size="sm">Save</Button>
                    <Button variant="secondary" size="sm">Cancel</Button>
                    <Button variant="success" size="sm" iconLeft={<Check size={14} />}>Confirm</Button>
                  </HStack>
                  <HStack gap="sm" align="center">
                    <Toggle size="sm" defaultChecked />
                    <Checkbox size="sm" defaultChecked />
                    <RadioGroup size="sm" defaultValue="a" orientation="horizontal">
                      <Radio value="a" />
                    </RadioGroup>
                    <Slider size="sm" defaultValue={60} style={{ width: 100 }} />
                  </HStack>
                  <HStack gap="xs" align="center" style={{ flexWrap: 'wrap' }}>
                    <Kbd size="sm">⌘</Kbd>
                    <Kbd size="sm">K</Kbd>
                    <Spacer size="xs" />
                    <Spinner size="sm" />
                    <Spacer size="xs" />
                    <Progress size="sm" value={65} style={{ width: 80 }} />
                  </HStack>
                </VStack>
              </ShowcaseCard>
            </GridItem>

            {/* Layout showcase */}
            <GridItem>
              <ShowcaseCard title="Layouts" description="Stack, Grid, Card, Separator, and containers" to="/layouts/card">
                <VStack gap="sm" style={{ width: '100%', maxWidth: 280 }}>
                  <HStack gap="sm" align="center">
                    <Card variant="outlined" padding="sm" radius="md" style={{ flex: 1, textAlign: 'center' }}>
                      <Text size="xs" weight="semibold">Stack</Text>
                    </Card>
                    <Card variant="outlined" padding="sm" radius="md" style={{ flex: 1, textAlign: 'center' }}>
                      <Text size="xs" weight="semibold">Grid</Text>
                    </Card>
                    <Card variant="outlined" padding="sm" radius="md" style={{ flex: 1, textAlign: 'center' }}>
                      <Text size="xs" weight="semibold">Box</Text>
                    </Card>
                  </HStack>
                  <Separator spacing="sm" />
                  <Card variant="outlined" padding="md" radius="md">
                    <VStack gap="xs">
                      <HStack gap="sm" align="center">
                        <Avatar size="sm" name="JD" />
                        <VStack gap="2xs">
                          <Text size="xs" weight="semibold">Jane Doe</Text>
                          <Text size="xs" color="secondary">Developer</Text>
                        </VStack>
                      </HStack>
                      <Separator spacing="sm" />
                      <HStack gap="xs" align="center">
                        <Badge variant="success" size="sm" dot>Active</Badge>
                        <Spacer size="xs" />
                        <Text size="xs" color="tertiary">3 projects</Text>
                      </HStack>
                    </VStack>
                  </Card>
                </VStack>
              </ShowcaseCard>
            </GridItem>

            {/* Data display showcase */}
            <GridItem>
              <ShowcaseCard title="Data Display" description="Badges, chips, indicators, progress, avatars" to="/primitives/badge">
                <VStack gap="md">
                  <HStack gap="xs" align="center" style={{ flexWrap: 'wrap' }}>
                    <Badge variant="success" size="sm" dot>Online</Badge>
                    <Badge variant="warning" size="sm">Idle</Badge>
                    <Badge variant="danger" size="sm">Busy</Badge>
                    <Chip size="sm" color="default">Filter</Chip>
                    <Chip size="sm" color="info" variant="filled">Active</Chip>
                  </HStack>
                  <HStack gap="sm" align="center">
                    <Avatar size="md" name="JD" />
                    <VStack gap="2xs">
                      <Text size="sm" weight="semibold">John Doe</Text>
                      <HStack gap="xs" align="center">
                        <Indicator variant="success" size="sm" />
                        <Text size="xs" color="secondary">Online</Text>
                      </HStack>
                    </VStack>
                  </HStack>
                  <Rating size="sm" defaultValue={4} />
                </VStack>
              </ShowcaseCard>
            </GridItem>

            {/* Feedback showcase */}
            <GridItem>
              <ShowcaseCard title="Feedback" description="Alerts, toasts, spinners, and loading states" to="/primitives/alert">
                <VStack gap="sm">
                  <Alert variant="info" description="New version available — update now for new features." />
                  <Alert variant="success" description="Changes saved successfully." />
                  <HStack gap="md" align="center" justify="center">
                    <Spinner size="sm" />
                    <Progress size="sm" value={75} style={{ flex: 1 }} />
                    <Text size="xs" color="secondary">75%</Text>
                  </HStack>
                </VStack>
              </ShowcaseCard>
            </GridItem>
          </Grid>

          <Center>
            <Button
              variant="primary"
              size="md"
              iconRight={<ArrowRight size={16} />}
              onClick={() => navigate('/primitives')}
            >
              Explore All Components
            </Button>
          </Center>
        </VStack>
      </div>
    </section>
  );
}


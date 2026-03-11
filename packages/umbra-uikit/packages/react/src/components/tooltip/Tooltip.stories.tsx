import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Tooltip } from "./Tooltip";
import { tooltipPlacements } from ".";
import { Text } from "../text";

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof Tooltip> = {
  title: "Components/Tooltip",
  component: Tooltip,
  tags: ["autodocs"],
  argTypes: {
    placement: { control: "select", options: [...tooltipPlacements] },
    delay: { control: "number" },
    maxWidth: { control: "number" },
    disabled: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

// ---------------------------------------------------------------------------
// Helper: section label
// ---------------------------------------------------------------------------

const SectionLabel = ({ children }: { children: string }) => (
  <Text
    size="xs"
    color="tertiary"
    weight="semibold"
    as="div"
    style={{
      textTransform: "uppercase",
      letterSpacing: 1.2,
      marginBottom: 4,
    }}
  >
    {children}
  </Text>
);

// ---------------------------------------------------------------------------
// Center wrapper for stories
// ---------------------------------------------------------------------------

const Center = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: 120,
      padding: 40,
    }}
  >
    {children}
  </div>
);

// ---------------------------------------------------------------------------
// 1. Default (playground)
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    content: "This is a tooltip",
    placement: "top",
    delay: 300,
    maxWidth: 220,
    disabled: false,
  },
  render: (args) => (
    <Center>
      <Tooltip {...args}>
        <button type="button">Hover me</button>
      </Tooltip>
    </Center>
  ),
};

// ---------------------------------------------------------------------------
// 2. Placements
// ---------------------------------------------------------------------------

export const Placements: Story = {
  name: "Placements",
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
        alignItems: "center",
        padding: 60,
      }}
    >
      <SectionLabel>All placements</SectionLabel>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
        }}
      >
        {tooltipPlacements.map((p) => (
          <Tooltip key={p} content={p + " tooltip"} placement={p} delay={0}>
            <button type="button" style={{ padding: "8px 16px" }}>
              {p}
            </button>
          </Tooltip>
        ))}
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Glass
// ---------------------------------------------------------------------------

export const Glass: Story = {
  name: 'Glass',
  render: () => (
    <Center>
      <div style={{ padding: 40, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 16 }}>
        <Tooltip content="Frosted glass tooltip" placement="top" delay={0} variant="glass">
          <button type="button" style={{ padding: '8px 16px', color: '#fff', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 8, cursor: 'pointer' }}>
            Hover for glass tooltip
          </button>
        </Tooltip>
      </div>
    </Center>
  ),
};

// ---------------------------------------------------------------------------
// 4. LongContent
// ---------------------------------------------------------------------------

export const LongContent: Story = {
  name: "Long Content",
  render: () => (
    <Center>
      <Tooltip
        content="This is a tooltip with much longer content that will wrap to multiple lines. It respects the maxWidth prop to avoid becoming too wide."
        maxWidth={280}
      >
        <button type="button">Hover for long tooltip</button>
      </Tooltip>
    </Center>
  ),
};

// ---------------------------------------------------------------------------
// 4. Disabled
// ---------------------------------------------------------------------------

export const Disabled: Story = {
  name: "Disabled",
  render: () => (
    <div
      style={{
        display: "flex",
        gap: 24,
        justifyContent: "center",
        padding: 40,
      }}
    >
      <Tooltip content="I should appear" delay={0}>
        <button type="button">Enabled tooltip</button>
      </Tooltip>
      <Tooltip content="I should NOT appear" disabled delay={0}>
        <button type="button">Disabled tooltip</button>
      </Tooltip>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 5. Delay
// ---------------------------------------------------------------------------

export const Delay: Story = {
  name: "Delay",
  render: () => (
    <div
      style={{
        display: "flex",
        gap: 24,
        justifyContent: "center",
        padding: 40,
      }}
    >
      <Tooltip content="No delay" delay={0}>
        <button type="button">0ms</button>
      </Tooltip>
      <Tooltip content="Default delay" delay={300}>
        <button type="button">300ms</button>
      </Tooltip>
      <Tooltip content="Slow delay" delay={1000}>
        <button type="button">1000ms</button>
      </Tooltip>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 6. Composition
// ---------------------------------------------------------------------------

export const Composition: Story = {
  name: "Composition",
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
        padding: 60,
      }}
    >
      <SectionLabel>Tooltip on different elements</SectionLabel>
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <Tooltip content="Submit form" delay={0}>
          <button type="button" style={{ padding: "8px 16px" }}>
            Submit
          </button>
        </Tooltip>
        <Tooltip content="Click to learn more" placement="bottom" delay={0}>
          <a href="#" style={{ color: "inherit" }}>
            Learn more
          </a>
        </Tooltip>
        <Tooltip content="Status: Online" placement="right" delay={0}>
          <span
            style={{
              display: "inline-block",
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: "#22C55E",
              cursor: "pointer",
            }}
            tabIndex={0}
            role="img"
            aria-label="status indicator"
          />
        </Tooltip>
      </div>

      <SectionLabel>Rich content</SectionLabel>
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <Tooltip
          content={
            <span>
              <strong>Shortcut:</strong> Cmd+S
            </span>
          }
          delay={0}
        >
          <button type="button" style={{ padding: "8px 16px" }}>
            Save
          </button>
        </Tooltip>
      </div>
    </div>
  ),
};

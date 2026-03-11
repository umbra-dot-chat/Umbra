/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Tooltip } from "./Tooltip";
import { tooltipPlacements } from ".";
import { WispProvider } from "../../providers";

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe("Tooltip -- rendering", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders children (trigger element)", () => {
    render(
      <Dark>
        <Tooltip content="Hello">
          <button>Trigger</button>
        </Tooltip>
      </Dark>,
    );
    expect(screen.getByText("Trigger")).toBeInTheDocument();
  });

  it("does not show tooltip content initially", () => {
    render(
      <Dark>
        <Tooltip content="Tooltip text">
          <button>Trigger</button>
        </Tooltip>
      </Dark>,
    );
    // Tooltip is rendered in portal but with opacity 0
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip.querySelector("div")).toHaveStyle({ opacity: 0 });
  });
});

// ---------------------------------------------------------------------------
// Show on hover
// ---------------------------------------------------------------------------

describe("Tooltip -- show on hover", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows tooltip content after hovering with delay", () => {
    render(
      <Dark>
        <Tooltip content="Tooltip text" delay={300}>
          <button>Trigger</button>
        </Tooltip>
      </Dark>,
    );

    const trigger = screen.getByText("Trigger");
    fireEvent.mouseEnter(trigger);

    // Before delay
    const tooltipBefore = screen.getByRole("tooltip");
    expect(tooltipBefore.querySelector("div")).toHaveStyle({ opacity: 0 });

    // After delay
    act(() => {
      vi.advanceTimersByTime(300);
    });

    const tooltipAfter = screen.getByRole("tooltip");
    expect(tooltipAfter.querySelector("div")).toHaveStyle({ opacity: 1 });
  });

  it("shows tooltip content with zero delay", () => {
    render(
      <Dark>
        <Tooltip content="Instant tooltip" delay={0}>
          <button>Trigger</button>
        </Tooltip>
      </Dark>,
    );

    const trigger = screen.getByText("Trigger");
    fireEvent.mouseEnter(trigger);

    act(() => {
      vi.advanceTimersByTime(0);
    });

    const tooltip = screen.getByRole("tooltip");
    expect(tooltip.querySelector("div")).toHaveStyle({ opacity: 1 });
  });
});

// ---------------------------------------------------------------------------
// Hide on leave
// ---------------------------------------------------------------------------

describe("Tooltip -- hide on leave", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("hides tooltip when mouse leaves trigger", () => {
    render(
      <Dark>
        <Tooltip content="Tooltip text" delay={0}>
          <button>Trigger</button>
        </Tooltip>
      </Dark>,
    );

    const trigger = screen.getByText("Trigger");

    // Show
    fireEvent.mouseEnter(trigger);
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(screen.getByRole("tooltip").querySelector("div")).toHaveStyle({
      opacity: 1,
    });

    // Hide
    fireEvent.mouseLeave(trigger);
    expect(screen.getByRole("tooltip").querySelector("div")).toHaveStyle({
      opacity: 0,
    });
  });

  it("hides tooltip on blur", () => {
    render(
      <Dark>
        <Tooltip content="Tooltip text" delay={0}>
          <button>Trigger</button>
        </Tooltip>
      </Dark>,
    );

    const trigger = screen.getByText("Trigger");

    // Show via focus
    fireEvent.focus(trigger);
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(screen.getByRole("tooltip").querySelector("div")).toHaveStyle({
      opacity: 1,
    });

    // Hide via blur
    fireEvent.blur(trigger);
    expect(screen.getByRole("tooltip").querySelector("div")).toHaveStyle({
      opacity: 0,
    });
  });
});

// ---------------------------------------------------------------------------
// Placements
// ---------------------------------------------------------------------------

describe("Tooltip -- placements", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  tooltipPlacements.forEach((p) => {
    it("renders with placement=" + p + " without crashing", () => {
      render(
        <Dark>
          <Tooltip content={"Tooltip " + p} placement={p}>
            <button>{p}</button>
          </Tooltip>
        </Dark>,
      );
      expect(screen.getByText(p)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Disabled
// ---------------------------------------------------------------------------

describe("Tooltip -- disabled", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not show tooltip when disabled", () => {
    render(
      <Dark>
        <Tooltip content="Should not show" disabled delay={0}>
          <button>Trigger</button>
        </Tooltip>
      </Dark>,
    );

    const trigger = screen.getByText("Trigger");
    fireEvent.mouseEnter(trigger);

    act(() => {
      vi.advanceTimersByTime(0);
    });

    // Tooltip should not be rendered at all when disabled
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("does not set aria-describedby when disabled", () => {
    render(
      <Dark>
        <Tooltip content="Should not show" disabled>
          <button>Trigger</button>
        </Tooltip>
      </Dark>,
    );

    const trigger = screen.getByText("Trigger");
    expect(trigger).not.toHaveAttribute("aria-describedby");
  });
});

// ---------------------------------------------------------------------------
// Keyboard dismiss
// ---------------------------------------------------------------------------

describe("Tooltip -- keyboard dismiss", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("hides tooltip on Escape key", () => {
    render(
      <Dark>
        <Tooltip content="Tooltip text" delay={0}>
          <button>Trigger</button>
        </Tooltip>
      </Dark>,
    );

    const trigger = screen.getByText("Trigger");

    // Show
    fireEvent.mouseEnter(trigger);
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(screen.getByRole("tooltip").querySelector("div")).toHaveStyle({
      opacity: 1,
    });

    // Dismiss with Escape
    fireEvent.keyDown(trigger, { key: "Escape" });
    expect(screen.getByRole("tooltip").querySelector("div")).toHaveStyle({
      opacity: 0,
    });
  });
});

// ---------------------------------------------------------------------------
// ARIA attributes
// ---------------------------------------------------------------------------

describe("Tooltip -- aria attributes", () => {
  it("sets aria-describedby on trigger linking to tooltip", () => {
    render(
      <Dark>
        <Tooltip content="Helpful description">
          <button>Trigger</button>
        </Tooltip>
      </Dark>,
    );

    const trigger = screen.getByText("Trigger");
    const tooltipId = trigger.getAttribute("aria-describedby");
    expect(tooltipId).toBeTruthy();

    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toHaveAttribute("id", tooltipId);
  });

  it("tooltip element has role=tooltip", () => {
    render(
      <Dark>
        <Tooltip content="Tooltip text">
          <button>Trigger</button>
        </Tooltip>
      </Dark>,
    );

    expect(screen.getByRole("tooltip")).toBeInTheDocument();
  });
});

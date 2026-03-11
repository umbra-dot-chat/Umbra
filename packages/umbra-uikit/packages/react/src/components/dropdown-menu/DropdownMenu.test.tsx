/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "./DropdownMenu";
import { WispProvider } from "../../providers";

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

function BasicMenu({
  onSelect,
  onOpenChange,
  open,
}: {
  onSelect?: (val: string) => void;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
}) {
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger>
        <span>Trigger</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={() => onSelect?.("edit")}>Edit</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onSelect?.("copy")}>Copy</DropdownMenuItem>
        <DropdownMenuItem disabled onSelect={() => onSelect?.("disabled")}>Disabled</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem danger onSelect={() => onSelect?.("delete")}>Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

describe("DropdownMenu -- rendering", () => {
  it("renders the trigger", () => {
    render(<Wrapper><BasicMenu /></Wrapper>);
    expect(screen.getByText("Trigger")).toBeInTheDocument();
  });

  it("does not show content when closed", () => {
    render(<Wrapper><BasicMenu /></Wrapper>);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("trigger has correct aria attributes", () => {
    render(<Wrapper><BasicMenu /></Wrapper>);
    const trigger = screen.getByText("Trigger").closest("button")!;
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});

describe("DropdownMenu -- opens on click", () => {
  it("shows content after clicking trigger", async () => {
    render(<Wrapper><BasicMenu /></Wrapper>);
    const trigger = screen.getByText("Trigger").closest("button")!;
    await act(async () => { fireEvent.click(trigger); });
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("updates aria-expanded on trigger", async () => {
    render(<Wrapper><BasicMenu /></Wrapper>);
    const trigger = screen.getByText("Trigger").closest("button")!;
    await act(async () => { fireEvent.click(trigger); });
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });
});

describe("DropdownMenu -- item selection", () => {
  it("calls onSelect when an item is clicked", async () => {
    const onSelect = vi.fn();
    render(<Wrapper><BasicMenu onSelect={onSelect} /></Wrapper>);
    const trigger = screen.getByText("Trigger").closest("button")!;
    await act(async () => { fireEvent.click(trigger); });
    await act(async () => { fireEvent.click(screen.getByText("Edit")); });
    expect(onSelect).toHaveBeenCalledWith("edit");
  });

  it("closes the menu after selecting an item", async () => {
    render(<Wrapper><BasicMenu /></Wrapper>);
    const trigger = screen.getByText("Trigger").closest("button")!;
    await act(async () => { fireEvent.click(trigger); });
    await act(async () => { fireEvent.click(screen.getByText("Edit")); });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});

describe("DropdownMenu -- keyboard navigation", () => {
  it("navigates items with ArrowDown then selects with Enter", async () => {
    const onSelect = vi.fn();
    render(<Wrapper><BasicMenu onSelect={onSelect} /></Wrapper>);
    const trigger = screen.getByText("Trigger").closest("button")!;
    await act(async () => { fireEvent.click(trigger); });
    const menu = screen.getByRole("menu");
    // ArrowDown moves to first enabled item (Edit)
    await act(async () => { fireEvent.keyDown(menu, { key: "ArrowDown" }); });
    // Enter selects it
    await act(async () => { fireEvent.keyDown(menu, { key: "Enter" }); });
    expect(onSelect).toHaveBeenCalledWith("edit");
  });

  it("ArrowDown twice then Enter selects second item", async () => {
    const onSelect = vi.fn();
    render(<Wrapper><BasicMenu onSelect={onSelect} /></Wrapper>);
    const trigger = screen.getByText("Trigger").closest("button")!;
    await act(async () => { fireEvent.click(trigger); });
    const menu = screen.getByRole("menu");
    // ArrowDown twice: Edit -> Copy
    await act(async () => { fireEvent.keyDown(menu, { key: "ArrowDown" }); });
    await act(async () => { fireEvent.keyDown(menu, { key: "ArrowDown" }); });
    await act(async () => { fireEvent.keyDown(menu, { key: "Enter" }); });
    expect(onSelect).toHaveBeenCalledWith("copy");
  });

  it("closes on Escape", async () => {
    render(<Wrapper><BasicMenu /></Wrapper>);
    const trigger = screen.getByText("Trigger").closest("button")!;
    await act(async () => { fireEvent.click(trigger); });
    const menu = screen.getByRole("menu");
    await act(async () => { fireEvent.keyDown(menu, { key: "Escape" }); });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("selects item with Enter key after ArrowDown navigation", async () => {
    const onSelect = vi.fn();
    render(<Wrapper><BasicMenu onSelect={onSelect} /></Wrapper>);
    const trigger = screen.getByText("Trigger").closest("button")!;
    await act(async () => { fireEvent.click(trigger); });
    const menu = screen.getByRole("menu");
    // Navigate to second item (Copy) via two ArrowDowns
    await act(async () => { fireEvent.keyDown(menu, { key: "ArrowDown" }); });
    await act(async () => { fireEvent.keyDown(menu, { key: "ArrowDown" }); });
    // Select it
    await act(async () => { fireEvent.keyDown(menu, { key: "Enter" }); });
    expect(onSelect).toHaveBeenCalledWith("copy");
  });
});

describe("DropdownMenu -- disabled items", () => {
  it("renders disabled item with aria-disabled", async () => {
    render(<Wrapper><BasicMenu /></Wrapper>);
    const trigger = screen.getByText("Trigger").closest("button")!;
    await act(async () => { fireEvent.click(trigger); });
    const disabledItem = screen.getByText("Disabled");
    expect(disabledItem.closest("[role='menuitem']")).toHaveAttribute("aria-disabled", "true");
  });

  it("does not call onSelect for disabled items", async () => {
    const onSelect = vi.fn();
    render(<Wrapper><BasicMenu onSelect={onSelect} /></Wrapper>);
    const trigger = screen.getByText("Trigger").closest("button")!;
    await act(async () => { fireEvent.click(trigger); });
    await act(async () => { fireEvent.click(screen.getByText("Disabled")); });
    expect(onSelect).not.toHaveBeenCalledWith("disabled");
  });
});

describe("DropdownMenu -- danger variant", () => {
  it("renders danger item", async () => {
    render(<Wrapper><BasicMenu /></Wrapper>);
    const trigger = screen.getByText("Trigger").closest("button")!;
    await act(async () => { fireEvent.click(trigger); });
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("calls onSelect for danger items", async () => {
    const onSelect = vi.fn();
    render(<Wrapper><BasicMenu onSelect={onSelect} /></Wrapper>);
    const trigger = screen.getByText("Trigger").closest("button")!;
    await act(async () => { fireEvent.click(trigger); });
    await act(async () => { fireEvent.click(screen.getByText("Delete")); });
    expect(onSelect).toHaveBeenCalledWith("delete");
  });
});

describe("DropdownMenu -- close behavior", () => {
  it("closes on click outside", async () => {
    render(
      <Wrapper>
        <div data-testid="outside">outside</div>
        <BasicMenu />
      </Wrapper>,
    );
    const trigger = screen.getByText("Trigger").closest("button")!;
    await act(async () => { fireEvent.click(trigger); });
    expect(screen.getByRole("menu")).toBeInTheDocument();
    await act(async () => { fireEvent.mouseDown(screen.getByTestId("outside")); });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("toggles closed on second trigger click", async () => {
    render(<Wrapper><BasicMenu /></Wrapper>);
    const trigger = screen.getByText("Trigger").closest("button")!;
    await act(async () => { fireEvent.click(trigger); });
    expect(screen.getByRole("menu")).toBeInTheDocument();
    await act(async () => { fireEvent.click(trigger); });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});

describe("DropdownMenu -- aria", () => {
  it("content has role=menu", async () => {
    render(<Wrapper><BasicMenu /></Wrapper>);
    const trigger = screen.getByText("Trigger").closest("button")!;
    await act(async () => { fireEvent.click(trigger); });
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("items have role=menuitem", async () => {
    render(<Wrapper><BasicMenu /></Wrapper>);
    const trigger = screen.getByText("Trigger").closest("button")!;
    await act(async () => { fireEvent.click(trigger); });
    const items = screen.getAllByRole("menuitem");
    expect(items.length).toBeGreaterThanOrEqual(3);
  });

  it("separator has role=separator", async () => {
    render(<Wrapper><BasicMenu /></Wrapper>);
    const trigger = screen.getByText("Trigger").closest("button")!;
    await act(async () => { fireEvent.click(trigger); });
    expect(screen.getByRole("separator")).toBeInTheDocument();
  });
});

describe("DropdownMenu -- controlled", () => {
  it("respects controlled open prop", () => {
    const onOpenChange = vi.fn();
    render(<Wrapper><BasicMenu open={true} onOpenChange={onOpenChange} /></Wrapper>);
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("calls onOpenChange when trigger is clicked in controlled mode", async () => {
    const onOpenChange = vi.fn();
    render(<Wrapper><BasicMenu open={false} onOpenChange={onOpenChange} /></Wrapper>);
    const trigger = screen.getByText("Trigger").closest("button")!;
    await act(async () => { fireEvent.click(trigger); });
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });
});

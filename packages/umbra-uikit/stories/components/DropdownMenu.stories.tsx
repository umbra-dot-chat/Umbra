import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@wisp-ui/react";

const meta: Meta = {
  title: "React/Components/Overlays/DropdownMenu",
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <span>Open Menu</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={() => console.log("Edit")}>Edit</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => console.log("Duplicate")}>Duplicate</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => console.log("Archive")}>Archive</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <span>Actions</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem icon={<span>&#9998;</span>} onSelect={() => console.log("Edit")}>Edit</DropdownMenuItem>
        <DropdownMenuItem icon={<span>&#128203;</span>} onSelect={() => console.log("Copy")}>Copy</DropdownMenuItem>
        <DropdownMenuItem icon={<span>&#128229;</span>} onSelect={() => console.log("Download")}>Download</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};

export const WithShortcuts: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <span>File</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem shortcut="Cmd+N" onSelect={() => console.log("New")}>New</DropdownMenuItem>
        <DropdownMenuItem shortcut="Cmd+O" onSelect={() => console.log("Open")}>Open</DropdownMenuItem>
        <DropdownMenuItem shortcut="Cmd+S" onSelect={() => console.log("Save")}>Save</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem shortcut="Cmd+Q" onSelect={() => console.log("Quit")}>Quit</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};

export const DangerItems: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <span>Manage</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={() => console.log("Settings")}>Settings</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem danger onSelect={() => console.log("Delete")}>Delete Project</DropdownMenuItem>
        <DropdownMenuItem danger onSelect={() => console.log("Remove")}>Remove Account</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};

export const Controlled: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <div>
        <p style={{ marginBottom: 8 }}>Open: {String(open)}</p>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger>
            <span>Controlled</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => console.log("A")}>Option A</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => console.log("B")}>Option B</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  },
};

export const Glass: Story = {
  name: 'Glass',
  render: () => (
    <div style={{ padding: 40, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 16, display: 'inline-block' }}>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <span style={{ color: '#fff', cursor: 'pointer' }}>Glass Menu</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent variant="glass">
          <DropdownMenuItem onSelect={() => console.log("Edit")}>Edit</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => console.log("Duplicate")}>Duplicate</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => console.log("Archive")}>Archive</DropdownMenuItem>
          <DropdownMenuItem danger onSelect={() => console.log("Delete")}>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
};

export const Composition: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 24 }}>
      <DropdownMenu>
        <DropdownMenuTrigger><span>Align Start</span></DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem>Item 1</DropdownMenuItem>
          <DropdownMenuItem>Item 2</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger><span>Align End</span></DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Item 1</DropdownMenuItem>
          <DropdownMenuItem>Item 2</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger><span>With Disabled</span></DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Enabled</DropdownMenuItem>
          <DropdownMenuItem disabled>Disabled</DropdownMenuItem>
          <DropdownMenuItem>Also Enabled</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
};

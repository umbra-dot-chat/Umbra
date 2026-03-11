import React from 'react';
import { Navbar, NavbarBrand, NavbarContent, NavbarItem, Text, HStack, VStack, Button } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

export const navbarEntry: ComponentEntry = {
  slug: 'navbar',
  name: 'Navbar',
  category: 'components',
  subcategory: 'Navigation',
  description:
    'Top navigation bar with brand, content areas, and nav items. Supports solid, transparent, and glass variants with optional sticky positioning.',
  variantCount: 3,
  keywords: ['navbar', 'nav', 'navigation', 'header', 'topbar', 'appbar'],

  cardPreview: (
    <div style={{ width: '100%' }}>
      <Navbar variant="solid" height={44}>
        <NavbarBrand>
          <Text weight="bold" color="inherit">App</Text>
        </NavbarBrand>
        <NavbarContent align="end">
          <NavbarItem active>
            <Text size="xs" color="inherit">Home</Text>
          </NavbarItem>
          <NavbarItem>
            <Text size="xs" color="inherit">About</Text>
          </NavbarItem>
        </NavbarContent>
      </Navbar>
    </div>
  ),

  examples: [
    {
      title: 'Solid',
      render: (
        <Navbar variant="solid">
          <NavbarBrand>
            <Text size="md" weight="bold" color="inherit">Wisp</Text>
          </NavbarBrand>
          <NavbarContent align="end">
            <NavbarItem active>
              <Text color="inherit">Home</Text>
            </NavbarItem>
            <NavbarItem>
              <Text color="inherit">Docs</Text>
            </NavbarItem>
            <NavbarItem>
              <Text color="inherit">Blog</Text>
            </NavbarItem>
          </NavbarContent>
        </Navbar>
      ),
      code: `import { Navbar, NavbarBrand, NavbarContent, NavbarItem } from '@wisp-ui/react';

<Navbar variant="solid">
  <NavbarBrand>Wisp</NavbarBrand>
  <NavbarContent align="end">
    <NavbarItem active>Home</NavbarItem>
    <NavbarItem>Docs</NavbarItem>
  </NavbarContent>
</Navbar>`,
      rnCode: `// Not yet available in React Native`,
    },
    {
      title: 'Transparent',
      render: (
        <Navbar variant="transparent">
          <NavbarBrand>
            <Text size="md" weight="bold">Wisp</Text>
          </NavbarBrand>
          <NavbarContent align="end">
            <NavbarItem active>
              <Text>Home</Text>
            </NavbarItem>
            <NavbarItem>
              <Text color="secondary">Docs</Text>
            </NavbarItem>
            <NavbarItem>
              <Text color="secondary">Blog</Text>
            </NavbarItem>
          </NavbarContent>
        </Navbar>
      ),
      code: `<Navbar variant="transparent">
  <NavbarBrand>Wisp</NavbarBrand>
  <NavbarContent align="end">
    <NavbarItem active>Home</NavbarItem>
    <NavbarItem>Docs</NavbarItem>
  </NavbarContent>
</Navbar>`,
      rnCode: `// Not yet available in React Native`,
    },
    {
      title: 'Glass',
      render: (
        <div style={{ position: 'relative', padding: 40, background: 'linear-gradient(135deg, #7C3AED33, #3B82F633)' }}>
          <Navbar variant="glass">
            <NavbarBrand>
              <Text size="md" weight="bold">Wisp</Text>
            </NavbarBrand>
            <NavbarContent align="end">
              <NavbarItem active>
                <Text>Home</Text>
              </NavbarItem>
              <NavbarItem>
                <Text color="secondary">Docs</Text>
              </NavbarItem>
            </NavbarContent>
          </Navbar>
        </div>
      ),
      code: `<Navbar variant="glass">
  <NavbarBrand>Wisp</NavbarBrand>
  <NavbarContent align="end">
    <NavbarItem active>Home</NavbarItem>
    <NavbarItem>Docs</NavbarItem>
  </NavbarContent>
</Navbar>`,
      rnCode: `// Not yet available in React Native`,
    },
  ],

  props: [
    { name: 'variant', type: "'solid' | 'transparent' | 'glass'", default: "'solid'", description: 'Visual style variant.' },
    { name: 'sticky', type: 'boolean', default: 'false', description: 'Sticks navbar to the top of the viewport.' },
    { name: 'height', type: 'number', default: '56', description: 'Navbar height in pixels.' },
    { name: 'children', type: 'React.ReactNode', description: 'Navbar content (NavbarBrand, NavbarContent, NavbarItem).' },
  ],
};

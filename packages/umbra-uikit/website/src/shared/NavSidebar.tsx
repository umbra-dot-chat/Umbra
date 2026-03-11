import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarSection,
  SidebarItem,
  Text,
} from '@wisp-ui/react';
import {
  Palette,
  Layers,
  LayoutGrid,
  Component,
  Home,
  BookOpen,
} from 'lucide-react';
import { SUBCATEGORY_ORDER } from '../registry';
import type { ComponentCategory } from '../registry';
import { toAnchorId } from './CategoryGrid';

const OVERVIEW_ITEMS = [
  { label: 'Home', path: '/', icon: Home },
  { label: 'Docs', path: '/docs', icon: BookOpen },
];

const LIBRARY_CATEGORIES: {
  label: string;
  category: ComponentCategory;
  path: string;
  icon: React.ComponentType<{ size?: number | string }>;
}[] = [
  { label: 'Tokens', category: 'tokens', path: '/tokens', icon: Palette as any },
  { label: 'Primitives', category: 'primitives', path: '/primitives', icon: Layers as any },
  { label: 'Layouts', category: 'layouts', path: '/layouts', icon: LayoutGrid as any },
  { label: 'Components', category: 'components', path: '/components', icon: Component as any },
];

export function NavSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Sidebar
      width="default"
      position="left"
      style={{
        width: '100%',
        borderRight: 'none',
        borderRadius: 0,
        height: '100%',
      }}
    >
      {/* Logo area */}
      <div style={{ padding: '20px 16px 12px' }}>
        <div
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <img
            src={`${import.meta.env.BASE_URL}wisp-logo.png`}
            alt="Wisp"
            style={{ width: 24, height: 24 }}
          />
          <Text size="lg" weight="bold" color="white">
            wisp
          </Text>
          <Text size="xs" weight="semibold" style={{ color: '#A0A0A8' }}>
            UI Kit
          </Text>
        </div>
      </div>

      {/* Overview section */}
      <SidebarSection title="Overview">
        {OVERVIEW_ITEMS.map((item) => {
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);

          return (
            <SidebarItem
              key={item.path}
              icon={<item.icon size={16} />}
              label={item.label}
              active={isActive}
              onClick={() => navigate(item.path)}
            />
          );
        })}
      </SidebarSection>

      {/* Library section with subcategory nesting */}
      <SidebarSection title="Library">
        {LIBRARY_CATEGORIES.map(({ label, category, path, icon: Icon }) => {
          const isActive =
            path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(path);
          const subcategories = SUBCATEGORY_ORDER[category];

          return (
            <React.Fragment key={path}>
              <SidebarItem
                icon={<Icon size={16} />}
                label={label}
                active={isActive}
                onClick={() => navigate(path)}
              />

              {/* Subcategory items — shown when the parent category is active */}
              {subcategories && isActive && (
                <div style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {subcategories.map((sub) => {
                    const anchorId = toAnchorId(sub);
                    const isSubActive = location.hash === `#${anchorId}`;

                    return (
                      <SidebarItem
                        key={sub}
                        label={sub}
                        active={isSubActive}
                        onClick={() => {
                          navigate(`${path}#${anchorId}`);
                          // Defer scroll to let the route settle
                          requestAnimationFrame(() => {
                            document.getElementById(anchorId)?.scrollIntoView({
                              behavior: 'smooth',
                              block: 'start',
                            });
                          });
                        }}
                        style={{ fontSize: 12, padding: '3px 8px', minHeight: 28 }}
                      />
                    );
                  })}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </SidebarSection>
    </Sidebar>
  );
}

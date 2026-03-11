/**
 * RoleCreateDialog -- Dialog for creating a new community role.
 *
 * @remarks
 * Composes Dialog, Input, ColorPicker, Toggle, Accordion, Checkbox,
 * Button, and RoleBadge to provide a complete role creation form with
 * name, color, preview badge, toggles, and a permission grid.
 *
 * @module components/role-create-dialog
 * @example
 * ```tsx
 * <RoleCreateDialog
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onSubmit={(data) => createRole(data)}
 *   permissionCategories={categories}
 * />
 * ```
 */
import React, { forwardRef, useMemo, useState, useCallback, useEffect } from 'react';
import type {
  RoleCreateDialogProps,
  RoleCreateData,
} from '@coexist/wisp-core/types/RoleCreateDialog.types';
import {
  buildDialogBodyStyle,
  buildRolePreviewSectionStyle,
  buildRolePreviewRowStyle,
  buildPermissionGridStyle,
  buildToggleRowStyle,
  buildToggleLabelStyle,
  buildFieldGroupStyle,
  buildErrorStyle,
  buildFooterStyle,
  buildDangerousLabelStyle,
} from '@coexist/wisp-core/styles/RoleCreateDialog.styles';
import { useTheme } from '../../providers';
import { Dialog } from '../dialog';
import { Input } from '../../primitives/input';
import { Button } from '../../primitives/button';
import { ColorPicker } from '../../primitives/color-picker';
import { Toggle } from '../../primitives/toggle';
import { Checkbox } from '../../primitives/checkbox';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../accordion';
import { RoleBadge } from '../role-badge';
import { Text } from '../../primitives/text';

const DEFAULT_COLOR = '#99AAB5';

/**
 * RoleCreateDialog -- Form dialog for creating a new community role.
 *
 * @remarks
 * Manages internal form state for name, color, hoisted, mentionable,
 * and permissions. Resets all fields when the dialog is closed.
 */
export const RoleCreateDialog = forwardRef<HTMLDivElement, RoleCreateDialogProps>(
  function RoleCreateDialog(
    {
      open,
      onClose,
      onSubmit,
      permissionCategories,
      submitting = false,
      error,
      title = 'Create Role',
      defaultColor = DEFAULT_COLOR,
      colorPresets,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    // -----------------------------------------------------------------------
    // Internal form state
    // -----------------------------------------------------------------------
    const [name, setName] = useState('');
    const [color, setColor] = useState(defaultColor);
    const [hoisted, setHoisted] = useState(false);
    const [mentionable, setMentionable] = useState(false);
    const [permissions, setPermissions] = useState<Record<string, boolean>>({});

    // Reset form state when the dialog closes
    useEffect(() => {
      if (!open) {
        setName('');
        setColor(defaultColor);
        setHoisted(false);
        setMentionable(false);
        setPermissions({});
      }
    }, [open, defaultColor]);

    // -----------------------------------------------------------------------
    // Handlers
    // -----------------------------------------------------------------------
    const handleSubmit = useCallback(() => {
      if (!name.trim()) return;
      const data: RoleCreateData = {
        name: name.trim(),
        color,
        permissions,
        hoisted,
        mentionable,
      };
      onSubmit?.(data);
    }, [name, color, permissions, hoisted, mentionable, onSubmit]);

    const handlePermissionChange = useCallback((key: string, checked: boolean) => {
      setPermissions((prev) => ({ ...prev, [key]: checked }));
    }, []);

    // -----------------------------------------------------------------------
    // Styles
    // -----------------------------------------------------------------------
    const bodyStyle = useMemo(() => buildDialogBodyStyle(theme), [theme]);
    const previewSectionStyle = useMemo(() => buildRolePreviewSectionStyle(theme), [theme]);
    const previewRowStyle = useMemo(() => buildRolePreviewRowStyle(theme), [theme]);
    const permissionGridStyle = useMemo(() => buildPermissionGridStyle(theme), [theme]);
    const toggleRowStyle = useMemo(() => buildToggleRowStyle(theme), [theme]);
    const toggleLabelStyle = useMemo(() => buildToggleLabelStyle(theme), [theme]);
    const fieldGroupStyle = useMemo(() => buildFieldGroupStyle(theme), [theme]);
    const errorStyle = useMemo(() => buildErrorStyle(theme), [theme]);
    const footerStyle = useMemo(() => buildFooterStyle(theme), [theme]);
    const dangerousLabelStyle = useMemo(() => buildDangerousLabelStyle(theme), [theme]);

    // Preview role for RoleBadge
    const previewRole = useMemo(
      () => ({
        id: 'preview',
        name: name || 'New Role',
        color,
        position: 0,
      }),
      [name, color],
    );

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------
    return (
      <Dialog
        open={open}
        onClose={onClose}
        title={title}
        size="lg"
        forceMode="dark"
        footer={
          <div style={footerStyle}>
            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              disabled={!name.trim() || submitting}
              isLoading={submitting}
            >
              Create
            </Button>
          </div>
        }
        style={userStyle}
        className={className}
      >
        <div ref={ref} style={bodyStyle} {...rest}>
          {/* Role name + color + preview */}
          <div style={previewSectionStyle}>
            <div style={fieldGroupStyle}>
              <Input
                label="Role Name"
                placeholder="Enter role name"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                disabled={submitting}
                fullWidth
              />
            </div>

            <div style={fieldGroupStyle}>
              <ColorPicker
                label="Role Color"
                value={color}
                onChange={setColor}
                presets={colorPresets}
                disabled={submitting}
                size="sm"
              />
            </div>

            <div style={previewRowStyle}>
              <Text size="sm" color="secondary">
                Preview:
              </Text>
              <RoleBadge role={previewRole} size="sm" />
            </div>
          </div>

          {/* Hoisted / Mentionable toggles */}
          <div style={permissionGridStyle}>
            <div style={toggleRowStyle}>
              <span style={toggleLabelStyle}>Display role separately</span>
              <Toggle
                checked={hoisted}
                onChange={setHoisted}
                size="sm"
                disabled={submitting}
                label="Hoisted"
              />
            </div>
            <div style={toggleRowStyle}>
              <span style={toggleLabelStyle}>Allow anyone to mention this role</span>
              <Toggle
                checked={mentionable}
                onChange={setMentionable}
                size="sm"
                disabled={submitting}
                label="Mentionable"
              />
            </div>
          </div>

          {/* Permission categories */}
          <Accordion type="multiple">
            {permissionCategories.map((category) => (
              <AccordionItem key={category.name} value={category.name}>
                <AccordionTrigger>{category.name}</AccordionTrigger>
                <AccordionContent>
                  <div style={permissionGridStyle}>
                    {category.permissions.map((perm) => (
                      <Checkbox
                        key={perm.key}
                        checked={!!permissions[perm.key]}
                        onChange={(checked: boolean) =>
                          handlePermissionChange(perm.key, checked)
                        }
                        label={
                          perm.dangerous ? (
                            <span style={dangerousLabelStyle}>{perm.label}</span>
                          ) : (
                            perm.label
                          )
                        }
                        description={perm.description}
                        disabled={submitting}
                        size="sm"
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Error message */}
          {error && (
            <p style={errorStyle} role="alert">
              {error}
            </p>
          )}
        </div>
      </Dialog>
    );
  },
);

RoleCreateDialog.displayName = 'RoleCreateDialog';

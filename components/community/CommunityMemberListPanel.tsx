/**
 * @module CommunityMemberListPanel
 * @description Umbra wrapper around the Wisp MemberList component for communities.
 *
 * Transforms flat community member/role data into grouped sections:
 * - Members grouped by their highest hoisted role (Owner, Admin, Moderator, …)
 * - Non-hoisted members collected in a catch-all "Members" section
 * - Role colors applied to member display names
 * - Online status dots (when presence data is available)
 */

import React, { useMemo } from 'react';
import { MemberList } from '@coexist/wisp-react-native';
import type { MemberListMember, MemberListSection } from '@coexist/wisp-react-native';

// ---------------------------------------------------------------------------
// Community data types (mirrors WASM JSON output shapes)
// ---------------------------------------------------------------------------

/** A member record from `umbra_wasm_community_member_list`. */
export interface CommunityMember {
  community_id: string;
  member_did: string;
  nickname: string | null;
  avatar_url: string | null;
  bio: string | null;
  joined_at: number;
}

/** A role record from `umbra_wasm_community_role_list`. */
export interface CommunityRole {
  id: string;
  name: string;
  color: string | null;
  /** Hierarchy position — higher number = more authority (Owner 1000, Admin 100, Mod 50, Member 0). */
  position: number;
  /** Whether this role is displayed as a separate section in the member list. */
  hoisted: boolean;
}

/** Map of member_did → their assigned CommunityRole[]. */
export type MemberRolesMap = Record<string, CommunityRole[]>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CommunityMemberListPanelProps {
  /** All members in the community. */
  members: CommunityMember[];
  /** All roles defined in the community. */
  roles: CommunityRole[];
  /** Map of member_did → their assigned roles. */
  memberRoles: MemberRolesMap;
  /** Called when a member item is pressed. */
  onMemberClick?: (member: MemberListMember) => void;
  /** Called when the close button is pressed. If omitted, no close button. */
  onClose?: () => void;
  /** Whether the panel is in a loading state. @default false */
  loading?: boolean;
  /** Show loading skeleton. @default false */
  skeleton?: boolean;
  /** Panel title. @default 'Members' */
  title?: string;
}

// ---------------------------------------------------------------------------
// Data transformation
// ---------------------------------------------------------------------------

/**
 * Groups community members into MemberListSections by hoisted roles.
 *
 * 1. Hoisted roles are sorted descending by position (highest authority first).
 * 2. Each member is placed in the bucket of their highest hoisted role.
 * 3. Members with no hoisted role go into a catch-all "Members" section.
 * 4. Empty sections are omitted.
 */
function buildSections(
  members: CommunityMember[],
  roles: CommunityRole[],
  memberRoles: MemberRolesMap,
): MemberListSection[] {
  // 1. Separate hoisted roles and sort by position descending (highest authority first)
  const hoistedRoles = roles
    .filter((r) => r.hoisted)
    .sort((a, b) => b.position - a.position);

  // 2. Create a bucket for each hoisted role + a catch-all bucket
  const buckets = new Map<
    string,
    { role: CommunityRole | null; members: CommunityMember[] }
  >();

  for (const role of hoistedRoles) {
    buckets.set(role.id, { role, members: [] });
  }
  buckets.set('__members__', { role: null, members: [] });

  // 3. Place each member in their highest hoisted role bucket
  for (const member of members) {
    const assigned = memberRoles[member.member_did] ?? [];

    // Find the assigned role with the highest position that is hoisted
    const highestHoisted = assigned
      .filter((r) => r.hoisted)
      .sort((a, b) => b.position - a.position)[0];

    if (highestHoisted && buckets.has(highestHoisted.id)) {
      buckets.get(highestHoisted.id)!.members.push(member);
    } else {
      buckets.get('__members__')!.members.push(member);
    }
  }

  // 4. Convert non-empty buckets to MemberListSection[]
  const sections: MemberListSection[] = [];

  for (const [bucketId, bucket] of buckets) {
    if (bucket.members.length === 0) continue;

    const sectionLabel = bucket.role ? bucket.role.name : 'Members';

    sections.push({
      id: bucketId,
      label: sectionLabel,
      memberCount: bucket.members.length,
      members: bucket.members.map((m): MemberListMember => {
        const assigned = memberRoles[m.member_did] ?? [];
        // Use the highest-position role for the name color
        const topRole = [...assigned].sort((a, b) => b.position - a.position)[0];

        return {
          id: m.member_did,
          name: m.nickname ?? m.member_did.slice(0, 12),
          // status: undefined — online presence is a future integration (item 8.2)
          roleText: topRole?.name,
          roleColor: topRole?.color ?? undefined,
        };
      }),
    });
  }

  return sections;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CommunityMemberListPanel({
  members,
  roles,
  memberRoles,
  onMemberClick,
  onClose,
  loading = false,
  skeleton = false,
  title = 'Members',
}: CommunityMemberListPanelProps) {
  const sections = useMemo(
    () => buildSections(members, roles, memberRoles),
    [members, roles, memberRoles],
  );

  return (
    <MemberList
      sections={sections}
      onMemberClick={onMemberClick}
      onClose={onClose}
      loading={loading}
      skeleton={skeleton}
      title={title}
    />
  );
}

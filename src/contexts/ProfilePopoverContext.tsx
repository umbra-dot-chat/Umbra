import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useProfilePopover } from '@/hooks/useProfilePopover';
import { dbg } from '@/utils/debug';

const SRC = 'ProfilePopoverContext';

type ProfilePopoverContextValue = ReturnType<typeof useProfilePopover>;

const ProfilePopoverContext = createContext<ProfilePopoverContextValue | null>(null);

export function ProfilePopoverProvider({ children }: { children: React.ReactNode }) {
  const value = useProfilePopover();
  const prevMember = useRef(value.selectedMember);

  useEffect(() => {
    if (value.selectedMember !== prevMember.current) {
      if (__DEV__) {
        if (value.selectedMember) {
          dbg.debug('render', 'popover show', { member: value.selectedMember.name }, SRC);
        } else {
          dbg.debug('render', 'popover hide', {}, SRC);
        }
      }
      prevMember.current = value.selectedMember;
    }
  }, [value.selectedMember]);

  return (
    <ProfilePopoverContext.Provider value={value}>
      {children}
    </ProfilePopoverContext.Provider>
  );
}

export function useProfilePopoverContext() {
  const ctx = useContext(ProfilePopoverContext);
  if (!ctx) throw new Error('useProfilePopoverContext must be used within ProfilePopoverProvider');
  return ctx;
}

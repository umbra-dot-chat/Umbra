import React, { createContext, useContext } from 'react';
import { useProfilePopover } from '@/hooks/useProfilePopover';

type ProfilePopoverContextValue = ReturnType<typeof useProfilePopover>;

const ProfilePopoverContext = createContext<ProfilePopoverContextValue | null>(null);

export function ProfilePopoverProvider({ children }: { children: React.ReactNode }) {
  const value = useProfilePopover();
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

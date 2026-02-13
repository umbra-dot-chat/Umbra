import { useState, useCallback } from 'react';

/** A member that can be shown in the profile popover */
export interface ProfileMember {
  id: string;
  name: string;
  status: 'online' | 'idle' | 'offline';
}

export function useProfilePopover() {
  const [selectedMember, setSelectedMember] = useState<ProfileMember | null>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<{ x: number; y: number } | null>(null);

  const showProfile = useCallback((name: string, event?: any) => {
    // Create a simple profile member from the name
    // In the real app, we'd look up the friend's online status
    setSelectedMember({
      id: name,
      name,
      status: 'online', // Default — the component that triggers this can pass real status
    });
    setPopoverAnchor({
      x: event?.nativeEvent?.pageX ?? event?.pageX ?? 0,
      y: event?.nativeEvent?.pageY ?? event?.pageY ?? 0,
    });
  }, []);

  const closeProfile = useCallback(() => {
    setSelectedMember(null);
    setPopoverAnchor(null);
  }, []);

  return { selectedMember, popoverAnchor, showProfile, closeProfile };
}

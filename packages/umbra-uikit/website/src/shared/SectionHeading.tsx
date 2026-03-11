import React from 'react';
import { Text } from '@wisp-ui/react';

interface SectionHeadingProps {
  children: React.ReactNode;
  id?: string;
}

export function SectionHeading({ children, id }: SectionHeadingProps) {
  const anchor = id ?? (typeof children === 'string' ? children.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div id={anchor} style={{ paddingTop: 8, paddingBottom: 4 }}>
      <Text size="lg" weight="bold">
        {children}
      </Text>
    </div>
  );
}

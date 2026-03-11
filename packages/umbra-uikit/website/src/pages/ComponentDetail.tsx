import React from 'react';
import { useParams } from 'react-router-dom';
import { Text, VStack, EmptyState } from '@wisp-ui/react';
import { AlertCircle } from 'lucide-react';
import { findEntry } from '../registry';
import type { ComponentCategory } from '../registry';
import { ComponentPage } from '../shared/ComponentPage';

interface ComponentDetailProps {
  category: ComponentCategory;
}

export function ComponentDetail({ category }: ComponentDetailProps) {
  const { slug } = useParams<{ slug: string }>();
  const entry = slug ? findEntry(category, slug) : undefined;

  if (!entry) {
    return (
      <EmptyState
        icon={<AlertCircle size={32} />}
        title="Component not found"
        description={`No documentation found for "${slug}" in ${category}.`}
      />
    );
  }

  return <ComponentPage entry={entry} />;
}

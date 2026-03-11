import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Text,
  Separator,
  Breadcrumb,
  BreadcrumbItem,
  VStack,
} from '@wisp-ui/react';
import type { ComponentEntry } from '../registry/types';
import { SectionHeading } from './SectionHeading';
import { PreviewFrame } from './PreviewFrame';
import { CodeToggle } from './CodeToggle';
import { PropsTable } from './PropsTable';

interface ComponentPageProps {
  entry: ComponentEntry;
}

/**
 * Generic template for all component detail pages.
 * Renders breadcrumb, title, examples with preview + code toggle, and props table.
 */
export function ComponentPage({ entry }: ComponentPageProps) {
  const navigate = useNavigate();

  const categoryLabel = entry.category.charAt(0).toUpperCase() + entry.category.slice(1);

  return (
    <VStack gap="lg">
      {/* Breadcrumb */}
      <Breadcrumb size="sm">
        <BreadcrumbItem onClick={() => navigate('/')}>Home</BreadcrumbItem>
        <BreadcrumbItem onClick={() => navigate(`/${entry.category}`)}>
          {categoryLabel}
        </BreadcrumbItem>
        <BreadcrumbItem active>{entry.name}</BreadcrumbItem>
      </Breadcrumb>

      {/* Title + description */}
      <div>
        <Text size="display-sm" weight="bold">
          {entry.name}
        </Text>
        <div style={{ marginTop: 6 }}>
          <Text size="md" color="secondary">
            {entry.description}
          </Text>
        </div>
      </div>

      <Separator />

      {/* Examples */}
      {entry.examples.map((example, idx) => (
        <VStack key={idx} gap="sm">
          <SectionHeading>{example.title}</SectionHeading>
          <PreviewFrame label={example.title}>
            {example.render}
          </PreviewFrame>
          <CodeToggle code={example.code} rnCode={example.rnCode} />
        </VStack>
      ))}

      {/* Props table */}
      {entry.props.length > 0 && (
        <>
          <Separator />
          <SectionHeading>Props</SectionHeading>
          <PropsTable props={entry.props} />
        </>
      )}
    </VStack>
  );
}

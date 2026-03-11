/**
 * @module components/video-grid
 * @description React Native VideoGrid component for the Wisp design system.
 *
 * Responsive grid layout for video call participants. Reuses column resolution
 * from `@coexist/wisp-core`.
 */

import React, { forwardRef, useMemo, useCallback } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import type {
  VideoGridLayout,
  VideoParticipant,
} from '@coexist/wisp-core/types/VideoGrid.types';
import { resolveGridColumns } from '@coexist/wisp-core/styles/VideoGrid.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface VideoGridProps extends ViewProps {
  participants: VideoParticipant[];
  layout?: VideoGridLayout;
  spotlightId?: string;
  onParticipantClick?: (participantId: string) => void;
  maxVisible?: number;
  showOverflowCount?: boolean;
  skeleton?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const VideoGrid = forwardRef<View, VideoGridProps>(function VideoGrid(
  {
    participants,
    layout = 'grid',
    spotlightId,
    onParticipantClick,
    maxVisible = 25,
    showOverflowCount = true,
    skeleton = false,
    style: userStyle,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();

  const visibleParticipants = participants.slice(0, maxVisible);
  const overflowCount = participants.length - maxVisible;
  const hasOverflow = overflowCount > 0 && showOverflowCount;

  // -----------------------------------------------------------------------
  // Skeleton
  // -----------------------------------------------------------------------
  if (skeleton) {
    return (
      <View ref={ref} style={[skeletonContainer, { backgroundColor: theme.colors.background.sunken }, userStyle]} {...rest}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[skeletonTile, { backgroundColor: theme.colors.border.subtle }]} />
        ))}
      </View>
    );
  }

  // -----------------------------------------------------------------------
  // Tile renderer
  // -----------------------------------------------------------------------
  const renderTile = useCallback((p: VideoParticipant, tileStyle?: ViewStyle) => {
    const showFallback = p.isCameraOff || !p.videoStream;
    return (
      <Pressable
        key={p.id}
        onPress={() => onParticipantClick?.(p.id)}
        style={[
          baseTileStyle,
          { backgroundColor: theme.colors.background.raised, borderRadius: 8 },
          p.isSpeaking && { borderWidth: 2, borderColor: theme.colors.status.success },
          tileStyle,
        ]}
        accessibilityLabel={p.name}
      >
        {/* Video stream */}
        {!showFallback && p.videoStream && (
          <View style={streamWrapperStyle}>{p.videoStream as React.ReactElement}</View>
        )}

        {/* Fallback */}
        {showFallback && (
          <View style={fallbackStyle}>
            {p.avatar ? (p.avatar as React.ReactElement) : (
              <Text style={[initialStyle, { color: theme.colors.text.secondary }]}>
                {p.name.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
        )}

        {/* Indicators */}
        <View style={indicatorsRowStyle}>
          {p.isMuted && (
            <View style={indicatorBadgeStyle}>
              <Text style={indicatorTextStyle}>M</Text>
            </View>
          )}
          {p.isDeafened && (
            <View style={indicatorBadgeStyle}>
              <Text style={indicatorTextStyle}>D</Text>
            </View>
          )}
          {p.isScreenSharing && (
            <View style={indicatorBadgeStyle}>
              <Text style={indicatorTextStyle}>S</Text>
            </View>
          )}
        </View>

        {/* Name label */}
        <View style={nameLabelContainerStyle}>
          <Text style={nameLabelStyle} numberOfLines={1}>
            {p.name}
          </Text>
        </View>
      </Pressable>
    );
  }, [theme, onParticipantClick]);

  // -----------------------------------------------------------------------
  // Spotlight layout
  // -----------------------------------------------------------------------
  if (layout === 'spotlight') {
    const spotlightParticipant =
      visibleParticipants.find((p) => p.id === spotlightId) ?? visibleParticipants[0];
    const stripParticipants = spotlightParticipant
      ? visibleParticipants.filter((p) => p.id !== spotlightParticipant.id)
      : [];

    return (
      <View ref={ref} style={[spotlightRootStyle, { backgroundColor: theme.colors.background.sunken }, userStyle]} {...rest}>
        {spotlightParticipant && (
          <View style={spotlightMainStyle}>
            {renderTile(spotlightParticipant, { flex: 1 })}
          </View>
        )}
        {stripParticipants.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={stripContentStyle}
            style={stripStyle}
          >
            {stripParticipants.map((p) => renderTile(p, { width: 150, height: 100 }))}
          </ScrollView>
        )}
      </View>
    );
  }

  // -----------------------------------------------------------------------
  // Grid layout
  // -----------------------------------------------------------------------
  const displayCount = hasOverflow ? visibleParticipants.length + 1 : visibleParticipants.length;
  const cols = resolveGridColumns(displayCount);
  const rows = Math.ceil(displayCount / cols);

  return (
    <View ref={ref} style={[gridRootStyle, { backgroundColor: theme.colors.background.sunken }, userStyle]} {...rest}>
      {visibleParticipants.map((p) => (
        <View
          key={p.id}
          style={{
            width: `${100 / cols}%` as unknown as number,
            height: `${100 / rows}%` as unknown as number,
            padding: 2,
          }}
        >
          {renderTile(p, { flex: 1 })}
        </View>
      ))}

      {hasOverflow && (
        <View
          style={{
            width: `${100 / cols}%` as unknown as number,
            height: `${100 / rows}%` as unknown as number,
            padding: 2,
          }}
        >
          <View style={[overflowTileStyle, { backgroundColor: theme.colors.background.raised, borderRadius: 8 }]}>
            <Text style={[overflowTextStyle, { color: theme.colors.text.secondary }]}>
              +{overflowCount}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
});

VideoGrid.displayName = 'VideoGrid';

// ---------------------------------------------------------------------------
// Static styles
// ---------------------------------------------------------------------------

const gridRootStyle: ViewStyle = {
  flex: 1,
  flexDirection: 'row',
  flexWrap: 'wrap',
  alignContent: 'center',
  padding: 2,
  borderRadius: 12,
};

const spotlightRootStyle: ViewStyle = {
  flex: 1,
  flexDirection: 'column',
  padding: 4,
  gap: 4,
  borderRadius: 12,
};

const spotlightMainStyle: ViewStyle = {
  flex: 1,
  minHeight: 0,
};

const stripStyle: ViewStyle = {
  flexGrow: 0,
  flexShrink: 0,
  height: 108,
};

const stripContentStyle: ViewStyle = {
  gap: 4,
  alignItems: 'center',
  paddingHorizontal: 2,
};

const baseTileStyle: ViewStyle = {
  overflow: 'hidden',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
};

const streamWrapperStyle: ViewStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  alignItems: 'center',
  justifyContent: 'center',
};

const fallbackStyle: ViewStyle = {
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
};

const initialStyle: TextStyle = {
  fontSize: 24,
  fontWeight: '600',
};

const indicatorsRowStyle: ViewStyle = {
  position: 'absolute',
  top: 6,
  right: 6,
  flexDirection: 'row',
  gap: 4,
};

const indicatorBadgeStyle: ViewStyle = {
  width: 18,
  height: 18,
  borderRadius: 4,
  backgroundColor: 'rgba(0,0,0,0.5)',
  alignItems: 'center',
  justifyContent: 'center',
};

const indicatorTextStyle: TextStyle = {
  color: '#ffffff',
  fontSize: 9,
  fontWeight: '700',
};

const nameLabelContainerStyle: ViewStyle = {
  position: 'absolute',
  bottom: 6,
  left: 6,
  right: 6,
};

const nameLabelStyle: TextStyle = {
  fontSize: 11,
  fontWeight: '500',
  color: '#ffffff',
};

const overflowTileStyle: ViewStyle = {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
};

const overflowTextStyle: TextStyle = {
  fontSize: 16,
  fontWeight: '600',
};

const skeletonContainer: ViewStyle = {
  flex: 1,
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 4,
  padding: 4,
  borderRadius: 12,
};

const skeletonTile: ViewStyle = {
  width: '48%',
  height: 100,
  borderRadius: 8,
};

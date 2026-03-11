import React, { forwardRef, useMemo, useId } from 'react';
import type { QRCodeProps, QRCodeGradient, QRCodeEyeFrameStyle, QRCodeEyePupilStyle } from '@coexist/wisp-core/types/QRCode.types';
import { qrCodeSizeMap } from '@coexist/wisp-core/types/QRCode.types';
import {
  computeQRMatrix,
  isFinderPattern,
  isInFinderCore,
  getFinderEyes,
  getModuleRect,
  isInLogoArea,
  diamondPath,
  starPath,
  classyPath,
} from '@coexist/wisp-core/styles/qr-utils';
import {
  resolveQRCodeColors,
  buildQRCodeWrapperStyle,
  buildQRCodeSvgStyle,
  buildQRCodeLogoOverlayStyle,
} from '@coexist/wisp-core/styles/QRCode.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Gradient SVG defs helper
// ---------------------------------------------------------------------------

function GradientDefs({
  gradient,
  gradientId,
  dimension,
}: {
  gradient: QRCodeGradient;
  gradientId: string;
  dimension: number;
}) {
  if (gradient.type === 'radial') {
    return (
      <defs>
        <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
          {gradient.stops.map((stop, i) => (
            <stop key={i} offset={`${stop.offset * 100}%`} stopColor={stop.color} />
          ))}
        </radialGradient>
      </defs>
    );
  }

  // Linear gradient with rotation
  const angle = ((gradient.rotation ?? 0) * Math.PI) / 180;
  const cx = dimension / 2;
  const cy = dimension / 2;
  const length = dimension * 0.7071; // sqrt(2)/2
  const x1 = cx - length * Math.cos(angle);
  const y1 = cy - length * Math.sin(angle);
  const x2 = cx + length * Math.cos(angle);
  const y2 = cy + length * Math.sin(angle);

  return (
    <defs>
      <linearGradient id={gradientId} x1={x1} y1={y1} x2={x2} y2={y2} gradientUnits="userSpaceOnUse">
        {gradient.stops.map((stop, i) => (
          <stop key={i} offset={`${stop.offset * 100}%`} stopColor={stop.color} />
        ))}
      </linearGradient>
    </defs>
  );
}

// ---------------------------------------------------------------------------
// Eye rendering helpers
// ---------------------------------------------------------------------------

function renderEyeFrame(
  x: number,
  y: number,
  moduleSize: number,
  style: QRCodeEyeFrameStyle,
  fill: string,
  bgFill: string,
): React.ReactElement {
  const size = 7 * moduleSize;
  const innerSize = 5 * moduleSize;
  const innerOffset = moduleSize;

  switch (style) {
    case 'circle':
      return (
        <g>
          <circle cx={x + size / 2} cy={y + size / 2} r={size / 2} fill={fill} />
          <circle cx={x + size / 2} cy={y + size / 2} r={innerSize / 2} fill={bgFill} />
        </g>
      );
    case 'rounded': {
      const rx = moduleSize * 1.5;
      return (
        <g>
          <rect x={x} y={y} width={size} height={size} rx={rx} ry={rx} fill={fill} />
          <rect x={x + innerOffset} y={y + innerOffset} width={innerSize} height={innerSize} rx={rx * 0.7} ry={rx * 0.7} fill={bgFill} />
        </g>
      );
    }
    default: // square
      return (
        <g>
          <rect x={x} y={y} width={size} height={size} fill={fill} />
          <rect x={x + innerOffset} y={y + innerOffset} width={innerSize} height={innerSize} fill={bgFill} />
        </g>
      );
  }
}

function renderEyePupil(
  x: number,
  y: number,
  moduleSize: number,
  style: QRCodeEyePupilStyle,
  fill: string,
): React.ReactElement {
  const size = 3 * moduleSize;
  const cx = x + size / 2;
  const cy = y + size / 2;

  switch (style) {
    case 'circle':
      return <circle cx={cx} cy={cy} r={size / 2} fill={fill} />;
    case 'rounded': {
      const rx = moduleSize * 0.8;
      return <rect x={x} y={y} width={size} height={size} rx={rx} ry={rx} fill={fill} />;
    }
    case 'diamond':
      return <path d={diamondPath(cx, cy, size)} fill={fill} />;
    default: // square
      return <rect x={x} y={y} width={size} height={size} fill={fill} />;
  }
}

// ---------------------------------------------------------------------------
// QRCode Component
// ---------------------------------------------------------------------------

/**
 * QRCode — Stylised QR code generator.
 *
 * @remarks
 * Renders a QR code using raw SVG with customisable dot shapes, gradient fills,
 * finder-pattern eye styling, theme-aware colours, and an optional centre logo.
 *
 * @see {@link QRCodeProps} for the full prop API.
 *
 * @example
 * ```tsx
 * <QRCode value="https://example.com" size="lg" dotStyle="classy-rounded" />
 * ```
 */
export const QRCode = forwardRef<HTMLDivElement, QRCodeProps>(
  function QRCode(
    {
      value,
      size = 'md',
      dotStyle = 'square',
      errorLevel = 'M',
      darkColor,
      lightColor,
      gradient,
      eyeFrameStyle = 'square',
      eyePupilStyle = 'square',
      eyeColor,
      logo,
      logoSize = 0.2,
      logoBgColor,
      showQuietZone = true,
      children,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
  const themeColors = theme.colors;
    const sizeConfig = qrCodeSizeMap[size];
    const instanceId = useId();
    const gradientId = `qr-grad-${instanceId}`;

    // -----------------------------------------------------------------------
    // Colours
    // -----------------------------------------------------------------------
    const defaultColors = useMemo(
      () => resolveQRCodeColors(theme),
      [theme],
    );

    const dark = darkColor || defaultColors.dark;
    const light = lightColor || defaultColors.light;
    const logoBg = logoBgColor || light;
    const dotFill = gradient ? `url(#${gradientId})` : dark;
    const eyeFill = eyeColor || dark;

    // -----------------------------------------------------------------------
    // QR matrix
    // -----------------------------------------------------------------------
    const hasLogo = !!(logo || children);

    // Auto-upgrade error level when logo is present
    const effectiveErrorLevel = useMemo(() => {
      if (hasLogo && (errorLevel === 'L' || errorLevel === 'M')) {
        return 'Q';
      }
      return errorLevel;
    }, [hasLogo, errorLevel]);

    const qrData = useMemo(
      () => computeQRMatrix(value, effectiveErrorLevel),
      [value, effectiveErrorLevel],
    );

    const { matrix, moduleCount } = qrData;

    // -----------------------------------------------------------------------
    // Layout calculations
    // -----------------------------------------------------------------------
    const quietZoneModules = showQuietZone ? sizeConfig.quietZone : 0;
    const totalModules = moduleCount + 2 * quietZoneModules;
    const moduleSize = sizeConfig.dimension / totalModules;
    const quietZoneOffset = quietZoneModules * moduleSize;

    // -----------------------------------------------------------------------
    // Styles
    // -----------------------------------------------------------------------
    const wrapperStyle = useMemo(() => buildQRCodeWrapperStyle(), [theme]);
    const svgStyle = useMemo(() => buildQRCodeSvgStyle(sizeConfig), [sizeConfig]);

    // -----------------------------------------------------------------------
    // Custom eyes
    // -----------------------------------------------------------------------
    const hasCustomEyes = eyeFrameStyle !== 'square' || eyePupilStyle !== 'square' || !!eyeColor;

    const eyeElements = useMemo(() => {
      if (!hasCustomEyes) return null;
      const eyes = getFinderEyes(moduleCount);
      return eyes.map((eye, i) => {
        const ex = quietZoneOffset + eye.col * moduleSize;
        const ey = quietZoneOffset + eye.row * moduleSize;
        const pupilX = ex + 2 * moduleSize;
        const pupilY = ey + 2 * moduleSize;

        return (
          <g key={`eye-${i}`}>
            {renderEyeFrame(ex, ey, moduleSize, eyeFrameStyle, eyeFill, light)}
            {renderEyePupil(pupilX, pupilY, moduleSize, eyePupilStyle, eyeFill)}
          </g>
        );
      });
    }, [hasCustomEyes, moduleCount, quietZoneOffset, moduleSize, eyeFrameStyle, eyePupilStyle, eyeFill, light]);

    // -----------------------------------------------------------------------
    // Render data module
    // -----------------------------------------------------------------------
    const renderModule = (row: number, col: number) => {
      if (!matrix[row][col]) return null;

      // Clear logo area
      if (hasLogo && isInLogoArea(row, col, moduleCount, logoSize)) {
        return null;
      }

      // Skip finder pattern core modules when custom eyes handle them
      if (hasCustomEyes && isInFinderCore(row, col, moduleCount)) {
        return null;
      }

      const { x, y, size: mSize } = getModuleRect(row, col, moduleSize, quietZoneOffset);
      const key = `${row}-${col}`;

      // When no custom eyes, finder pattern area (including separators) uses square style
      if (!hasCustomEyes && isFinderPattern(row, col, moduleCount)) {
        return <rect key={key} x={x} y={y} width={mSize} height={mSize} fill={dotFill} />;
      }

      const cx = x + mSize / 2;
      const cy = y + mSize / 2;

      switch (dotStyle) {
        case 'circle': {
          const r = mSize / 2;
          return <circle key={key} cx={cx} cy={cy} r={r * 0.85} fill={dotFill} />;
        }
        case 'rounded': {
          const rx = mSize * 0.3;
          return <rect key={key} x={x} y={y} width={mSize} height={mSize} rx={rx} ry={rx} fill={dotFill} />;
        }
        case 'diamond':
          return <path key={key} d={diamondPath(cx, cy, mSize * 0.9)} fill={dotFill} />;
        case 'star':
          return <path key={key} d={starPath(cx, cy, mSize * 0.95)} fill={dotFill} />;
        case 'classy':
          return <path key={key} d={classyPath(x, y, mSize, false)} fill={dotFill} />;
        case 'classy-rounded':
          return <path key={key} d={classyPath(x, y, mSize, true)} fill={dotFill} />;
        default: // square
          return <rect key={key} x={x} y={y} width={mSize} height={mSize} fill={dotFill} />;
      }
    };

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------
    return (
      <div
        ref={ref}
        className={className}
        style={{ ...wrapperStyle, ...userStyle }}
        role="img"
        aria-label={`QR code encoding: ${value}`}
        {...rest}
      >
        <div style={svgStyle}>
          <svg
            viewBox={`0 0 ${sizeConfig.dimension} ${sizeConfig.dimension}`}
            xmlns="http://www.w3.org/2000/svg"
            shapeRendering="crispEdges"
            style={{ width: sizeConfig.dimension, height: sizeConfig.dimension, display: 'block' }}
          >
            {/* Gradient defs */}
            {gradient && (
              <GradientDefs
                gradient={gradient}
                gradientId={gradientId}
                dimension={sizeConfig.dimension}
              />
            )}

            {/* Background */}
            <rect x={0} y={0} width={sizeConfig.dimension} height={sizeConfig.dimension} fill={light} />

            {/* Data modules */}
            {matrix.map((row, rowIdx) =>
              row.map((_, colIdx) => renderModule(rowIdx, colIdx)),
            )}

            {/* Custom finder-pattern eyes (rendered with geometricPrecision for smooth curves) */}
            {eyeElements && (
              <g shapeRendering="geometricPrecision">
                {eyeElements}
              </g>
            )}

            {/* Logo background */}
            {hasLogo && (() => {
              const logoAreaPx = moduleCount * moduleSize * logoSize;
              const logoCx = quietZoneOffset + (moduleCount * moduleSize) / 2;
              const logoCy = logoCx;
              return (
                <rect
                  x={logoCx - logoAreaPx / 2 - 2}
                  y={logoCy - logoAreaPx / 2 - 2}
                  width={logoAreaPx + 4}
                  height={logoAreaPx + 4}
                  rx={4}
                  ry={4}
                  fill={logoBg}
                />
              );
            })()}
          </svg>

          {/* Logo / children overlay */}
          {hasLogo && (
            <div style={buildQRCodeLogoOverlayStyle(sizeConfig)}>
              {logo || children}
            </div>
          )}
        </div>
      </div>
    );
  },
);

QRCode.displayName = 'QRCode';

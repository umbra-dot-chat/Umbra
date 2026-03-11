import React, { forwardRef, useMemo } from 'react';
import { View } from 'react-native';
import Svg, {
  Rect,
  Circle as SvgCircle,
  Path,
  Defs,
  LinearGradient as SvgLinearGradient,
  RadialGradient as SvgRadialGradient,
  Stop,
  G,
} from 'react-native-svg';
import type {
  QRCodeSize,
  QRCodeDotStyle,
  QRCodeErrorLevel,
  QRCodeGradient,
  QRCodeEyeFrameStyle,
  QRCodeEyePupilStyle,
} from '@coexist/wisp-core/types/QRCode.types';
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
import { resolveQRCodeColors } from '@coexist/wisp-core/styles/QRCode.styles';
import { useTheme } from '../../providers';

export interface QRCodeProps {
  value: string;
  size?: QRCodeSize;
  dotStyle?: QRCodeDotStyle;
  errorLevel?: QRCodeErrorLevel;
  darkColor?: string;
  lightColor?: string;
  gradient?: QRCodeGradient;
  eyeFrameStyle?: QRCodeEyeFrameStyle;
  eyePupilStyle?: QRCodeEyePupilStyle;
  eyeColor?: string;
  logo?: React.ReactNode;
  logoSize?: number;
  logoBgColor?: string;
  showQuietZone?: boolean;
  children?: React.ReactNode;
  style?: object;
}

let idCounter = 0;

/**
 * QRCode — Stylised QR code generator (React Native).
 *
 * @remarks
 * Renders a QR code using `react-native-svg` with customisable dot shapes,
 * gradient fills, eye styling, and an optional centre logo overlay.
 */
export const QRCode = forwardRef<View, QRCodeProps>(
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
    },
    ref,
  ) {
    const { theme } = useTheme();
    const themeColors = theme.colors;
    const sizeConfig = qrCodeSizeMap[size];
    const gradientId = useMemo(() => `qr-grad-${++idCounter}`, []);

    // -----------------------------------------------------------------------
    // Colours
    // -----------------------------------------------------------------------
    const defaultColors = useMemo(
      () => resolveQRCodeColors(theme),
      [themeColors],
    );

    const dark = darkColor || defaultColors.dark;
    const light = lightColor || defaultColors.light;
    // Eye inner ring needs a solid colour to create contrast — if lightColor
    // is transparent we fall back to the theme canvas so the ring is visible.
    const eyeGap =
      lightColor === 'transparent' ? defaultColors.light : light;
    const logoBg = logoBgColor || light;
    const dotFill = gradient ? `url(#${gradientId})` : dark;
    const eyeFill = eyeColor || dark;

    // -----------------------------------------------------------------------
    // QR matrix
    // -----------------------------------------------------------------------
    const hasLogo = !!(logo || children);

    const effectiveErrorLevel = useMemo(() => {
      if (hasLogo && (errorLevel === 'L' || errorLevel === 'M')) {
        return 'Q' as const;
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
    // Custom eyes
    // -----------------------------------------------------------------------
    const hasCustomEyes = eyeFrameStyle !== 'square' || eyePupilStyle !== 'square' || !!eyeColor;

    // -----------------------------------------------------------------------
    // Render modules
    // -----------------------------------------------------------------------
    const modules = useMemo(() => {
      const elements: React.ReactElement[] = [];

      for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
          if (!matrix[row][col]) continue;
          if (hasLogo && isInLogoArea(row, col, moduleCount, logoSize)) continue;
          if (hasCustomEyes && isInFinderCore(row, col, moduleCount)) continue;

          const { x, y, size: mSize } = getModuleRect(row, col, moduleSize, quietZoneOffset);
          const isFinder = isFinderPattern(row, col, moduleCount);
          const key = `${row}-${col}`;

          // Finder patterns use square when no custom eyes
          if (isFinder && !hasCustomEyes) {
            elements.push(
              <Rect key={key} x={x} y={y} width={mSize} height={mSize} fill={dotFill} />,
            );
            continue;
          }

          const cx = x + mSize / 2;
          const cy = y + mSize / 2;

          switch (dotStyle) {
            case 'circle': {
              const r = mSize / 2;
              elements.push(
                <SvgCircle key={key} cx={cx} cy={cy} r={r * 0.85} fill={dotFill} />,
              );
              break;
            }
            case 'rounded': {
              const rx = mSize * 0.3;
              elements.push(
                <Rect key={key} x={x} y={y} width={mSize} height={mSize} rx={rx} ry={rx} fill={dotFill} />,
              );
              break;
            }
            case 'diamond':
              elements.push(
                <Path key={key} d={diamondPath(cx, cy, mSize * 0.9)} fill={dotFill} />,
              );
              break;
            case 'star':
              elements.push(
                <Path key={key} d={starPath(cx, cy, mSize * 0.95)} fill={dotFill} />,
              );
              break;
            case 'classy':
              elements.push(
                <Path key={key} d={classyPath(x, y, mSize, false)} fill={dotFill} />,
              );
              break;
            case 'classy-rounded':
              elements.push(
                <Path key={key} d={classyPath(x, y, mSize, true)} fill={dotFill} />,
              );
              break;
            default: // square
              elements.push(
                <Rect key={key} x={x} y={y} width={mSize} height={mSize} fill={dotFill} />,
              );
          }
        }
      }

      return elements;
    }, [matrix, moduleCount, moduleSize, quietZoneOffset, hasLogo, logoSize, hasCustomEyes, dotStyle, dotFill]);

    // -----------------------------------------------------------------------
    // Eye elements
    // -----------------------------------------------------------------------
    const eyeElements = useMemo(() => {
      if (!hasCustomEyes) return null;
      const eyes = getFinderEyes(moduleCount);
      return eyes.map((eye, i) => {
        const ex = quietZoneOffset + eye.col * moduleSize;
        const ey = quietZoneOffset + eye.row * moduleSize;
        const eyeSize = 7 * moduleSize;
        const innerSize = 5 * moduleSize;
        const innerOffset = moduleSize;
        const pupilX = ex + 2 * moduleSize;
        const pupilY = ey + 2 * moduleSize;
        const pupilSize = 3 * moduleSize;

        // Frame
        let frame: React.ReactElement;
        switch (eyeFrameStyle) {
          case 'circle':
            frame = (
              <G>
                <SvgCircle cx={ex + eyeSize / 2} cy={ey + eyeSize / 2} r={eyeSize / 2} fill={eyeFill} />
                <SvgCircle cx={ex + eyeSize / 2} cy={ey + eyeSize / 2} r={innerSize / 2} fill={eyeGap} />
              </G>
            );
            break;
          case 'rounded': {
            const rx = moduleSize * 1.5;
            frame = (
              <G>
                <Rect x={ex} y={ey} width={eyeSize} height={eyeSize} rx={rx} ry={rx} fill={eyeFill} />
                <Rect x={ex + innerOffset} y={ey + innerOffset} width={innerSize} height={innerSize} rx={rx * 0.7} ry={rx * 0.7} fill={eyeGap} />
              </G>
            );
            break;
          }
          default:
            frame = (
              <G>
                <Rect x={ex} y={ey} width={eyeSize} height={eyeSize} fill={eyeFill} />
                <Rect x={ex + innerOffset} y={ey + innerOffset} width={innerSize} height={innerSize} fill={eyeGap} />
              </G>
            );
        }

        // Pupil
        const pcx = pupilX + pupilSize / 2;
        const pcy = pupilY + pupilSize / 2;
        let pupil: React.ReactElement;
        switch (eyePupilStyle) {
          case 'circle':
            pupil = <SvgCircle cx={pcx} cy={pcy} r={pupilSize / 2} fill={eyeFill} />;
            break;
          case 'rounded': {
            const rx = moduleSize * 0.8;
            pupil = <Rect x={pupilX} y={pupilY} width={pupilSize} height={pupilSize} rx={rx} ry={rx} fill={eyeFill} />;
            break;
          }
          case 'diamond':
            pupil = <Path d={diamondPath(pcx, pcy, pupilSize)} fill={eyeFill} />;
            break;
          default:
            pupil = <Rect x={pupilX} y={pupilY} width={pupilSize} height={pupilSize} fill={eyeFill} />;
        }

        return (
          <G key={`eye-${i}`}>
            {frame}
            {pupil}
          </G>
        );
      });
    }, [hasCustomEyes, moduleCount, quietZoneOffset, moduleSize, eyeFrameStyle, eyePupilStyle, eyeFill, eyeGap]);

    // Logo background rect
    const logoBgRect = useMemo(() => {
      if (!hasLogo) return null;
      const logoAreaPx = moduleCount * moduleSize * logoSize;
      const logoCx = quietZoneOffset + (moduleCount * moduleSize) / 2;
      const logoCy = logoCx;
      return (
        <Rect
          x={logoCx - logoAreaPx / 2 - 2}
          y={logoCy - logoAreaPx / 2 - 2}
          width={logoAreaPx + 4}
          height={logoAreaPx + 4}
          rx={4}
          ry={4}
          fill={logoBg}
        />
      );
    }, [hasLogo, moduleCount, moduleSize, logoSize, quietZoneOffset, logoBg]);

    // -----------------------------------------------------------------------
    // Gradient defs
    // -----------------------------------------------------------------------
    const gradientDefs = useMemo(() => {
      if (!gradient) return null;

      if (gradient.type === 'radial') {
        return (
          <Defs>
            <SvgRadialGradient id={gradientId} cx="50%" cy="50%" r="50%">
              {gradient.stops.map((stop, i) => (
                <Stop key={i} offset={`${stop.offset * 100}%`} stopColor={stop.color} />
              ))}
            </SvgRadialGradient>
          </Defs>
        );
      }

      const angle = ((gradient.rotation ?? 0) * Math.PI) / 180;
      const dim = sizeConfig.dimension;
      const cx = dim / 2;
      const cy = dim / 2;
      const length = dim * 0.7071;
      const x1 = cx - length * Math.cos(angle);
      const y1 = cy - length * Math.sin(angle);
      const x2 = cx + length * Math.cos(angle);
      const y2 = cy + length * Math.sin(angle);

      return (
        <Defs>
          <SvgLinearGradient id={gradientId} x1={x1} y1={y1} x2={x2} y2={y2} gradientUnits="userSpaceOnUse">
            {gradient.stops.map((stop, i) => (
              <Stop key={i} offset={`${stop.offset * 100}%`} stopColor={stop.color} />
            ))}
          </SvgLinearGradient>
        </Defs>
      );
    }, [gradient, gradientId, sizeConfig.dimension]);

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------
    return (
      <View
        ref={ref}
        accessibilityRole="image"
        accessibilityLabel={`QR code encoding: ${value}`}
        style={[{ alignItems: 'center' }, userStyle]}
      >
        <View style={{ position: 'relative', width: sizeConfig.dimension, height: sizeConfig.dimension }}>
          <Svg
            width={sizeConfig.dimension}
            height={sizeConfig.dimension}
            viewBox={`0 0 ${sizeConfig.dimension} ${sizeConfig.dimension}`}
          >
            {/* Gradient defs */}
            {gradientDefs}

            {/* Background */}
            <Rect x={0} y={0} width={sizeConfig.dimension} height={sizeConfig.dimension} fill={light} />

            {/* QR modules */}
            {modules}

            {/* Custom eyes */}
            {eyeElements}

            {/* Logo background */}
            {logoBgRect}
          </Svg>

          {/* Logo / children overlay */}
          {hasLogo && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: sizeConfig.dimension,
                height: sizeConfig.dimension,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              pointerEvents="none"
            >
              {logo || children}
            </View>
          )}
        </View>
      </View>
    );
  },
);

QRCode.displayName = 'QRCode';

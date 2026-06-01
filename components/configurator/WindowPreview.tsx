'use client';

import { useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type {
  Dimensions,
  GlassCount,
  OpenDirection,
  ActivePane,
  HandleSide,
  OptionItem,
} from '@/lib/configurator/types';

const SVG_SIZE = 400;
const PADDING = 32;
const INNER_MAX = SVG_SIZE - PADDING * 2;
const FRAME_SW = 12;


interface Props {
  dimensions: Dimensions;
  glassCount: GlassCount | null;
  opens: boolean | null;
  isOscilo: boolean | null;
  openDirection: OpenDirection | null;
  activePane: ActivePane | null;
  handleSide: HandleSide | null;
  selectedColor: string | null;
  colorOptions: OptionItem[];
}

export function WindowPreview({
  dimensions,
  glassCount,
  opens,
  isOscilo,
  openDirection,
  activePane,
  handleSide,
  selectedColor,
  colorOptions,
}: Props) {
  const { width, height } = dimensions;
  const hasWidth = width !== null && width > 0;
  const hasHeight = height !== null && height > 0;

  const frameColor =
    colorOptions.find((o) => o.id === selectedColor)?.colorValue ?? '#8B6914';

  const maxW = glassCount === 2 ? 300 : 150;
  const maxH = glassCount === 2 ? 420 : 210;
  const pxPerCm = Math.min(INNER_MAX / maxW, INNER_MAX / maxH);

  const svgW = hasWidth ? Math.round(width! * pxPerCm) : 0;
  const svgH = hasHeight ? Math.round(height! * pxPerCm) : 0;

  const frameX = PADDING + (INNER_MAX - svgW) / 2;
  const frameY = PADDING + (INNER_MAX - svgH) / 2;

  const glassInset = FRAME_SW;
  const paneY = frameY + glassInset;
  const paneH = Math.max(0, svgH - glassInset * 2);

  const lastValid = useRef({ svgH, frameY, paneY, paneH });
  if (hasHeight && svgH > 0) {
    lastValid.current = { svgH, frameY, paneY, paneH };
  }

  const paneCount = glassCount === 2 ? 2 : 1;
  const dividerX = frameX + svgW / 2;

  function renderOpeningIndicator(
    paneX: number,
    paneW: number,
    direction: OpenDirection,
  ) {
    if (!opens) return null;
    const py = paneY;
    const ph = paneH;
    const pw = paneW;

    // direction 'left': hinge on right → line from top-right to bottom-left
    // direction 'right': hinge on left → line from top-left to bottom-right
    const [x1, y1, x2, y2] =
      direction === 'left'
        ? [paneX + pw, py, paneX, py + ph]
        : [paneX, py, paneX + pw, py + ph];

    if (isOscilo) {
      return (
        <g stroke={frameColor} strokeWidth={1.5} opacity={0.7}>
          <line x1={x1} y1={y1} x2={x2} y2={y2} />
          <line
            x1={paneX + pw / 2}
            y1={py}
            x2={paneX + pw / 2}
            y2={py + ph * 0.6}
          />
          <polygon
            points={`${paneX + pw / 2 - 5},${py + ph * 0.55} ${paneX + pw / 2},${py + ph * 0.65} ${paneX + pw / 2 + 5},${py + ph * 0.55}`}
            fill={frameColor}
            stroke="none"
          />
        </g>
      );
    }

    return (
      <g stroke={frameColor} strokeWidth={1.5} opacity={0.7}>
        <line x1={x1} y1={y1} x2={x2} y2={y2} />
      </g>
    );
  }

  function renderHandle(paneX: number, paneW: number, side: HandleSide) {
    const hx = side === 'left' ? paneX + 10 : paneX + paneW - 10;
    const hy = paneY + paneH / 2;
    return (
      <circle
        cx={hx}
        cy={hy}
        r={6}
        fill={frameColor}
        stroke="#fff"
        strokeWidth={2}
      />
    );
  }

  return (
    <svg
      viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
      className="w-full h-full"
      aria-label="Previzualizare fereastră"
    >
      {/* Placeholder */}
      {!hasWidth && (
        <text
          x={SVG_SIZE / 2}
          y={SVG_SIZE / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#d4d4d4"
          fontSize={14}
        >
          Introduceți dimensiunile
        </text>
      )}

      <AnimatePresence>
        {hasWidth && (
          <motion.g
            key="window"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            style={{ transformOrigin: `${SVG_SIZE / 2}px ${SVG_SIZE / 2}px` }}
          >
            <AnimatePresence mode="wait">
            {/* Only width — horizontal line */}
            {!hasHeight && (
              <motion.line
                key="line"
                y1={SVG_SIZE / 2}
                y2={SVG_SIZE / 2}
                stroke={frameColor}
                strokeWidth={FRAME_SW}
                strokeLinecap="round"
                animate={{ x1: frameX, x2: frameX + svgW }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            )}

            {/* Full rectangle */}
            {hasHeight && (
              <motion.g
                key="rect"
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 1 }}
              >
                <motion.rect
                  x={frameX}
                  width={svgW}
                  fill="none"
                  stroke={frameColor}
                  strokeWidth={FRAME_SW}
                  rx={2}
                  initial={{ height: 0, y: lastValid.current.frameY + lastValid.current.svgH / 2 }}
                  animate={{ height: svgH, y: frameY }}
                  exit={{ height: 0, y: lastValid.current.frameY + lastValid.current.svgH / 2 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />

                {paneCount === 1 && (
                  <>
                    <motion.rect
                      x={frameX + glassInset}
                      width={Math.max(0, svgW - glassInset * 2)}
                      fill="rgba(186,230,253,0.25)"
                      stroke="#cbd5e1"
                      strokeWidth={1}
                      initial={{ height: 0, y: lastValid.current.paneY + lastValid.current.paneH / 2 }}
                      animate={{ height: paneH, y: paneY }}
                      exit={{ height: 0, y: lastValid.current.paneY + lastValid.current.paneH / 2 }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                    />
                    {openDirection &&
                      renderOpeningIndicator(
                        frameX + glassInset,
                        Math.max(0, svgW - glassInset * 2),
                        openDirection,
                      )}
                    {handleSide &&
                      opens &&
                      renderHandle(
                        frameX + glassInset,
                        Math.max(0, svgW - glassInset * 2),
                        handleSide,
                      )}
                  </>
                )}

                {paneCount === 2 && (
                  <>
                    <line
                      x1={dividerX}
                      y1={frameY}
                      x2={dividerX}
                      y2={frameY + svgH}
                      stroke={frameColor}
                      strokeWidth={FRAME_SW / 2}
                      style={{ transition: 'all 0.2s ease-out' }}
                    />
                    <motion.rect
                      x={frameX + glassInset}
                      width={Math.max(0, svgW / 2 - glassInset * 1.5)}
                      fill="rgba(186,230,253,0.25)"
                      stroke="#cbd5e1"
                      strokeWidth={1}
                      initial={{ height: 0, y: lastValid.current.paneY + lastValid.current.paneH / 2 }}
                      animate={{ height: paneH, y: paneY }}
                      exit={{ height: 0, y: lastValid.current.paneY + lastValid.current.paneH / 2 }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                    />
                    <motion.rect
                      x={dividerX + glassInset / 2}
                      width={Math.max(0, svgW / 2 - glassInset * 1.5)}
                      fill="rgba(186,230,253,0.25)"
                      stroke="#cbd5e1"
                      strokeWidth={1}
                      initial={{ height: 0, y: lastValid.current.paneY + lastValid.current.paneH / 2 }}
                      animate={{ height: paneH, y: paneY }}
                      exit={{ height: 0, y: lastValid.current.paneY + lastValid.current.paneH / 2 }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                    />
                    {(activePane === 'left' || activePane === 'both') &&
                      renderOpeningIndicator(
                        frameX + glassInset,
                        Math.max(0, svgW / 2 - glassInset * 1.5),
                        'left',
                      )}
                    {(activePane === 'right' || activePane === 'both') &&
                      renderOpeningIndicator(
                        dividerX + glassInset / 2,
                        Math.max(0, svgW / 2 - glassInset * 1.5),
                        'right',
                      )}
                    {handleSide && opens && (
                      <>
                        {handleSide === 'left' &&
                          renderHandle(
                            frameX + glassInset,
                            Math.max(0, svgW / 2 - glassInset * 1.5),
                            'right',
                          )}
                        {handleSide === 'right' &&
                          renderHandle(
                            dividerX + glassInset / 2,
                            Math.max(0, svgW / 2 - glassInset * 1.5),
                            'left',
                          )}
                      </>
                    )}
                  </>
                )}
              </motion.g>
            )}
            </AnimatePresence>
          </motion.g>
        )}
      </AnimatePresence>
    </svg>
  );
}

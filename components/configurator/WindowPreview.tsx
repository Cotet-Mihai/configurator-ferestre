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
import { getDimensionLimits } from '@/lib/configurator/limits';

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

  const { maxW, maxH } = getDimensionLimits(glassCount, opens, activePane);
  const pxPerCm = Math.min(INNER_MAX / maxW, INNER_MAX / maxH);

  const svgW = hasWidth ? Math.round(width! * pxPerCm) : 0;
  const svgH = hasHeight ? Math.round(height! * pxPerCm) : 0;

  const frameX = PADDING + (INNER_MAX - svgW) / 2;
  const frameY = PADDING + (INNER_MAX - svgH) / 2;

  const glassInset = FRAME_SW / 2;
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

    const dash = { strokeDasharray: '5 4' as const };

    // Triunghi deschidere — vârful la clantă
    const handleX = direction === 'left' ? paneX : paneX + pw;
    const handleY = py + ph / 2;
    const hingeX = direction === 'left' ? paneX + pw : paneX;

    if (isOscilo) {
      // Triunghi deschidere (clantă) + triunghi oscilobatant (sus-centru)
      const apexX = paneX + pw / 2;
      const apexY = py;
      return (
        <g stroke={frameColor} strokeWidth={1.5} opacity={0.85} fill="none">
          <line x1={handleX} y1={handleY} x2={hingeX} y2={py} {...dash} />
          <line x1={handleX} y1={handleY} x2={hingeX} y2={py + ph} {...dash} />
          <line x1={apexX} y1={apexY} x2={paneX} y2={py + ph} {...dash} />
          <line x1={apexX} y1={apexY} x2={paneX + pw} y2={py + ph} {...dash} />
        </g>
      );
    }

    return (
      <g stroke={frameColor} strokeWidth={1.5} opacity={0.85} fill="none">
        <line x1={handleX} y1={handleY} x2={hingeX} y2={py} {...dash} />
        <line x1={handleX} y1={handleY} x2={hingeX} y2={py + ph} {...dash} />
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
            <AnimatePresence>
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
                  fill="none"
                  stroke={frameColor}
                  strokeWidth={FRAME_SW}
                  rx={2}
                  initial={{ height: 0, y: lastValid.current.frameY + lastValid.current.svgH / 2, x: frameX, width: svgW }}
                  animate={{ height: svgH, y: frameY, x: frameX, width: svgW }}
                  exit={{ height: 0, y: lastValid.current.frameY + lastValid.current.svgH / 2, x: frameX, width: svgW }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />

                {paneCount === 1 && (
                  <>
                    <motion.rect
                      fill="rgba(186,230,253,0.25)"
                      stroke="#cbd5e1"
                      strokeWidth={1}
                      initial={{ height: 0, y: lastValid.current.paneY + lastValid.current.paneH / 2, x: frameX + glassInset, width: Math.max(0, svgW - glassInset * 2) }}
                      animate={{ height: paneH, y: paneY, x: frameX + glassInset, width: Math.max(0, svgW - glassInset * 2) }}
                      exit={{ height: 0, y: lastValid.current.paneY + lastValid.current.paneH / 2, x: frameX + glassInset, width: Math.max(0, svgW - glassInset * 2) }}
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
                    <motion.line
                      stroke={frameColor}
                      strokeWidth={FRAME_SW / 2}
                      initial={{ y1: lastValid.current.frameY + lastValid.current.svgH / 2, y2: lastValid.current.frameY + lastValid.current.svgH / 2, x1: dividerX, x2: dividerX }}
                      animate={{ y1: frameY, y2: frameY + svgH, x1: dividerX, x2: dividerX }}
                      exit={{ y1: lastValid.current.frameY + lastValid.current.svgH / 2, y2: lastValid.current.frameY + lastValid.current.svgH / 2, x1: dividerX, x2: dividerX }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                    />
                    <motion.rect
                      fill="rgba(186,230,253,0.25)"
                      stroke="#cbd5e1"
                      strokeWidth={1}
                      initial={{ height: 0, y: lastValid.current.paneY + lastValid.current.paneH / 2, x: frameX + glassInset, width: Math.max(0, svgW / 2 - glassInset * 1.5) }}
                      animate={{ height: paneH, y: paneY, x: frameX + glassInset, width: Math.max(0, svgW / 2 - glassInset * 1.5) }}
                      exit={{ height: 0, y: lastValid.current.paneY + lastValid.current.paneH / 2, x: frameX + glassInset, width: Math.max(0, svgW / 2 - glassInset * 1.5) }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                    />
                    <motion.rect
                      fill="rgba(186,230,253,0.25)"
                      stroke="#cbd5e1"
                      strokeWidth={1}
                      initial={{ height: 0, y: lastValid.current.paneY + lastValid.current.paneH / 2, x: dividerX + glassInset / 2, width: Math.max(0, svgW / 2 - glassInset * 1.5) }}
                      animate={{ height: paneH, y: paneY, x: dividerX + glassInset / 2, width: Math.max(0, svgW / 2 - glassInset * 1.5) }}
                      exit={{ height: 0, y: lastValid.current.paneY + lastValid.current.paneH / 2, x: dividerX + glassInset / 2, width: Math.max(0, svgW / 2 - glassInset * 1.5) }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                    />
                    {(activePane === 'left' || activePane === 'both') &&
                      renderOpeningIndicator(
                        frameX + glassInset,
                        Math.max(0, svgW / 2 - glassInset * 1.5),
                        activePane === 'both' ? 'right' : 'left',
                      )}
                    {(activePane === 'right' || activePane === 'both') &&
                      renderOpeningIndicator(
                        dividerX + glassInset / 2,
                        Math.max(0, svgW / 2 - glassInset * 1.5),
                        activePane === 'both' ? 'left' : 'right',
                      )}
                    {handleSide && opens && (
                      <>
                        {handleSide === 'left' &&
                          renderHandle(
                            frameX + glassInset,
                            Math.max(0, svgW / 2 - glassInset * 1.5),
                            activePane === 'both' ? 'right' : 'left',
                          )}
                        {handleSide === 'right' &&
                          renderHandle(
                            dividerX + glassInset / 2,
                            Math.max(0, svgW / 2 - glassInset * 1.5),
                            activePane === 'both' ? 'left' : 'right',
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

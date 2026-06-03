'use client';

import { useRef, useState } from 'react';
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

  const { minW, maxW, minH, maxH } = getDimensionLimits(glassCount, opens, activePane);
  const pxPerCm = Math.min(INNER_MAX / maxW, INNER_MAX / maxH);

  const widthOutOfBounds = hasWidth && (width! < minW || width! > maxW);
  const heightOutOfBounds = hasHeight && (height! < minH || height! > maxH);
  const isSpecialOrder = widthOutOfBounds || heightOutOfBounds;

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

  const [showContact, setShowContact] = useState(false);

  const paneCount = glassCount === 2 ? 2 : 1;
  const dividerX = frameX + svgW / 2;

  function renderOpeningIndicator(
    paneX: number,
    paneW: number,
    direction: OpenDirection,
    useOscilo: boolean = !!isOscilo,
  ) {
    if (!opens) return null;
    const py = paneY;
    const ph = paneH;
    const pw = paneW;

    const t = { duration: 0.4, ease: 'easeOut' } as const;
    const staticProps = { strokeWidth: 1.5, strokeDasharray: '5 4', fill: 'none', opacity: 0.85 };

    const handleX = direction === 'left' ? paneX : paneX + pw;
    const handleY = py + ph / 2;
    const hingeX = direction === 'left' ? paneX + pw : paneX;

    if (useOscilo) {
      const apexX = paneX + pw / 2;
      const apexY = py;
      return (
        <g>
          <motion.line {...staticProps} animate={{ x1: handleX, y1: handleY, x2: hingeX, y2: py, stroke: frameColor }} transition={t} />
          <motion.line {...staticProps} animate={{ x1: handleX, y1: handleY, x2: hingeX, y2: py + ph, stroke: frameColor }} transition={t} />
          <motion.line {...staticProps} animate={{ x1: apexX, y1: apexY, x2: paneX, y2: py + ph, stroke: frameColor }} transition={t} />
          <motion.line {...staticProps} animate={{ x1: apexX, y1: apexY, x2: paneX + pw, y2: py + ph, stroke: frameColor }} transition={t} />
        </g>
      );
    }

    return (
      <g>
        <motion.line {...staticProps} animate={{ x1: handleX, y1: handleY, x2: hingeX, y2: py, stroke: frameColor }} transition={t} />
        <motion.line {...staticProps} animate={{ x1: handleX, y1: handleY, x2: hingeX, y2: py + ph, stroke: frameColor }} transition={t} />
      </g>
    );
  }

  function renderHandle(paneX: number, paneW: number, side: HandleSide) {
    const hx = side === 'left' ? paneX + 10 : paneX + paneW - 10;
    const hy = paneY + paneH / 2;
    return (
      <motion.circle
        cx={hx}
        cy={hy}
        r={6}
        stroke="#fff"
        strokeWidth={2}
      />
    );
  }

  return (
    <div className="relative w-full h-full">
    <svg
      viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
      className="w-full h-full"
      aria-label="Previzualizare fereastră"
    >
      {/* Placeholder */}
      {!hasWidth && !isSpecialOrder && (
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
        {hasWidth && !isSpecialOrder && (
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
                        activePane === 'both' ? handleSide === 'left' && !!isOscilo : !!isOscilo,
                      )}
                    {(activePane === 'right' || activePane === 'both') &&
                      renderOpeningIndicator(
                        dividerX + glassInset / 2,
                        Math.max(0, svgW / 2 - glassInset * 1.5),
                        activePane === 'both' ? 'left' : 'right',
                        activePane === 'both' ? handleSide === 'right' && !!isOscilo : !!isOscilo,
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

    {/* Special order overlay */}
    {isSpecialOrder && (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-amber-400 bg-amber-50/60 p-6 text-center">
        <p className="text-sm font-medium text-amber-800 leading-snug">
          Aceasta este o comandă specială,<br />vă rugăm să ne contactați<br />pentru finalizarea ei.
        </p>
        <button
          type="button"
          onClick={() => setShowContact(true)}
          className="rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-amber-600 transition-colors"
        >
          Contactați-ne
        </button>
      </div>
    )}

    {/* Contact modal */}
    {showContact && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        onClick={() => setShowContact(false)}
      >
        <div
          className="relative w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => setShowContact(false)}
            className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-700 transition-colors text-xl leading-none"
            aria-label="Închide"
          >
            ×
          </button>
          <h3 className="text-lg font-semibold text-zinc-900 mb-1">Contactați-ne</h3>
          <p className="text-sm text-zinc-500 mb-6">Suntem disponibili pentru a vă ajuta cu această comandă specială.</p>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="text-amber-500 text-lg">📞</span>
              <div>
                <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide">Telefon</p>
                <a href="tel:+40743888887" className="text-sm font-medium text-zinc-800 hover:text-amber-600 transition-colors">+40 743 888 887</a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-amber-500 text-lg">✉️</span>
              <div>
                <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide">Email</p>
                <a href="mailto:design@tudorcraft.eu" className="text-sm font-medium text-zinc-800 hover:text-amber-600 transition-colors">design@tudorcraft.eu</a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-amber-500 text-lg">🕐</span>
              <div>
                <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide">Program</p>
                <p className="text-sm font-medium text-zinc-800">Luni–Vineri: 10:00 – 18:00</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}

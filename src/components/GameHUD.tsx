/**
 * In-Game HUD for Kolej Blanice Dormitory Horror.
 * Strict low-occlusion architecture (>85% unobstructed viewport, pointer-events: none,
 * zero backdrop-filter, tabular-nums readouts).
 */

import React from 'react';
import {
  Zap,
  Heart,
  Volume2,
  VolumeX,
  Pause,
  Radio,
  CreditCard,
  Key,
  Flame,
  BatteryCharging,
  EyeOff,
} from 'lucide-react';
import { InventoryItemId, DormInteractable, ClassmateMessage } from '../game/types';

interface GameHUDProps {
  sanity: number;
  battery: number;
  isFlashlightOn: boolean;
  isHiding: boolean;
  inventory: InventoryItemId[];
  hoverTarget: DormInteractable | null;
  examinerProximity: number;
  examinerAlert: boolean;
  activeObjective: string;
  objectiveIndex: number;
  totalObjectives: number;
  recentRadio: ClassmateMessage | null;
  isMuted: boolean;
  graceRemaining: number;
  onToggleMute: () => void;
  onPause: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  sanity,
  battery,
  isFlashlightOn,
  isHiding,
  inventory,
  hoverTarget,
  examinerProximity,
  examinerAlert,
  activeObjective,
  objectiveIndex,
  totalObjectives,
  recentRadio,
  isMuted,
  graceRemaining,
  onToggleMute,
  onPause,
}) => {
  // Calculated heartbeat BPM
  const bpm = Math.round(75 + (100 - sanity) * 0.95 + (examinerAlert ? 35 : 0));
  const isSanityLow = sanity < 35;
  const isBatteryLow = battery < 20;
  const isGraceActive = graceRemaining > 0;
  const graceMinutes = Math.floor(graceRemaining / 60);
  const graceSeconds = graceRemaining % 60;

  return (
    <div className="fixed inset-0 z-30 pointer-events-none select-none font-sans text-neutral-100 flex flex-col justify-between p-4 sm:p-6">
      {/* Horror Vignette when in terror or danger */}
      <div
        className={`fixed inset-0 pointer-events-none transition-opacity duration-300 ${
          isSanityLow || examinerAlert ? 'opacity-80' : 'opacity-20'
        }`}
        style={{
          boxShadow: isSanityLow || examinerAlert
            ? 'inset 0 0 100px 30px rgba(185, 28, 28, 0.45)'
            : 'inset 0 0 80px 20px rgba(0, 0, 0, 0.7)',
        }}
      />

      {/* Hiding Indicator Banner */}
      {isHiding && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-neutral-900/90 border border-amber-600/70 px-4 py-2 rounded text-amber-400 text-xs sm:text-sm font-mono flex items-center gap-2 shadow-lg">
          <EyeOff className="w-4 h-4 animate-pulse" />
          <span>UKRYT VE ŠTÁTNÍ SKŘÍNI · ZKOUŠEJÍCÍ TĚ NEVIDÍ · STISKNI [E] PRO VÝSTUP</span>
        </div>
      )}

      {/* TOP ROW: Vitality & Utility */}
      <div className="flex justify-between items-start w-full">
        {/* Top-Left: Flashlight Battery & Sanity / Heart Rate */}
        <div className="flex flex-col gap-2.5">
          {/* Flashlight Battery Card */}
          <div className="flex items-center gap-3 bg-neutral-950/85 border border-neutral-800/90 px-3.5 py-2 rounded-sm shadow-md">
            <div className={`p-1.5 rounded ${isFlashlightOn ? 'text-amber-400 bg-amber-950/40' : 'text-neutral-500 bg-neutral-900'}`}>
              <BatteryCharging className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">Svítilna [F]</span>
                <span className={`text-xs font-mono font-bold tabular-nums ${isBatteryLow ? 'text-red-400' : 'text-neutral-200'}`}>
                  {Math.round(battery)}%
                </span>
              </div>
              {/* Battery segmented progress bar */}
              <div className="w-24 sm:w-28 h-1.5 bg-neutral-800 rounded-xs overflow-hidden mt-1 flex gap-0.5">
                {[0, 25, 50, 75].map((threshold) => (
                  <div
                    key={threshold}
                    className={`h-full flex-1 transition-all ${
                      battery > threshold
                        ? isBatteryLow
                          ? 'bg-red-500'
                          : 'bg-amber-400'
                        : 'bg-neutral-800'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Sanity / Heart Rate Card */}
          <div className="flex items-center gap-3 bg-neutral-950/85 border border-neutral-800/90 px-3.5 py-2 rounded-sm shadow-md">
            <div className={`p-1.5 rounded ${isSanityLow ? 'text-red-400 bg-red-950/40 animate-pulse' : 'text-rose-400 bg-neutral-900'}`}>
              <Heart className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">Tep / Příčetnost</span>
                <span className={`text-xs font-mono font-bold tabular-nums ${isSanityLow ? 'text-red-400' : 'text-neutral-200'}`}>
                  {bpm} BPM
                </span>
              </div>
              <div className="w-24 sm:w-28 h-1.5 bg-neutral-800 rounded-xs overflow-hidden mt-1">
                <div
                  className={`h-full transition-all duration-300 ${
                    isSanityLow ? 'bg-red-500' : sanity < 60 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.round(sanity)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Top-Center: 5-minute Safe Exploration Timer */}
        <div className="flex flex-col items-center">
          {isGraceActive ? (
            <div className="bg-emerald-950/90 border border-emerald-500/60 px-3.5 py-1.5 rounded shadow-md flex items-center gap-2 text-xs font-mono text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>BEZPEČNÝ ČAS:</span>
              <strong className="text-white text-sm font-bold tabular-nums">
                {String(graceMinutes).padStart(2, '0')}:{String(graceSeconds).padStart(2, '0')}
              </strong>
              <span className="text-[10px] text-emerald-400/80 hidden md:inline">· Profesor z NF ještě nezkouší</span>
            </div>
          ) : (
            <div className="bg-red-950/90 border border-red-600/80 px-3.5 py-1.5 rounded shadow-md flex items-center gap-2 text-xs font-mono text-red-300 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>ZKOUŠENÍ ZAHÁJENO!</span>
              <span className="text-[10px] text-red-400 hidden md:inline">· Profesor z NF obchází chodby!</span>
            </div>
          )}
        </div>

        {/* Top-Right: Proximity Threat & Utility Controls */}
        <div className="flex items-center gap-2">
          {/* Threat Meter when Professor NF is near */}
          {!isGraceActive && examinerProximity > 0.1 && (
            <div className="hidden sm:flex items-center gap-2 bg-neutral-950/90 border border-red-900/70 px-3 py-1.5 rounded text-xs font-mono text-red-400 shadow-lg">
              <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>PROFESOR Z NF JE BLÍZKO</span>
            </div>
          )}

          <button
            onClick={onToggleMute}
            className="pointer-events-auto p-2 bg-neutral-950/90 border border-neutral-800 hover:border-neutral-600 rounded text-neutral-300 transition cursor-pointer"
            title="Přepnout zvuk (M)"
            aria-label="Zvuk"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-neutral-200" />}
          </button>

          <button
            onClick={onPause}
            className="pointer-events-auto p-2 bg-neutral-950/90 border border-neutral-800 hover:border-neutral-600 rounded text-neutral-300 transition cursor-pointer"
            title="Pauza (Esc / P)"
            aria-label="Pauza"
          >
            <Pause className="w-4 h-4 text-neutral-200" />
          </button>
        </div>
      </div>

      {/* CENTER VIEWPORT: Reticle & Contextual Interaction Prompt */}
      <div className="my-auto flex flex-col items-center justify-center text-center">
        {/* Subtle center crosshair dot */}
        <div className="w-1.5 h-1.5 rounded-full bg-white/70 shadow-[0_0_4px_rgba(255,255,255,0.8)]" />

        {/* Contextual Interaction Pill */}
        {hoverTarget && (
          <div className="mt-4 bg-neutral-950/90 border border-amber-500/80 px-4 py-2 rounded shadow-2xl flex items-center gap-2.5 max-w-md animate-in fade-in zoom-in-95 duration-150">
            <div className="w-6 h-6 rounded bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-mono font-bold text-xs text-amber-400">
              E
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-white tracking-wide">{hoverTarget.name}</span>
              <span className="text-[11px] text-neutral-400 font-mono">{hoverTarget.prompt}</span>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM ROW: Objectives & Inventory & Radio Comms */}
      <div className="flex flex-col sm:flex-row justify-between items-end w-full gap-4">
        {/* Bottom-Left: Objectives */}
        <div className="bg-neutral-950/90 border border-neutral-800/90 p-3 rounded-sm shadow-md max-w-sm w-full">
          <div className="flex items-center justify-between text-[10px] uppercase font-mono tracking-wider text-neutral-400 mb-1">
            <span>Úkol ({objectiveIndex}/{totalObjectives})</span>
            <span className="text-amber-500 font-bold">Zkouškové 2026</span>
          </div>
          <p className="text-xs font-semibold text-neutral-100 leading-snug">
            {activeObjective}
          </p>
        </div>

        {/* Bottom-Center: Walkie-Talkie Classmate Radio Ticker */}
        {recentRadio && (
          <div className="bg-neutral-950/90 border border-cyan-900/60 p-2.5 rounded-sm shadow-md max-w-md w-full flex items-start gap-2.5">
            <Radio className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-400">
                <span className="font-bold">{recentRadio.sender}</span>
                <span className="text-neutral-500">[{recentRadio.room}]</span>
                <span className="text-neutral-500">{recentRadio.timestamp}</span>
              </div>
              <p className="text-xs text-neutral-200 leading-tight mt-0.5 font-sans">
                "{recentRadio.text}"
              </p>
            </div>
          </div>
        )}

        {/* Bottom-Right: Inventory Slots */}
        <div className="flex flex-col items-end gap-1.5">
          <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">Inventář</span>
          <div className="flex items-center gap-2">
            {/* Slot 1: ISIC Card */}
            <div
              className={`w-11 h-11 rounded border flex items-center justify-center relative transition ${
                inventory.includes('ISIC_CARD')
                  ? 'bg-blue-950/60 border-blue-500/80 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                  : 'bg-neutral-950/60 border-neutral-800 text-neutral-600'
              }`}
              title="ISIC Karta VŠE"
            >
              <CreditCard className="w-5 h-5" />
              {inventory.includes('ISIC_CARD') && (
                <span className="absolute bottom-0.5 right-1 text-[8px] font-mono font-bold text-blue-300">VŠE</span>
              )}
            </div>

            {/* Slot 2: Study Room Key */}
            <div
              className={`w-11 h-11 rounded border flex items-center justify-center relative transition ${
                inventory.includes('STUDY_KEY')
                  ? 'bg-amber-950/60 border-amber-500/80 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                  : 'bg-neutral-950/60 border-neutral-800 text-neutral-600'
              }`}
              title="Klíč od studovny"
            >
              <Key className="w-5 h-5" />
            </div>

            {/* Slot 3: Master Fuse 380V */}
            <div
              className={`w-11 h-11 rounded border flex items-center justify-center relative transition ${
                inventory.includes('MASTER_FUSE')
                  ? 'bg-red-950/60 border-red-500/80 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                  : 'bg-neutral-950/60 border-neutral-800 text-neutral-600'
              }`}
              title="Pojistka 380V"
            >
              <Zap className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Interactive Modals for Kolej Blanice Dormitory Horror:
 * - InSIS Terminal PIN verification modal
 * - High-detail Noticeboard inspection modal
 * - Pause, Victory, and Game Over modals with tabular metrics
 */

import React, { useState } from 'react';
import {
  X,
  Lock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Play,
  FileText,
  Award,
  Zap,
} from 'lucide-react';
import { validateInSisExamCode, INSIS_ACCESS_CODE } from '../game/rules';

interface InSisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isAlreadyUnlocked: boolean;
}

export const InSisModal: React.FC<InSisModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isAlreadyUnlocked,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(isAlreadyUnlocked);

  if (!isOpen) return null;

  const handleDigit = (d: string) => {
    if (pin.length < 4) {
      setPin((prev) => prev + d);
      setError(null);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (validateInSisExamCode(pin)) {
      setUnlocked(true);
      setError(null);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } else {
      setError('CHYBNÝ KÓD: Zkontrolujte nástěnku na chodbě (Mikroekonomie I)!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 font-mono select-none">
      <div className="w-full max-w-lg bg-neutral-900 border-2 border-emerald-600 rounded shadow-2xl p-6 text-neutral-100 flex flex-col gap-4 animate-in zoom-in-95 duration-150">
        {/* Terminal Header */}
        <div className="flex justify-between items-center border-b border-emerald-800 pb-3">
          <div className="flex items-center gap-2 text-emerald-400">
            <Lock className="w-5 h-5" />
            <span className="font-bold text-sm tracking-wider">InSIS VŠE · ZKOUŠKOVÝ TERMINÁL</span>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition p-1"
            aria-label="Zavřít"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Terminal Screen Body */}
        <div className="bg-black/90 p-4 rounded border border-emerald-900 flex flex-col gap-3">
          <div className="text-xs text-emerald-500/80 leading-relaxed">
            [SYS_OK] SPOJENÍ S DATABÁZÍ VŠE AKTIVNÍ<br />
            [INFO] PŘEDMĚT: 1EK211 MIKROEKONOMIE I<br />
            [TREZOR] ZADEJTE 4-MÍSTNÝ KÓD PRO UVOLNĚNÍ HLAVNÍ POJISTKY 380V:
          </div>

          {/* PIN Display */}
          <div className="flex items-center justify-center h-14 bg-neutral-950 border border-emerald-600/70 rounded text-2xl tracking-[0.5em] text-emerald-400 font-bold">
            {unlocked ? (
              <span className="text-emerald-400 flex items-center gap-2 text-lg tracking-normal">
                <CheckCircle2 className="w-5 h-5" /> PŘÍSTUP POVOLEN · POJISTKA UVOLNĚNA!
              </span>
            ) : (
              pin.padEnd(4, '·')
            )}
          </div>

          {error && (
            <div className="text-xs text-red-400 flex items-center gap-1.5 bg-red-950/40 p-2 rounded border border-red-800">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Clue Hint */}
          <div className="text-[11px] text-neutral-400 italic">
            Nápověda: Kód souvisí s předmětem Mikroekonomie I na nástěnce v chodbě (kód 5214).
          </div>
        </div>

        {/* Numeric Keypad */}
        {!unlocked && (
          <div className="grid grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                onClick={() => handleDigit(digit)}
                className="py-3 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 rounded text-lg font-bold text-neutral-200 border border-neutral-700 transition"
              >
                {digit}
              </button>
            ))}
            <button
              onClick={handleBackspace}
              className="py-3 bg-neutral-800 hover:bg-neutral-700 rounded text-xs font-bold text-amber-400 border border-neutral-700"
            >
              SMAZAT
            </button>
            <button
              onClick={() => handleDigit('0')}
              className="py-3 bg-neutral-800 hover:bg-neutral-700 rounded text-lg font-bold text-neutral-200 border border-neutral-700"
            >
              0
            </button>
            <button
              onClick={() => handleSubmit()}
              className="py-3 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-500 rounded text-xs font-bold text-white border border-emerald-500 transition"
            >
              POTVRDIT
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

interface NoticeboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NoticeboardModal: React.FC<NoticeboardModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 font-sans select-none">
      <div className="w-full max-w-2xl bg-neutral-900 border border-amber-600/70 rounded-lg shadow-2xl p-6 text-neutral-100 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold tracking-wide">Nástěnka VŠE — Kolej Blanice, Blok B</h2>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition p-1" aria-label="Zavřít">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Note 1: Exam Schedule & PIN Code */}
          <div className="bg-amber-50 text-neutral-900 p-4 rounded shadow relative border-t-4 border-blue-900">
            <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-red-600"></div>
            <h3 className="font-bold text-sm text-blue-900 uppercase">Vysoká škola ekonomická v Praze</h3>
            <p className="text-xs text-neutral-700 font-semibold mt-1">Harmonogram Zkoušek — ZS 2026</p>
            <div className="my-2 border-b border-neutral-300" />
            <p className="text-xs text-neutral-800 leading-relaxed">
              Zkouškové období: 2.1. až 7.2.<br />
              Přihlašování na termíny probíhá výhradně přes InSIS.<br />
              Studenti bez platné <strong>ISIC karty</strong> nebudou vpuštěni do budovy ani ke zkoušce.
            </p>
            <div className="mt-3 p-2 bg-blue-100 rounded border border-blue-300 text-xs font-mono font-bold text-blue-900">
              KÓD K POJISTCE VE STUDOVNĚ: 5214<br />
              (Odvozeno: MR = MC, 5 kreditů, termín 214)
            </div>
          </div>

          {/* Note 2: Lost & Found ISIC */}
          <div className="bg-yellow-100 text-neutral-900 p-4 rounded shadow relative border-t-4 border-amber-600">
            <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-blue-600"></div>
            <h3 className="font-bold text-sm text-amber-900 uppercase">ZTRÁTY A NÁLEZY</h3>
            <div className="my-2 border-b border-neutral-300" />
            <p className="text-xs text-neutral-800 leading-relaxed">
              Dnes odpoledne jsem zapomněl <strong>ISIC kartu</strong> na pračce v <strong>prádelně</strong> při praní povlečení.
            </p>
            <p className="text-xs text-neutral-800 mt-2 font-semibold">
              Klíč od studovny nechala spolubydlící ve <strong>společné kuchyňce v červené konvici</strong>!
            </p>
          </div>
        </div>

        {/* Note 3: Dormitory Rules */}
        <div className="bg-neutral-800/90 p-4 rounded border border-neutral-700 text-xs leading-relaxed text-neutral-300">
          <strong className="text-amber-400 block mb-1">Důležité upozornění Správy kolejí:</strong>
          Při nočním výpadku proudu jsou elektronické zámky únikového východu zablokovány, dokud nebude do hlavní rozvodny (skříň 380V na konci chodby) vložena nová patronová pojistka ze studovny.
        </div>

        <button
          onClick={onClose}
          className="mt-2 w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs rounded border border-neutral-600 transition"
        >
          Zavřít nástěnku
        </button>
      </div>
    </div>
  );
};

interface PauseModalProps {
  isOpen: boolean;
  onResume: () => void;
  onRestart: () => void;
  onTitle: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({ isOpen, onResume, onRestart, onTitle }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 font-sans select-none">
      <div className="w-full max-w-sm bg-neutral-950 border border-neutral-800 rounded p-6 text-center text-neutral-100 flex flex-col gap-4 shadow-2xl">
        <h2 className="text-xl font-bold tracking-wider text-amber-500 uppercase">HRA POZASTAVENA</h2>
        <p className="text-xs text-neutral-400 font-mono">Kolej Blanice — Zkouškové období</p>

        <div className="flex flex-col gap-2.5 mt-2">
          <button
            onClick={onResume}
            className="w-full py-3 bg-red-700 hover:bg-red-600 rounded font-bold text-sm tracking-wide text-white transition flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" /> Pokračovat v průzkumu
          </button>
          <button
            onClick={onRestart}
            className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded text-sm text-neutral-200 transition flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Restartovat zkoušku
          </button>
          <button
            onClick={onTitle}
            className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded text-sm text-neutral-200 transition"
          >
            Hlavní menu
          </button>
        </div>

        <div className="mt-4 pt-3 border-t border-neutral-800 text-[11px] text-neutral-400 font-mono">
          WASD Chůze (A = vlevo, D = vpravo) · Šipky Otáčení kamery · F Baterka · E Akce · Shift Běh
        </div>
      </div>
    </div>
  );
};

interface VictoryModalProps {
  isOpen: boolean;
  timeElapsed: number;
  remainingSanity: number;
  onRestart: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  timeElapsed,
  remainingSanity,
  onRestart,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 font-sans select-none">
      <div className="w-full max-w-md bg-neutral-950 border-2 border-emerald-500/80 rounded p-6 text-center text-neutral-100 flex flex-col items-center gap-4 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="w-14 h-14 rounded-full bg-emerald-950/80 border-2 border-emerald-500 flex items-center justify-center text-emerald-400">
          <Award className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-extrabold tracking-tight text-white uppercase">
          ÚNIK DOKONČEN!
        </h2>
        <p className="text-xs text-emerald-400 font-mono tracking-widest uppercase font-bold">
          ZKOUŠKOVÝ TERMÍN SPLNĚN · ZÁPOČET ZÍSKÁN
        </p>

        <p className="text-xs text-neutral-300 leading-relaxed">
          S platnou ISIC kartou a obnoveným 380V napájením jsi odemkl nouzový únikový východ a unikl z temných chodeb Koleje Blanice!
        </p>

        {/* Results grid */}
        <div className="grid grid-cols-2 gap-3 w-full bg-neutral-900 p-3 rounded border border-neutral-800 text-left font-mono">
          <div>
            <span className="text-[10px] text-neutral-400 uppercase">Čas přežití</span>
            <p className="text-sm font-bold text-white tabular-nums">
              {Math.floor(timeElapsed / 60)}m {Math.round(timeElapsed % 60)}s
            </p>
          </div>
          <div>
            <span className="text-[10px] text-neutral-400 uppercase">Zbývající příčetnost</span>
            <p className="text-sm font-bold text-emerald-400 tabular-nums">
              {Math.round(remainingSanity)}%
            </p>
          </div>
          <div>
            <span className="text-[10px] text-neutral-400 uppercase">VŠE Kredity</span>
            <p className="text-sm font-bold text-amber-400">30 ECTS</p>
          </div>
          <div>
            <span className="text-[10px] text-neutral-400 uppercase">Akademická známka</span>
            <p className="text-sm font-bold text-emerald-400">Výborně (A)</p>
          </div>
        </div>

        <button
          data-start="true"
          onClick={onRestart}
          className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-600 active:scale-[0.98] text-white font-bold tracking-wider uppercase text-sm rounded transition cursor-pointer"
        >
          Hrát znovu / Play Again
        </button>
      </div>
    </div>
  );
};

interface GameOverModalProps {
  isOpen: boolean;
  reason: string;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ isOpen, reason, onRestart }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 font-sans select-none">
      <div className="w-full max-w-md bg-neutral-950 border-2 border-red-700 rounded p-6 text-center text-neutral-100 flex flex-col items-center gap-4 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="w-14 h-14 rounded-full bg-red-950/80 border-2 border-red-600 flex items-center justify-center text-red-500">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-extrabold tracking-tight text-red-500 uppercase">
          ZKOUŠKA NESLOŽENA (F)
        </h2>
        <p className="text-xs text-neutral-400 font-mono tracking-widest uppercase font-bold">
          Národohospodářská fakulta VŠE — Termín vypršel
        </p>

        <p className="text-xs text-neutral-300 leading-relaxed bg-red-950/30 p-3 rounded border border-red-900/60 w-full">
          {reason}
        </p>

        <div className="text-[11px] text-neutral-400 italic">
          Tip: Profesor z Národohospodářské fakulty (NF VŠE) vám dává 5 minut klidového času na vyřešení zápočtu. Po zahájení zkoušení zhasněte baterku [F] nebo se schovejte do skříně v buňce 312A.
        </div>

        <button
          data-start="true"
          onClick={onRestart}
          className="w-full py-3.5 bg-red-700 hover:bg-red-600 active:scale-[0.98] text-white font-bold tracking-wider uppercase text-sm rounded transition cursor-pointer flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" /> Zkusit znovu / Retry Exam
        </button>
      </div>
    </div>
  );
};

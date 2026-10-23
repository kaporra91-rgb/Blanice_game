/**
 * Interactive Czech Dialogue Modal for Kolej Blanice.
 * Handles conversations with Paní Kropáčková (Kolejbába) and Czech-Slovak students.
 */

import React from 'react';
import { MessageSquare, User, X } from 'lucide-react';
import { DialogueNode, DialogueChoice } from '../game/types';

interface DialogueModalProps {
  currentNode: DialogueNode | null;
  onSelectChoice: (choice: DialogueChoice) => void;
  onClose: () => void;
}

export const DialogueModal: React.FC<DialogueModalProps> = ({
  currentNode,
  onSelectChoice,
  onClose,
}) => {
  if (!currentNode) return null;

  const isKolejbaba = currentNode.speaker.includes('Kropáčková');

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6 bg-black/75 font-sans select-none animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-neutral-950 border-2 border-amber-600/80 rounded-lg shadow-2xl p-5 sm:p-6 text-neutral-100 flex flex-col gap-4">
        {/* Header: Speaker info */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center border-2 ${
                isKolejbaba
                  ? 'bg-red-950/80 border-red-500 text-red-300'
                  : 'bg-blue-950/80 border-blue-500 text-blue-300'
              }`}
            >
              <User className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-white tracking-wide">
                {currentNode.speaker}
              </span>
              <span className="text-xs text-amber-400 font-mono tracking-wider uppercase">
                {currentNode.role}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white transition rounded hover:bg-neutral-800"
            aria-label="Ukončit rozhovor"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dialogue Speech Bubble */}
        <div className="bg-neutral-900/90 p-4 rounded-md border border-neutral-800 text-sm sm:text-base leading-relaxed text-neutral-200 whitespace-pre-line font-medium min-h-[70px] flex items-center">
          "{currentNode.text}"
        </div>

        {/* Choices List */}
        <div className="flex flex-col gap-2 pt-2">
          <span className="text-[11px] text-neutral-400 font-mono uppercase tracking-wider">
            Vyberte odpověď:
          </span>
          {currentNode.choices.map((choice, index) => (
            <button
              key={index}
              onClick={() => onSelectChoice(choice)}
              className="text-left px-4 py-3 bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-700 rounded border border-neutral-700/80 hover:border-amber-500 text-xs sm:text-sm text-neutral-200 hover:text-amber-300 transition-all flex items-start gap-3 cursor-pointer group"
            >
              <span className="w-5 h-5 rounded bg-neutral-800 group-hover:bg-amber-500/20 text-neutral-400 group-hover:text-amber-400 font-mono text-xs flex items-center justify-center font-bold shrink-0 mt-0.5 border border-neutral-700 group-hover:border-amber-500/50">
                {index + 1}
              </span>
              <span className="leading-snug">{choice.text}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

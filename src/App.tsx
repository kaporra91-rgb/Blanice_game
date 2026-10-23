/**
 * Main Application Component for Kolej Blanice: VŠE Dormitory Horror.
 * Manages game state machine, isolated Three.js canvas mount,
 * outside spawn, ground floor facilities, dialogue interactions,
 * elevator ride, objective progression, and modal dialogs.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { DormitoryEngine } from './game/engine';
import { TitleScreen } from './components/TitleScreen';
import { GameHUD } from './components/GameHUD';
import { DialogueModal } from './components/DialogueModal';
import {
  InSisModal,
  NoticeboardModal,
  PauseModal,
  VictoryModal,
  GameOverModal,
} from './components/Modals';
import { soundEngine } from './audio/soundEngine';
import { multiplayerNet } from './game/multiplayer';
import { DIALOGUES } from './game/dialogues';
import {
  GameState,
  InventoryItemId,
  DormInteractable,
  ClassmateMessage,
  DialogueNode,
  DialogueChoice,
} from './game/types';
import { canUnlockDoor } from './game/rules';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<DormitoryEngine | null>(null);

  // Game state
  const [gameState, setGameState] = useState<GameState>('title');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [sanity, setSanity] = useState<number>(100);
  const [battery, setBattery] = useState<number>(95);
  const [isFlashlightOn, setIsFlashlightOn] = useState<boolean>(true);
  const [isHiding, setIsHiding] = useState<boolean>(false);
  const [inventory, setInventory] = useState<InventoryItemId[]>([]);
  const [hoverTarget, setHoverTarget] = useState<DormInteractable | null>(null);
  const [examinerProximity, setExaminerProximity] = useState<number>(0);
  const [examinerAlert, setExaminerAlert] = useState<boolean>(false);

  // Czech Objectives Progression
  const objectives = [
    'Vstup prosklenými dveřmi na kolej a vyřiď si příchod na vrátnici (kolejbába)',
    'Pokecaj se spolužáky Honzou a Maťem, prohlédni si menzu, posilku a bazén',
    'Přilož čip u výtahu a vyjeď do 3. patra',
    'Najdi ISIC kartu, kód k InSISu (5214), nahlas pojistku a uteč únikovým východem',
  ];
  const [objectiveIndex, setObjectiveIndex] = useState<number>(1);

  // Modals & Dialogue State
  const [currentDialogueNode, setCurrentDialogueNode] = useState<DialogueNode | null>(null);
  const [notificationToast, setNotificationToast] = useState<string>('');
  const [isInSisOpen, setIsInSisOpen] = useState<boolean>(false);
  const [isNoticeboardOpen, setIsNoticeboardOpen] = useState<boolean>(false);
  const [isPauseOpen, setIsPauseOpen] = useState<boolean>(false);
  const [isVictoryOpen, setIsVictoryOpen] = useState<boolean>(false);
  const [isGameOverOpen, setIsGameOverOpen] = useState<boolean>(false);
  const [gameOverReason, setGameOverReason] = useState<string>('');

  // Stats & Multiplayer
  const [timeElapsed, setTimeElapsed] = useState<number>(0);
  const [graceRemaining, setGraceRemaining] = useState<number>(300);
  const [peerCount, setPeerCount] = useState<number>(0);
  const [recentRadio, setRecentRadio] = useState<ClassmateMessage | null>(null);
  const [fuseInstalled, setFuseInstalled] = useState<boolean>(false);

  // Sync state to body attribute for test inspection
  useEffect(() => {
    document.body.dataset.state = gameState;
  }, [gameState]);

  // Handle Toast notification
  const showToast = useCallback((msg: string) => {
    setNotificationToast(msg);
    window.setTimeout(() => setNotificationToast(''), 4000);
  }, []);

  // Initialize Three.js Engine once on mount
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const engine = new DormitoryEngine(canvasMountRef.current, {
      onHoverInteractable: (target) => {
        setHoverTarget(target);
      },
      onStatsUpdate: (curSanity, curBattery, flashOn, hiding, elapsed, remainingGrace) => {
        setSanity(curSanity);
        setBattery(curBattery);
        setIsFlashlightOn(flashOn);
        setIsHiding(hiding);
        setGraceRemaining(remainingGrace);
      },
      onExaminerAlert: (proximity, alert) => {
        setExaminerProximity(proximity);
        setExaminerAlert(alert);
      },
      onGameOver: (reason) => {
        setGameOverReason(reason);
        setGameState('gameover');
        setIsGameOverOpen(true);
      },
      onVictory: () => {
        setGameState('victory');
        setIsVictoryOpen(true);
      },
      onOpenTerminal: () => {
        setIsInSisOpen(true);
      },
      onOpenNoticeboard: () => {
        setIsNoticeboardOpen(true);
      },
      onOpenDialogue: (dialogueId) => {
        if (DIALOGUES[dialogueId]) {
          setCurrentDialogueNode(DIALOGUES[dialogueId]);
          soundEngine.playDialogueBlip();
        }
      },
      onUseElevator: () => {
        const unlock = canUnlockDoor('elevator_call', inventory);
        if (unlock.allowed) {
          engineRef.current?.rideElevatorToFloor('dorm_floor');
          setObjectiveIndex(4);
          showToast('Výtah stoupá do 3. patra... Vítej ve zkouškovém pekle!');
        } else {
          showToast(unlock.reason || 'K přivolání výtahu potřebuješ čip od paní vrátné!');
        }
      },
      onNotification: (msg) => {
        showToast(msg);
      },
    });

    engineRef.current = engine;

    // Listen to multiplayer updates
    multiplayerNet.onPeersUpdated((peers) => {
      setPeerCount(peers.length);
    });

    multiplayerNet.onMessage((msg) => {
      setRecentRadio(msg);
      soundEngine.playRadioStatic();
    });

    // Check for autostart URL parameter (?autostart=1)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('autostart') === '1') {
      soundEngine.init();
      engine.gameState = 'playing';
      engine.position.set(0, 1.65, -34.0);
      engine.yaw = Math.PI;
      engine.pitch = 0;
      setGameState('playing');
    }

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [inventory, showToast]);

  // Time tracker when in playing state
  useEffect(() => {
    if (gameState !== 'playing') return;
    const timer = window.setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState]);

  // Handle Global Start Game: starts outside plaza facing South towards glass doors
  const handleStartGame = useCallback(() => {
    soundEngine.init();
    if (engineRef.current) {
      engineRef.current.position.set(0, 1.65, -34.0);
      engineRef.current.yaw = Math.PI; // Face South (+Z) towards the glass doors
      engineRef.current.pitch = 0;
      engineRef.current.gameState = 'playing';
    }
    setGameState('playing');
  }, []);

  // Keyboard shortcut listener for Enter / Space on Title Screen, Escape for Pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === 'title' && (e.code === 'Enter' || e.code === 'Space')) {
        e.preventDefault();
        handleStartGame();
      } else if (e.code === 'Escape' || e.code === 'KeyP') {
        if (gameState === 'playing') {
          if (currentDialogueNode) setCurrentDialogueNode(null);
          else if (isInSisOpen) setIsInSisOpen(false);
          else if (isNoticeboardOpen) setIsNoticeboardOpen(false);
          else {
            setGameState('paused');
            setIsPauseOpen(true);
          }
        } else if (gameState === 'paused') {
          setIsPauseOpen(false);
          setGameState('playing');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handleStartGame, isInSisOpen, isNoticeboardOpen, currentDialogueNode]);

  // Handle Dialogue Choices
  const handleSelectDialogueChoice = useCallback((choice: DialogueChoice) => {
    soundEngine.playDialogueBlip();

    if (choice.action === 'get_elevator_chip') {
      if (!inventory.includes('ELEVATOR_CHIP')) {
        setInventory((prev) => [...prev, 'ELEVATOR_CHIP']);
        soundEngine.playPickup();
        if (objectiveIndex <= 1) setObjectiveIndex(2);
        showToast('Získal jsi ELEVATOR_CHIP od paní vrátné Kropáčkové!');
      }
    } else if (choice.action === 'joke_reaction') {
      soundEngine.playPickup();
      showToast('Kluci se zasmáli: "Čučoriedka je zelená, lebo je ešte nezrelá!"');
    }

    if (choice.nextNodeId === 'close' || !DIALOGUES[choice.nextNodeId]) {
      setCurrentDialogueNode(null);
    } else {
      setCurrentDialogueNode(DIALOGUES[choice.nextNodeId]);
    }
  }, [inventory, objectiveIndex, showToast]);

  // Handle Item pickup and interaction events triggered by player
  const handleInteraction = useCallback(() => {
    if (!hoverTarget) return;

    if (hoverTarget.type === 'dialogue') {
      if (hoverTarget.id === 'dialogue_kolejbaba') {
        setCurrentDialogueNode(DIALOGUES.kolejbaba_start);
      } else if (hoverTarget.id === 'dialogue_students') {
        setCurrentDialogueNode(DIALOGUES.students_start);
      }
      soundEngine.playDialogueBlip();
    } else if (hoverTarget.type === 'elevator') {
      const unlock = canUnlockDoor('elevator_call', inventory);
      if (unlock.allowed) {
        engineRef.current?.rideElevatorToFloor('dorm_floor');
        setObjectiveIndex(4);
        showToast('Výtah stoupá do 3. patra... [Noční režim VŠE]');
      } else {
        showToast(unlock.reason || 'K přivolání výtahu potřebuješ čip od paní vrátné!');
      }
    } else if (hoverTarget.id === 'door_glass_entrance') {
      soundEngine.playGlassDoorOpen();
      if (engineRef.current && engineRef.current.position.z < -23.0) {
        engineRef.current.position.z = -22.5;
        showToast('Vstoupil jsi do budovy Koleje Blanice.');
      }
    } else if (hoverTarget.type === 'pickup' && hoverTarget.data?.itemId) {
      const itemId = hoverTarget.data.itemId as InventoryItemId;
      setInventory((prev) => [...prev, itemId]);

      if (itemId === 'BATTERY_9V') {
        engineRef.current?.rechargeBattery();
        showToast('Sebral jsi 9V baterii. Svítilna je plně nabita!');
      } else if (itemId === 'ISIC_CARD') {
        showToast('Získal jsi ISIC kartu VŠE! Přístup k únikovému východu odemčen.');
      } else if (itemId === 'STUDY_KEY') {
        showToast('Sebral jsi mosazný klíč od studovny VŠE.');
      }
    } else if (hoverTarget.type === 'fusebox') {
      if (inventory.includes('MASTER_FUSE')) {
        setFuseInstalled(true);
        soundEngine.playLightFlicker();
        showToast('380V pojistka zapojena! Napájení únikového východu obnoveno!');
        multiplayerNet.broadcastRadio('Pojistka 380V je v rozvodně! Napájení únikového východu obnoveno!');
      } else {
        showToast('V rozvodné skříni chybí hlavní 380V pojistka ze studovny!');
      }
    } else if (hoverTarget.type === 'door') {
      if (hoverTarget.id === 'door_fire_exit') {
        const unlock = canUnlockDoor('door_fire_exit', inventory);
        if (unlock.allowed && fuseInstalled) {
          // ESCAPED!
          soundEngine.playElevatorChime();
          setGameState('victory');
          setIsVictoryOpen(true);
        } else {
          showToast(unlock.reason || 'Únikový východ vyžaduje ISIC kartu a nahozenou 380V pojistku!');
        }
      }
    }
  }, [hoverTarget, inventory, fuseInstalled, showToast]);

  // Listen to 'E' key for interaction handling in React layer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyE' && gameState === 'playing' && !currentDialogueNode) {
        handleInteraction();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handleInteraction, currentDialogueNode]);

  // Audio Toggle
  const handleToggleMute = () => {
    soundEngine.init();
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  // Restart / Reset
  const handleRestart = () => {
    window.location.href = window.location.pathname + '?autostart=1';
  };

  const handleReturnToTitle = () => {
    window.location.href = window.location.pathname;
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* 1. Dedicated Isolated Three.js Canvas Mount */}
      <div
        ref={canvasMountRef}
        data-testid="threejs-dormitory-canvas"
        className="absolute inset-0 w-full h-full cursor-crosshair"
      />

      {/* 2. Notification Toast Banner */}
      {notificationToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-6 py-2.5 bg-neutral-900/95 border-2 border-amber-500 text-amber-200 text-xs sm:text-sm font-semibold rounded-full shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top duration-200 flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
          <span>{notificationToast}</span>
        </div>
      )}

      {/* 3. Title Screen Overlay (in 'title' state) */}
      {gameState === 'title' && (
        <TitleScreen
          onStart={handleStartGame}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          peerCount={peerCount}
          localStudentName={multiplayerNet.getLocalName()}
        />
      )}

      {/* 4. In-Game HUD (in 'playing' or 'paused' state) */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <GameHUD
          sanity={sanity}
          battery={battery}
          isFlashlightOn={isFlashlightOn}
          isHiding={isHiding}
          inventory={inventory}
          hoverTarget={hoverTarget}
          examinerProximity={examinerProximity}
          examinerAlert={examinerAlert}
          activeObjective={objectives[objectiveIndex - 1] || 'Uteč z Koleje Blanice!'}
          objectiveIndex={objectiveIndex}
          totalObjectives={objectives.length}
          recentRadio={recentRadio}
          isMuted={isMuted}
          graceRemaining={graceRemaining}
          onToggleMute={handleToggleMute}
          onPause={() => {
            setGameState('paused');
            setIsPauseOpen(true);
          }}
        />
      )}

      {/* 5. Czech & Slovak Interactive Dialogue Modal */}
      <DialogueModal
        currentNode={currentDialogueNode}
        onSelectChoice={handleSelectDialogueChoice}
        onClose={() => setCurrentDialogueNode(null)}
      />

      {/* 6. Interactive Modals */}
      <InSisModal
        isOpen={isInSisOpen}
        onClose={() => setIsInSisOpen(false)}
        isAlreadyUnlocked={inventory.includes('MASTER_FUSE')}
        onSuccess={() => {
          setInventory((prev) => [...prev, 'MASTER_FUSE']);
          soundEngine.playPickup();
          showToast('Získal jsi 380V hlavní pojistku z InSISu! Jdi k rozvodné skříni.');
          multiplayerNet.broadcastRadio('Získal jsem hlavní 380V pojistku z InSISu! Jdu k rozvodně!');
        }}
      />

      <NoticeboardModal
        isOpen={isNoticeboardOpen}
        onClose={() => setIsNoticeboardOpen(false)}
      />

      <PauseModal
        isOpen={isPauseOpen}
        onResume={() => {
          setIsPauseOpen(false);
          setGameState('playing');
        }}
        onRestart={handleRestart}
        onTitle={handleReturnToTitle}
      />

      <VictoryModal
        isOpen={isVictoryOpen}
        timeElapsed={timeElapsed}
        remainingSanity={sanity}
        onRestart={handleRestart}
      />

      <GameOverModal
        isOpen={isGameOverOpen}
        reason={gameOverReason}
        onRestart={handleRestart}
      />
    </div>
  );
}

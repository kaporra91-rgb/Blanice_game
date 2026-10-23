/**
 * Real-time Multiplayer & Classmate Radio Communication System.
 * Supports cross-tab BroadcastChannel peer sync (so two classmates in different windows
 * can explore Kolej Blanice together) and autonomous simulated student broadcasts.
 */

import { PeerPlayer, ClassmateMessage } from './types';

export class MultiplayerNetwork {
  private channel: BroadcastChannel | null = null;
  private localId: string;
  private localName: string;
  private peers: Map<string, PeerPlayer> = new Map();
  private messageListeners: ((msg: ClassmateMessage) => void)[] = [];
  private peerUpdateListeners: ((peers: PeerPlayer[]) => void)[] = [];
  private autoBroadcastInterval: number | null = null;

  constructor() {
    this.localId = 'stud_' + Math.random().toString(36).substring(2, 7);
    const czechNames = ['Martin (FIS)', 'Tereza (FPH)', 'Jakub (FFÚ)', 'Anna (FMV)', 'Tomáš (NF)'];
    this.localName = czechNames[Math.floor(Math.random() * czechNames.length)];

    try {
      this.channel = new BroadcastChannel('kolej_blanice_net');
      this.channel.onmessage = (event) => this.handleMessage(event.data);
    } catch (e) {
      console.warn('BroadcastChannel not supported in this context:', e);
    }

    this.startSimulatedClassmateChatter();
  }

  public getLocalId(): string {
    return this.localId;
  }

  public getLocalName(): string {
    return this.localName;
  }

  public broadcastPosition(x: number, y: number, z: number, rotationY: number, flashlightOn: boolean) {
    if (!this.channel) return;
    this.channel.postMessage({
      type: 'peer_pos',
      payload: {
        id: this.localId,
        name: this.localName,
        x,
        y,
        z,
        rotationY,
        flashlightOn,
        lastSeen: Date.now(),
      },
    });
  }

  public broadcastRadio(text: string) {
    const msg: ClassmateMessage = {
      id: 'msg_' + Date.now(),
      sender: this.localName,
      room: 'Vysílačka',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type: 'radio',
    };

    if (this.channel) {
      this.channel.postMessage({ type: 'radio_msg', payload: msg });
    }
    this.notifyMessage(msg);
  }

  public onMessage(listener: (msg: ClassmateMessage) => void) {
    this.messageListeners.push(listener);
  }

  public onPeersUpdated(listener: (peers: PeerPlayer[]) => void) {
    this.peerUpdateListeners.push(listener);
  }

  private handleMessage(data: any) {
    if (!data) return;

    if (data.type === 'peer_pos') {
      const p = data.payload as PeerPlayer;
      if (p.id !== this.localId) {
        this.peers.set(p.id, p);
        this.cleanStalePeers();
        this.peerUpdateListeners.forEach((fn) => fn(Array.from(this.peers.values())));
      }
    } else if (data.type === 'radio_msg') {
      const msg = data.payload as ClassmateMessage;
      this.notifyMessage(msg);
    }
  }

  private cleanStalePeers() {
    const now = Date.now();
    for (const [id, peer] of this.peers.entries()) {
      if (now - peer.lastSeen > 6000) {
        this.peers.delete(id);
      }
    }
  }

  private notifyMessage(msg: ClassmateMessage) {
    this.messageListeners.forEach((fn) => fn(msg));
  }

  private startSimulatedClassmateChatter() {
    const scriptedLore: { sender: string; room: string; text: string }[] = [
      {
        sender: 'Kryštof (NF)',
        room: 'Buňka 312',
        text: 'Profesor z Národohospodářské fakulty kontroluje termíny! Máme ještě pár minut klidu, než vyrazí!',
      },
      {
        sender: 'Karolína (Kuchyňka)',
        room: 'Společná',
        text: 'Klíč od studovny jsem schovala do červené konvice na lince.',
      },
      {
        sender: 'Petr (Prádelna)',
        room: 'Prádelna',
        text: 'Někdo nechal ISIC kartu položenou na pračce. Bez ní se k nouzovému východu nedostaneme.',
      },
      {
        sender: 'Vojta (Studovna)',
        room: 'Studovna',
        text: 'V InSIS terminálu je heslo k hlavní pojistce: 5214 (z přednášky z mikroekonomie)!',
      },
      {
        sender: 'Lucie (404)',
        room: 'Pokoj 404',
        text: 'Pokud vám dochází baterka, u úklidového vozíku leží náhradní 9V baterie.',
      },
      {
        sender: 'Ondřej (NF)',
        room: 'Buňka 312A',
        text: 'Až profesor začne zkoušet po chodbě, můžete vlézt do šatní skříně!',
      },
    ];

    let idx = 0;
    this.autoBroadcastInterval = window.setInterval(() => {
      const item = scriptedLore[idx % scriptedLore.length];
      idx++;

      const msg: ClassmateMessage = {
        id: 'sim_' + Date.now(),
        sender: item.sender,
        room: item.room,
        text: item.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        type: 'radio',
      };
      this.notifyMessage(msg);
    }, 24000);
  }

  public getPeers(): PeerPlayer[] {
    this.cleanStalePeers();
    return Array.from(this.peers.values());
  }

  public dispose() {
    if (this.autoBroadcastInterval) {
      clearInterval(this.autoBroadcastInterval);
    }
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
  }
}

export const multiplayerNet = new MultiplayerNetwork();

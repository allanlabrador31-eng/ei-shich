export type GameState = 'TITLE' | 'GET_READY' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export type GameDifficulty = 'easy' | 'classic' | 'hard';

export type BirdSkin = 'classic' | 'sasumata' | 'allan' | 'pajama';

export type MedalType = 'none' | 'bronze' | 'silver' | 'gold' | 'platinum';

export interface PipePair {
  x: number;
  topHeight: number;
  gap: number;
  width: number;
  passed: boolean;
  movingY?: number;
  movingDir?: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  shape?: 'circle' | 'square' | 'feather' | 'star';
  rotation?: number;
  vRot?: number;
}

export interface Cloud {
  x: number;
  y: number;
  speed: number;
  scale: number;
  alpha: number;
}

export interface Building {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export interface GameSettings {
  difficulty: GameDifficulty;
  skin: BirdSkin;
  soundEnabled: boolean;
}

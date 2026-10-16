import React, { useEffect, useRef } from 'react';
import { GameState, GameDifficulty, BirdSkin, PipePair, Particle, Cloud } from '../types/game';
import { sound } from '../utils/audio';

interface FlappyCanvasProps {
  gameState: GameState;
  difficulty: GameDifficulty;
  skin: BirdSkin;
  onGameOver: (score: number) => void;
  onScoreUpdate: (score: number) => void;
  isPaused: boolean;
  onTapToStart?: () => void;
}

const V_WIDTH = 380;
const V_HEIGHT = 620;
const GROUND_HEIGHT = 100;
const PLAYABLE_HEIGHT = V_HEIGHT - GROUND_HEIGHT;

export const FlappyCanvas: React.FC<FlappyCanvasProps> = ({
  gameState,
  difficulty,
  skin,
  onGameOver,
  onScoreUpdate,
  isPaused,
  onTapToStart,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Mutable game state held in refs so canvas loop runs at 60 FPS without React re-render overhead
  const stateRef = useRef({
    score: 0,
    birdY: PLAYABLE_HEIGHT / 2,
    birdVy: 0,
    birdRot: 0,
    birdFrame: 0,
    flapTimer: 0,
    pipes: [] as PipePair[],
    pipeTimer: 0,
    groundOffset: 0,
    clouds: [] as Cloud[],
    particles: [] as Particle[],
    screenShake: 0,
    hitFlash: 0,
    hasHitPipe: false,
    hasHitGround: false,
    hasReportedGameOver: false,
    stars: [] as { x: number; y: number; size: number; alpha: number; twinkleSpeed: number }[],
    // Minecraft tree positions
    trees: [
      { x: 30, y: PLAYABLE_HEIGHT - 44, width: 28, height: 44 },
      { x: 130, y: PLAYABLE_HEIGHT - 38, width: 24, height: 38 },
      { x: 240, y: PLAYABLE_HEIGHT - 48, width: 30, height: 48 },
      { x: 330, y: PLAYABLE_HEIGHT - 40, width: 26, height: 40 },
    ],
  });

  const propsRef = useRef({
    gameState,
    difficulty,
    skin,
    isPaused,
    onGameOver,
    onScoreUpdate,
    onTapToStart,
  });

  useEffect(() => {
    propsRef.current = {
      gameState,
      difficulty,
      skin,
      isPaused,
      onGameOver,
      onScoreUpdate,
      onTapToStart,
    };
  }, [gameState, difficulty, skin, isPaused, onGameOver, onScoreUpdate, onTapToStart]);

  // Jump action
  const jump = () => {
    const { gameState, isPaused, onTapToStart } = propsRef.current;
    if (isPaused) return;

    if (gameState === 'GET_READY' || gameState === 'TITLE') {
      if (onTapToStart) onTapToStart();
      return;
    }

    if (gameState !== 'PLAYING') return;

    const s = stateRef.current;
    if (s.hasHitPipe || s.hasHitGround) return;

    // Impulse
    let jumpImpulse = -6.5;
    if (propsRef.current.difficulty === 'easy') jumpImpulse = -6.2;
    if (propsRef.current.difficulty === 'hard') jumpImpulse = -6.8;

    s.birdVy = jumpImpulse;
    s.birdRot = -0.42; // Upward tilt
    s.birdFrame = 1;

    sound.playFlap();

    // Spawn cute Hachiware dust / sparkle particles
    for (let i = 0; i < 4; i++) {
      s.particles.push({
        x: 82 - 12,
        y: s.birdY + 10,
        vx: (Math.random() - 0.7) * 2,
        vy: (Math.random() - 0.2) * 1.5,
        size: Math.random() * 3 + 3,
        color: Math.random() > 0.5 ? '#7dd3fc' : '#ffffff',
        alpha: 0.9,
        decay: 0.05,
        shape: 'square',
      });
    }
  };

  // Reset state on transitions
  useEffect(() => {
    if (gameState === 'GET_READY' || gameState === 'TITLE') {
      const s = stateRef.current;
      s.score = 0;
      s.birdY = PLAYABLE_HEIGHT / 2 - 20;
      s.birdVy = 0;
      s.birdRot = 0;
      s.birdFrame = 0;
      s.pipes = [];
      s.pipeTimer = 0;
      s.particles = [];
      s.screenShake = 0;
      s.hitFlash = 0;
      s.hasHitPipe = false;
      s.hasHitGround = false;
      s.hasReportedGameOver = false;
      propsRef.current.onScoreUpdate(0);
    }
  }, [gameState]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        jump();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Main 60 FPS Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const s = stateRef.current;

    // Minecraft-style rectangular block clouds
    s.clouds = [
      { x: 20, y: 55, speed: 0.2, scale: 1.0, alpha: 0.9 },
      { x: 160, y: 105, speed: 0.15, scale: 0.85, alpha: 0.85 },
      { x: 290, y: 40, speed: 0.25, scale: 1.2, alpha: 0.9 },
      { x: 420, y: 90, speed: 0.18, scale: 0.95, alpha: 0.85 },
    ];

    // Minecraft blocky stars
    s.stars = [];
    for (let i = 0; i < 45; i++) {
      s.stars.push({
        x: Math.floor(Math.random() * (V_WIDTH / 8)) * 8 + 4,
        y: Math.floor(Math.random() * (PLAYABLE_HEIGHT * 0.75 / 8)) * 8 + 4,
        size: 3,
        alpha: Math.random() * 0.6 + 0.4,
        twinkleSpeed: Math.random() * 0.05 + 0.02,
      });
    }

    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const rawDt = (currentTime - lastTime) / 1000;
      const dt = Math.min(rawDt, 0.05);
      lastTime = currentTime;

      const { gameState, isPaused, difficulty, skin, onGameOver, onScoreUpdate } = propsRef.current;

      if (!isPaused) {
        // --- SIMULATION ---
        s.flapTimer += dt * 8;
        s.birdFrame = Math.floor(s.flapTimer) % 3;

        // Ground offset
        if (gameState !== 'GAME_OVER' || (!s.hasHitGround && !s.hasHitPipe)) {
          s.groundOffset = (s.groundOffset + 2.2) % 16;
        }

        // Minecraft clouds drifting
        s.clouds.forEach(c => {
          c.x -= c.speed;
          if (c.x < -140) c.x = V_WIDTH + 60;
        });

        // Decay shake and flash
        if (s.screenShake > 0) s.screenShake = Math.max(0, s.screenShake - dt * 25);
        if (s.hitFlash > 0) s.hitFlash = Math.max(0, s.hitFlash - dt * 4);

        // Update square Minecraft particles
        for (let i = s.particles.length - 1; i >= 0; i--) {
          const p = s.particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.12; // Block gravity
          p.alpha -= p.decay;
          if (p.alpha <= 0) {
            s.particles.splice(i, 1);
          }
        }

        // Floating hover in TITLE or GET_READY
        if (gameState === 'TITLE' || gameState === 'GET_READY') {
          s.birdY = PLAYABLE_HEIGHT / 2 - 20 + Math.sin(currentTime * 0.005) * 8;
          s.birdRot = Math.sin(currentTime * 0.005) * 0.06;
          s.birdVy = 0;
        }

        // Active Playing or Dying Physics
        if (gameState === 'PLAYING' || gameState === 'GAME_OVER') {
          const gravity = 0.34;
          s.birdVy += gravity;
          s.birdY += s.birdVy;

          // Rotation follows velocity
          if (s.birdVy < 0) {
            s.birdRot = Math.max(-0.4, s.birdVy * 0.06);
          } else {
            s.birdRot = Math.min(Math.PI / 2.2, s.birdRot + 0.05);
          }

          if (gameState === 'PLAYING') {
            const pipeSpeed = difficulty === 'hard' ? 2.6 : difficulty === 'easy' ? 2.0 : 2.3;
            const gapSize = difficulty === 'hard' ? 116 : difficulty === 'easy' ? 148 : 130;
            const pipeInterval = difficulty === 'hard' ? 85 : 95;

            s.pipeTimer++;
            if (s.pipeTimer >= pipeInterval) {
              s.pipeTimer = 0;
              const minPipeH = 60;
              const maxPipeH = PLAYABLE_HEIGHT - gapSize - minPipeH;
              const topH = Math.floor(Math.random() * (maxPipeH - minPipeH)) + minPipeH;

              s.pipes.push({
                x: V_WIDTH + 10,
                topHeight: topH,
                gap: gapSize,
                width: 58,
                passed: false,
                movingY: difficulty === 'hard' ? Math.random() * 30 : 0,
                movingDir: 1,
              });
            }

            // Move pipes
            for (let i = s.pipes.length - 1; i >= 0; i--) {
              const pipe = s.pipes[i];
              pipe.x -= pipeSpeed;

              if (pipe.movingY) {
                pipe.topHeight += (pipe.movingDir || 1) * 0.35;
                if (pipe.topHeight > 340 || pipe.topHeight < 70) {
                  pipe.movingDir = (pipe.movingDir || 1) * -1;
                }
              }

              // Score check
              const birdX = 90;
              if (!pipe.passed && pipe.x + pipe.width < birdX) {
                pipe.passed = true;
                s.score += 1;
                onScoreUpdate(s.score);
                sound.playScore();

                // Minecraft emerald / experience orb particle burst
                for (let k = 0; k < 6; k++) {
                  s.particles.push({
                    x: birdX + 15,
                    y: s.birdY,
                    vx: (Math.random() - 0.5) * 3,
                    vy: (Math.random() - 0.5) * 3,
                    size: 4,
                    color: Math.random() > 0.5 ? '#86efac' : '#fef08a',
                    alpha: 1,
                    decay: 0.05,
                    shape: 'square',
                  });
                }
              }

              if (pipe.x + pipe.width < -20) {
                s.pipes.splice(i, 1);
              }
            }

            // Hitbox checks
            const birdRadius = 14;
            const birdCenter = { x: 90, y: s.birdY };

            // 1. Ground collision
            if (s.birdY + birdRadius >= PLAYABLE_HEIGHT) {
              s.birdY = PLAYABLE_HEIGHT - birdRadius;
              s.hasHitGround = true;
              s.screenShake = 12;
              s.hitFlash = 1;
              sound.playHit();
              sound.playFall();
              triggerGameOver();
            }

            // 2. Ceiling collision
            if (s.birdY - birdRadius <= 0) {
              s.birdY = birdRadius;
              s.birdVy = 0;
            }

            // 3. Pipe collisions
            for (const pipe of s.pipes) {
              const inPipeX = birdCenter.x + birdRadius > pipe.x + 3 && birdCenter.x - birdRadius < pipe.x + pipe.width - 3;
              if (inPipeX) {
                const hitTop = birdCenter.y - birdRadius < pipe.topHeight;
                const hitBottom = birdCenter.y + birdRadius > pipe.topHeight + pipe.gap;
                if (hitTop || hitBottom) {
                  s.hasHitPipe = true;
                  s.screenShake = 15;
                  s.hitFlash = 1;
                  sound.playHit();
                  sound.playFall();

                  // Minecraft dirt block breaking particles!
                  for (let d = 0; d < 14; d++) {
                    s.particles.push({
                      x: birdCenter.x,
                      y: birdCenter.y,
                      vx: (Math.random() - 0.5) * 5,
                      vy: (Math.random() - 0.5) * 5,
                      size: Math.random() * 3 + 3,
                      color: Math.random() > 0.5 ? '#866043' : '#573d26',
                      alpha: 1,
                      decay: 0.04,
                      shape: 'square',
                    });
                  }

                  triggerGameOver();
                  break;
                }
              }
            }
          } else if (gameState === 'GAME_OVER') {
            if (s.birdY + 14 >= PLAYABLE_HEIGHT) {
              s.birdY = PLAYABLE_HEIGHT - 14;
              s.birdVy = 0;
              s.birdRot = Math.PI / 2.2;
            }
          }
        }
      }

      function triggerGameOver() {
        if (s.hasReportedGameOver) return;
        s.hasReportedGameOver = true;
        onGameOver(s.score);
      }

      // --- RENDER PASS ---
      ctx.save();

      // Screen shake
      if (s.screenShake > 0) {
        const shakeX = (Math.random() - 0.5) * s.screenShake;
        const shakeY = (Math.random() - 0.5) * s.screenShake;
        ctx.translate(shakeX, shakeY);
      }

      const score = s.score;

      // 1. MINECRAFT SKY GRADIENT
      drawMinecraftSky(ctx, score);

      // 2. MINECRAFT CELESTIAL BODIES (Square Sun & Square Moon + Stars)
      drawMinecraftCelestial(ctx, score, currentTime, s.stars);

      // 3. MINECRAFT STEPPED CLOUDS
      s.clouds.forEach(c => {
        drawMinecraftCloud(ctx, c.x, c.y, c.scale, score);
      });

      // 4. MINECRAFT HILLS & VOXEL OAK TREES (Parallax Background)
      drawMinecraftTerrain(ctx, score, s.trees);

      // 5. MINECRAFT BLOCK PIPES
      s.pipes.forEach(pipe => {
        drawMinecraftPipe(ctx, pipe.x, 0, pipe.width, pipe.topHeight, true);
        const bottomY = pipe.topHeight + pipe.gap;
        const bottomH = PLAYABLE_HEIGHT - bottomY;
        drawMinecraftPipe(ctx, pipe.x, bottomY, pipe.width, bottomH, false);
      });

      // 6. SQUARE MINECRAFT PARTICLES
      s.particles.forEach(p => {
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        // Draw sharp Minecraft pixel block
        ctx.fillRect(p.x, p.y, p.size, p.size);
        ctx.restore();
      });

      // 7. HACHIWARE FROM CHIIKAWA (The Flying Hero!)
      drawHachiware(ctx, 90, s.birdY, s.birdRot, s.birdFrame, skin);

      // 8. MINECRAFT GRASS & DIRT GROUND
      drawMinecraftGround(ctx, s.groundOffset);

      // 9. HIT FLASH
      if (s.hitFlash > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${s.hitFlash * 0.7})`;
        ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      className="relative w-full h-full flex items-center justify-center overflow-hidden cursor-pointer select-none bg-slate-950"
      onClick={jump}
      onTouchStart={e => {
        e.preventDefault();
        jump();
      }}
    >
      <canvas
        ref={canvasRef}
        width={V_WIDTH}
        height={V_HEIGHT}
        className="w-full h-full max-w-[440px] max-h-[720px] object-contain shadow-2xl rounded-xl border-4 border-slate-900 bg-sky-400"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
};

// ============================================================
// MINECRAFT BACKGROUND DRAWING HELPERS
// ============================================================

// 1. Minecraft Sky
function drawMinecraftSky(ctx: CanvasRenderingContext2D, score: number) {
  let skyTop = '#78a7ff'; // Classic Minecraft daylight sky
  let skyBottom = '#b0ccff';

  if (score >= 20) {
    // Minecraft night sky
    skyTop = '#0a0e17';
    skyBottom = '#151e30';
  } else if (score >= 10) {
    // Minecraft sunset sky
    skyTop = '#c85a2b';
    skyBottom = '#f69d53';
  }

  const grad = ctx.createLinearGradient(0, 0, 0, PLAYABLE_HEIGHT);
  grad.addColorStop(0, skyTop);
  grad.addColorStop(1, skyBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);
}

// 2. Minecraft Celestial: Iconic Square Sun / Square Moon & Stars
function drawMinecraftCelestial(
  ctx: CanvasRenderingContext2D,
  score: number,
  time: number,
  stars: { x: number; y: number; size: number; alpha: number; twinkleSpeed: number }[]
) {
  ctx.save();

  if (score >= 20) {
    // Night: Minecraft Square Moon
    const mx = 285;
    const my = 60;
    const size = 32;

    // Soft square halo
    ctx.fillStyle = 'rgba(215, 230, 255, 0.2)';
    ctx.fillRect(mx - 4, my - 4, size + 8, size + 8);

    // Moon body
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(mx, my, size, size);

    // Minecraft Moon craters (classic square pixel craters)
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(mx + 4, my + 6, 8, 6);
    ctx.fillRect(mx + 18, my + 14, 8, 8);
    ctx.fillRect(mx + 8, my + 20, 6, 6);

    // Square pixel stars
    stars.forEach(st => {
      const a = st.alpha + Math.sin(time * st.twinkleSpeed) * 0.25;
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.1, a)})`;
      ctx.fillRect(st.x, st.y, st.size, st.size);
    });
  } else {
    // Day/Sunset: Iconic Minecraft Square Sun!
    const sx = 280;
    const sy = 60;
    const size = 36;

    // Sun outer glow
    ctx.fillStyle = score >= 10 ? 'rgba(254, 215, 170, 0.4)' : 'rgba(254, 240, 138, 0.35)';
    ctx.fillRect(sx - 5, sy - 5, size + 10, size + 10);

    // Sun outer rim
    ctx.fillStyle = score >= 10 ? '#f97316' : '#fef08a';
    ctx.fillRect(sx, sy, size, size);

    // Sun intense center
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sx + 5, sy + 5, size - 10, size - 10);
  }

  ctx.restore();
}

// 3. Minecraft Stepped Rectangular Clouds
function drawMinecraftCloud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  score: number
) {
  ctx.save();
  const baseW = 90 * scale;
  const baseH = 18 * scale;

  const topColor = score >= 20 ? 'rgba(255, 255, 255, 0.15)' : score >= 10 ? 'rgba(254, 215, 170, 0.75)' : '#ffffff';
  const shadowColor = score >= 20 ? 'rgba(200, 200, 220, 0.1)' : score >= 10 ? 'rgba(220, 150, 110, 0.7)' : '#d1d5db';

  // Cloud top main rectangle
  ctx.fillStyle = topColor;
  ctx.fillRect(x, y, baseW, baseH);

  // Stepped block bumps on top
  ctx.fillRect(x + 18 * scale, y - 6 * scale, 48 * scale, 6 * scale);
  ctx.fillRect(x + 30 * scale, y - 11 * scale, 24 * scale, 5 * scale);

  // Under-shading strip (Minecraft cloud 3D bottom)
  ctx.fillStyle = shadowColor;
  ctx.fillRect(x, y + baseH - 3 * scale, baseW, 3 * scale);

  ctx.restore();
}

// 4. Minecraft Horizon (Stepped Voxel Hills & Blocky Oak Trees)
function drawMinecraftTerrain(
  ctx: CanvasRenderingContext2D,
  score: number,
  trees: { x: number; y: number; width: number; height: number }[]
) {
  ctx.save();

  const hillGrass = score >= 20 ? '#1e3a1e' : score >= 10 ? '#435e23' : '#4d7c0f';
  const hillDirt = score >= 20 ? '#1f2937' : score >= 10 ? '#543621' : '#713f12';

  // Distant stepped mountain blocks
  ctx.fillStyle = hillDirt;
  ctx.fillRect(0, PLAYABLE_HEIGHT - 65, V_WIDTH, 65);

  // Stepped hill contour
  ctx.fillStyle = hillGrass;
  ctx.fillRect(0, PLAYABLE_HEIGHT - 65, V_WIDTH, 12);
  // Tier 2 step
  ctx.fillRect(40, PLAYABLE_HEIGHT - 85, 120, 20);
  ctx.fillRect(40, PLAYABLE_HEIGHT - 85, 120, 8);
  // Tier 3 step
  ctx.fillRect(210, PLAYABLE_HEIGHT - 78, 140, 13);
  ctx.fillRect(210, PLAYABLE_HEIGHT - 78, 140, 6);

  // Minecraft Oak Trees
  trees.forEach(t => {
    // Oak Wood Trunk
    ctx.fillStyle = '#78350f'; // Dark wood
    ctx.fillRect(t.x + 8, t.y + 16, 8, t.height - 16);
    ctx.fillStyle = '#92400e'; // Light wood accent
    ctx.fillRect(t.x + 9, t.y + 16, 3, t.height - 16);

    // Cubic Oak Leaves Block (Minecraft foliage)
    const leafColor = score >= 20 ? '#166534' : score >= 10 ? '#65a30d' : '#22c55e';
    const leafDark = score >= 20 ? '#14532d' : score >= 10 ? '#4d7c0f' : '#15803d';

    ctx.fillStyle = leafColor;
    ctx.fillRect(t.x, t.y, t.width, 22);

    // Leaf block pixel grid shading
    ctx.fillStyle = leafDark;
    ctx.fillRect(t.x, t.y + 18, t.width, 4);
    ctx.fillRect(t.x + t.width - 4, t.y, 4, 22);
    // Darker corner pixels
    ctx.fillRect(t.x + 4, t.y + 4, 4, 4);
    ctx.fillRect(t.x + 14, t.y + 8, 4, 4);
  });

  ctx.restore();
}

// 5. Minecraft Blocky Pipe Pillars (Emerald / Cactus / Green Pixel Blocks)
function drawMinecraftPipe(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  isTop: boolean
) {
  if (h <= 0) return;

  const capH = 26;
  const lipExt = 4;
  const bodyW = w - lipExt * 2;
  const bodyX = x + lipExt;

  ctx.save();

  // Minecraft Emerald/Cactus block green palette
  const darkBorder = '#052e16';
  const greenBase = '#16a34a';
  const greenLight = '#4ade80';
  const greenDark = '#15803d';
  const greenAccent = '#86efac';

  // Body
  const bodyY = isTop ? 0 : y + capH;
  const currentBodyH = isTop ? h - capH : h - capH;

  if (currentBodyH > 0) {
    // Fill block body
    ctx.fillStyle = greenBase;
    ctx.fillRect(bodyX, bodyY, bodyW, currentBodyH);

    // Minecraft block 16px vertical grid lines
    for (let by = bodyY; by < bodyY + currentBodyH; by += 16) {
      const bh = Math.min(16, bodyY + currentBodyH - by);

      // Top/Left pixel highlight for block
      ctx.fillStyle = greenLight;
      ctx.fillRect(bodyX + 2, by + 2, 4, bh - 4);
      ctx.fillRect(bodyX + 2, by + 2, bodyW - 4, 2);

      // Bottom/Right shadow
      ctx.fillStyle = greenDark;
      ctx.fillRect(bodyX + bodyW - 6, by + 2, 4, bh - 4);
      ctx.fillRect(bodyX + 2, by + bh - 3, bodyW - 4, 2);

      // Decorative Minecraft block pixel dot
      ctx.fillStyle = greenAccent;
      ctx.fillRect(bodyX + 10, by + 6, 3, 3);
      ctx.fillStyle = darkBorder;
      ctx.fillRect(bodyX + 22, by + 9, 3, 3);
    }

    // Outer dark Minecraft border
    ctx.strokeStyle = darkBorder;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(bodyX, bodyY, bodyW, currentBodyH);
  }

  // Cap Slab (Minecraft overhanging block cap)
  const capY = isTop ? y + h - capH : y;

  ctx.fillStyle = greenBase;
  ctx.fillRect(x, capY, w, capH);

  // Cap highlights & 3D borders
  ctx.fillStyle = greenLight;
  ctx.fillRect(x + 2, capY + 2, w - 4, 4);
  ctx.fillRect(x + 2, capY + 2, 4, capH - 4);

  // Cap shadows
  ctx.fillStyle = greenDark;
  ctx.fillRect(x + w - 6, capY + 2, 4, capH - 4);
  ctx.fillRect(x + 2, capY + capH - 5, w - 4, 4);

  // Pixel studs on cap
  ctx.fillStyle = greenAccent;
  ctx.fillRect(x + 12, capY + 8, 4, 4);
  ctx.fillRect(x + 28, capY + 8, 4, 4);
  ctx.fillRect(x + 44, capY + 8, 4, 4);

  // Dark border outline
  ctx.strokeStyle = darkBorder;
  ctx.lineWidth = 3;
  ctx.strokeRect(x, capY, w, capH);

  ctx.restore();
}

// ============================================================
// HACHIWARE FROM CHIIKAWA ANIME DRAWING
// ============================================================

function drawHachiware(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rot: number,
  frame: number,
  skin: BirdSkin
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);

  // Arm/paw bobbing offset with flight frame
  const pawY = frame === 1 ? -4 : frame === 2 ? 4 : 0;
  const tailBob = frame === 1 ? -3 : 2;

  const outlineCol = '#1e293b'; // Chiikawa clean manga outline
  const bodyWhite = '#ffffff'; // Hachiware's pure white fur
  const hachiBlue = '#4ca3ec'; // Iconic Hachiware sky blue bangs & ears
  const hachiBlueDark = '#3581c4'; // Shading on blue
  const blushPink = 'rgba(251, 113, 133, 0.7)'; // Soft blush cheek
  const earPink = '#fecdd3'; // Inner ear pink

  // 1. CUTE BLUE CAT TAIL (Wagging behind)
  ctx.save();
  ctx.fillStyle = hachiBlue;
  ctx.beginPath();
  ctx.ellipse(-16, 7 + tailBob, 7, 4, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = outlineCol;
  ctx.lineWidth = 1.8;
  ctx.stroke();
  ctx.restore();

  // 2. CAT EARS (Pointed cute kitten ears on top sides)
  // Left Ear
  ctx.save();
  ctx.fillStyle = hachiBlue;
  ctx.beginPath();
  ctx.moveTo(-14, -8);
  ctx.lineTo(-12, -22);
  ctx.lineTo(-2, -14);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = outlineCol;
  ctx.lineWidth = 2;
  ctx.stroke();
  // Left Inner Ear (Pink)
  ctx.fillStyle = earPink;
  ctx.beginPath();
  ctx.moveTo(-12, -9);
  ctx.lineTo(-11, -18);
  ctx.lineTo(-5, -13);
  ctx.closePath();
  ctx.fill();

  // Right Ear
  ctx.fillStyle = hachiBlue;
  ctx.beginPath();
  ctx.moveTo(4, -14);
  ctx.lineTo(14, -22);
  ctx.lineTo(16, -8);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = outlineCol;
  ctx.lineWidth = 2;
  ctx.stroke();
  // Right Inner Ear (Pink)
  ctx.fillStyle = earPink;
  ctx.beginPath();
  ctx.moveTo(6, -13);
  ctx.lineTo(13, -18);
  ctx.lineTo(14, -9);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 3. MAIN CHUBBY ROUND BODY (Chiikawa's pear-like round kitten shape)
  ctx.save();
  ctx.fillStyle = bodyWhite;
  ctx.beginPath();
  ctx.ellipse(0, 0, 18, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = outlineCol;
  ctx.lineWidth = 2.2;
  ctx.stroke();

  // Soft shaded bottom belly curve
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.ellipse(0, 4, 13, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 4. SIGNATURE BLUE "HACHIWARE" BANGS (The iconic parted blue hair pattern!)
  // In Japanese, "hachiware" refers to the inverted V (八) blue patch on the forehead.
  ctx.save();
  ctx.fillStyle = hachiBlue;

  // Left blue wedge
  ctx.beginPath();
  ctx.moveTo(-16, -5);
  ctx.quadraticCurveTo(-14, -16, 0, -15);
  ctx.lineTo(-3, -7);
  ctx.quadraticCurveTo(-11, -7, -16, -5);
  ctx.closePath();
  ctx.fill();

  // Right blue wedge
  ctx.beginPath();
  ctx.moveTo(16, -5);
  ctx.quadraticCurveTo(14, -16, 0, -15);
  ctx.lineTo(3, -7);
  ctx.quadraticCurveTo(11, -7, 16, -5);
  ctx.closePath();
  ctx.fill();

  // Subtle dark hairline accent
  ctx.strokeStyle = hachiBlueDark;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-3, -7);
  ctx.lineTo(0, -15);
  ctx.lineTo(3, -7);
  ctx.stroke();

  ctx.restore();

  // 5. KAWAII FACE: BIG EXPRESSIVE ANIME EYES
  // Left Eye
  ctx.save();
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.ellipse(-6.5, -2, 3.2, 3.8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Big top white highlight
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-5.5, -3.2, 1.4, 0, Math.PI * 2);
  ctx.fill();
  // Smaller bottom gleam
  ctx.beginPath();
  ctx.arc(-7.5, -0.8, 0.7, 0, Math.PI * 2);
  ctx.fill();

  // Right Eye
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.ellipse(6.5, -2, 3.2, 3.8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Big top white highlight
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(7.5, -3.2, 1.4, 0, Math.PI * 2);
  ctx.fill();
  // Smaller bottom gleam
  ctx.beginPath();
  ctx.arc(5.5, -0.8, 0.7, 0, Math.PI * 2);
  ctx.fill();

  // 6. ROSY BLUSH CHEEKS
  ctx.fillStyle = blushPink;
  ctx.beginPath();
  ctx.ellipse(-10.5, 3.5, 3.5, 2.2, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(10.5, 3.5, 3.5, 2.2, -0.1, 0, Math.PI * 2);
  ctx.fill();

  // 7. NOSE & ICONIC CHIIKAWA CAT MOUTH (:3 / ω)
  // Tiny nose dot
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(0, 0.5, 1, 0, Math.PI * 2);
  ctx.fill();

  if (frame === 1) {
    // Happy open flying gasp (:D)
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(0, 3.5, 3.2, 0, Math.PI);
    ctx.fill();
    ctx.strokeStyle = outlineCol;
    ctx.lineWidth = 1.4;
    ctx.stroke();
  } else {
    // Classic Chiikawa "ω" cat smile
    ctx.strokeStyle = outlineCol;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    // Left curve
    ctx.arc(-1.8, 2.2, 1.8, 0.1, Math.PI * 0.9);
    // Right curve
    ctx.arc(1.8, 2.2, 1.8, 0.1, Math.PI * 0.9);
    ctx.stroke();
  }
  ctx.restore();

  // 8. CUTE FLAPPING WHITE PAWS (WINGS)
  // Left Front Paw
  ctx.save();
  ctx.fillStyle = bodyWhite;
  ctx.beginPath();
  ctx.ellipse(-7, 8 + pawY, 4.5, 3.5, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = outlineCol;
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // Right Front Paw
  ctx.beginPath();
  ctx.ellipse(7, 8 + pawY, 4.5, 3.5, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = outlineCol;
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.restore();

  // 9. SKIN SPECIFIC ACCESSORIES
  if (skin === 'sasumata') {
    // Hachiware's beloved iconic Blue Sasumata fork weapon from Chiikawa!
    ctx.save();
    ctx.translate(13, 2 + pawY);
    ctx.rotate(0.3);

    // Spear wooden handle
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, 16);
    ctx.lineTo(0, -10);
    ctx.stroke();

    // Blue forked 2-prong spearhead (Sasumata)
    ctx.fillStyle = '#38bdf8';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.8;

    // 2-prong fork shape
    ctx.beginPath();
    ctx.moveTo(-6, -18);
    ctx.quadraticCurveTo(-4, -11, 0, -10);
    ctx.quadraticCurveTo(4, -11, 6, -18);
    ctx.lineTo(4, -18);
    ctx.quadraticCurveTo(2, -13, 0, -12);
    ctx.quadraticCurveTo(-2, -13, -4, -18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  } else if (skin === 'allan') {
    // Allan's Cool Sunglasses & Golden Crown!
    ctx.save();
    // Pixel sunglasses
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-10, -5, 9, 6);
    ctx.fillRect(1, -5, 9, 6);
    // Sunglasses bridge
    ctx.fillRect(-1, -4, 2, 2);
    // Glint
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-8, -4, 3, 2);
    ctx.fillRect(3, -4, 3, 2);

    // Allan's Golden Crown
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(-7, -15);
    ctx.lineTo(-5, -24);
    ctx.lineTo(0, -17);
    ctx.lineTo(5, -24);
    ctx.lineTo(7, -15);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Ruby gem
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, -18, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (skin === 'pajama') {
    // Chiikawa cute Pajama Party sleeping nightcap & tiny bowtie!
    ctx.save();
    // Cute pink bowtie
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.lineTo(-4, 4);
    ctx.lineTo(-4, 8);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.lineTo(4, 4);
    ctx.lineTo(4, 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#db2777';
    ctx.beginPath();
    ctx.arc(0, 6, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Pajama sleeping cap
    ctx.fillStyle = '#fbcfe8';
    ctx.beginPath();
    ctx.moveTo(-10, -14);
    ctx.quadraticCurveTo(-14, -26, -22, -22);
    ctx.quadraticCurveTo(-12, -18, 6, -14);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#f472b6';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Puffball pompom
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-23, -22, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f472b6';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.restore();
  }

  ctx.restore();
}

// ============================================================
// MINECRAFT GRASS BLOCK GROUND DRAWING
// ============================================================

function drawMinecraftGround(ctx: CanvasRenderingContext2D, offset: number) {
  ctx.save();

  const groundY = PLAYABLE_HEIGHT;
  const groundH = GROUND_HEIGHT;

  // 1. Dirt Block Layer (rich Minecraft brown `#866043`)
  ctx.fillStyle = '#866043';
  ctx.fillRect(0, groundY, V_WIDTH, groundH);

  // Dirt block pixel texture (mottled dirt & pebbles)
  const dirtTileW = 16;
  const startX = -(offset % dirtTileW);

  for (let x = startX - 16; x < V_WIDTH + 32; x += dirtTileW) {
    for (let y = groundY + 16; y < groundY + groundH - 24; y += 16) {
      // Dark brown dirt specks
      ctx.fillStyle = '#573d26';
      ctx.fillRect(x + 3, y + 4, 3, 3);
      ctx.fillRect(x + 10, y + 11, 4, 3);
      // Light gravel specks
      ctx.fillStyle = '#9c744f';
      ctx.fillRect(x + 8, y + 2, 3, 3);
      ctx.fillRect(x + 2, y + 12, 3, 2);
    }
  }

  // 2. Minecraft Grass Top Layer (vibrant green `#5b8e34`)
  ctx.fillStyle = '#5b8e34';
  ctx.fillRect(0, groundY, V_WIDTH, 12);

  // Grass top edge highlight
  ctx.fillStyle = '#79c05a';
  ctx.fillRect(0, groundY, V_WIDTH, 3);

  // 3. Minecraft Grass Drips (iconic 4px stepped pixel grass overhanging into dirt!)
  ctx.fillStyle = '#5b8e34';
  const dripCycle = 16;
  for (let x = startX - 32; x < V_WIDTH + 32; x += dripCycle) {
    // Stepped pixel drops
    ctx.fillRect(x, groundY + 12, 4, 6);
    ctx.fillRect(x + 4, groundY + 12, 4, 3);
    ctx.fillRect(x + 8, groundY + 12, 4, 8);
    ctx.fillRect(x + 12, groundY + 12, 4, 4);

    // Dark grass shadow accent
    ctx.fillStyle = '#446b26';
    ctx.fillRect(x, groundY + 16, 4, 2);
    ctx.fillRect(x + 8, groundY + 18, 4, 2);
    ctx.fillStyle = '#5b8e34';
  }

  // 4. Minecraft Bedrock / Dark Stone base at bottom (bottom 24px)
  const bedrockY = groundY + groundH - 24;
  ctx.fillStyle = '#374151';
  ctx.fillRect(0, bedrockY, V_WIDTH, 24);

  // Bedrock pixel pattern
  for (let x = startX - 16; x < V_WIDTH + 32; x += 16) {
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(x + 2, bedrockY + 3, 5, 5);
    ctx.fillRect(x + 9, bedrockY + 12, 6, 6);
    ctx.fillStyle = '#4b5563';
    ctx.fillRect(x + 10, bedrockY + 4, 4, 4);
    ctx.fillRect(x + 3, bedrockY + 14, 4, 4);
  }

  // Dark border between grass and playfield
  ctx.fillStyle = '#1e3a1e';
  ctx.fillRect(0, groundY, V_WIDTH, 2);

  ctx.restore();
}

import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  AudioWaveform,
  Radio,
  Sliders,
  Volume2,
} from 'lucide-react';
import { VoiceProfileConfig } from '../../types';

export interface VoiceWaveVisualizerProps {
  pitch: number; // 0.5 to 1.5, default 1.0
  speed: number; // 0.7 to 1.8, default 1.0
  modulation?: number; // 0.0 to 1.0, default 0.55
  onModulationChange?: (val: number) => void;
  voiceProfile?: VoiceProfileConfig | null;
  voiceName?: string;
  isPlaying?: boolean;
  compact?: boolean;
  className?: string;
}

export const VoiceWaveVisualizer: React.FC<VoiceWaveVisualizerProps> = ({
  pitch,
  speed,
  modulation = 0.55,
  onModulationChange,
  voiceProfile,
  voiceName,
  isPlaying = false,
  compact = false,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [viewMode, setViewMode] = useState<'wave' | 'spectrum' | 'hybrid'>('hybrid');

  // Track slider interaction kinetics for tactile visual burst feedback
  const lastParamsRef = useRef({ pitch, speed, modulation });
  const interactionBoostRef = useRef<number>(0.0);

  useEffect(() => {
    const dPitch = Math.abs(pitch - lastParamsRef.current.pitch);
    const dSpeed = Math.abs(speed - lastParamsRef.current.speed);
    const dMod = Math.abs(modulation - lastParamsRef.current.modulation);
    const totalDelta = dPitch * 3.5 + dSpeed * 2.0 + dMod * 2.8;

    if (totalDelta > 0.005) {
      interactionBoostRef.current = Math.min(1.0, interactionBoostRef.current + Math.min(0.7, totalDelta * 3.2));
    }
    lastParamsRef.current = { pitch, speed, modulation };
  }, [pitch, speed, modulation]);

  // Compute realistic fundamental frequency based on gender/archetype & pitch
  const voiceMetrics = useMemo(() => {
    let baseHz = 130; // default male baritone
    const gender =
      voiceProfile?.gender ||
      (voiceName?.toLowerCase().includes('female') ||
      voiceName?.toLowerCase().includes('sofia') ||
      voiceName?.toLowerCase().includes('elena')
        ? 'feminino'
        : 'masculino');
    const age = voiceProfile?.age;
    const archetype = voiceProfile?.archetype;

    if (gender === 'feminino') {
      baseHz = age === 'suave' ? 225 : 210;
    } else {
      baseHz = age === 'grave' || archetype === 'cinematografica' ? 95 : 135;
    }

    // Multiply by user pitch factor (0.6x to 1.5x)
    const fundamentalHz = Math.round(baseHz * pitch);

    // Vocal classification string
    let classification = 'Barítono';
    if (gender === 'feminino') {
      classification =
        fundamentalHz < 190
          ? 'Contralto'
          : fundamentalHz < 260
          ? 'Mezzo-Soprano'
          : 'Soprano';
    } else {
      classification =
        fundamentalHz < 110
          ? 'Baixo Profundo'
          : fundamentalHz < 145
          ? 'Barítono'
          : 'Tenor';
    }

    // Formant estimation (F1, F2 in Hz)
    const f1 = Math.round(fundamentalHz * (2.8 + modulation * 0.8));
    const f2 = Math.round(fundamentalHz * (6.5 + modulation * 1.5));

    return {
      fundamentalHz,
      classification,
      gender,
      f1,
      f2,
    };
  }, [pitch, modulation, voiceProfile, voiceName]);

  // Animation frame loop using requestAnimationFrame
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let phase = 0;
    let speechCadencePhase = 0;

    // Handle high DPI
    const updateCanvasSize = () => {
      if (!canvas || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = Math.max(100, Math.floor(rect.width));
      const height = compact ? 56 : 82;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }
    };

    updateCanvasSize();

    // Resize observer to handle dynamic modal resizing smoothly
    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize();
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Background subtle grid & gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, 'rgba(10, 12, 18, 0.95)');
      bgGrad.addColorStop(1, 'rgba(6, 8, 12, 0.98)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Center baseline axis
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      // Smooth decay of kinetic interaction boost
      interactionBoostRef.current *= 0.94;
      const currentBoost = interactionBoostRef.current;

      // Time progression: speed factor determines phase velocity
      const speedFactor = speed * (isPlaying ? 1.45 : 1.0);
      phase += 0.038 * speedFactor;
      speechCadencePhase += 0.055 * speedFactor;

      // Dynamic speech envelope (syllabic pulsing when active)
      let speechEnvelope = 1.0;
      if (isPlaying) {
        const syllablePulse = Math.sin(speechCadencePhase * 1.5) * Math.cos(speechCadencePhase * 0.7);
        speechEnvelope = 0.55 + 0.45 * Math.max(0.15, Math.abs(syllablePulse));
      } else {
        speechEnvelope = 0.65 + 0.08 * Math.sin(phase * 0.5);
      }

      // 1. AMPLITUDE: varia conforme os valores de pitch e modulação dos sliders
      // Pitch mais alto ou maior modulação aumentam a energia e a amplitude da onda
      const centerY = height / 2;
      const ampMultiplier = 0.35 + (pitch - 0.5) * 0.32 + modulation * 0.48;
      const maxAmplitude =
        Math.min(height * 0.45, (height * 0.16) + (height * 0.28) * ampMultiplier) *
        speechEnvelope *
        (1.0 + currentBoost * 0.25);

      // Spatial frequency (wave cycles) governed by pitch
      const cycles = (1.5 + (pitch - 0.5) * 3.2) * (Math.PI * 2);

      // Frequency Modulation (FM) depth & rate governed by modulation slider
      const modDepth = 0.15 + modulation * 0.55;
      const modFreq = 2.0 + modulation * 3.8;

      // 2. COR DA LINHA: degradê #d4ff32 que varia com pitch e modulação
      // Conforme o pitch varia, as extremidades e paradas do degradê se ajustam
      // Conforme a modulação varia, a saturação, contraste e brilho harmônico mudam
      const waveGradient = ctx.createLinearGradient(0, 0, width, 0);

      if (pitch < 0.85) {
        // Pitch baixo (grave): degradê tonal mais quente/profundo com base em #d4ff32
        const warmStop = modulation > 0.6 ? '#f59e0b' : '#eab308';
        waveGradient.addColorStop(0, warmStop);
        waveGradient.addColorStop(0.3, '#d4ff32');
        waveGradient.addColorStop(0.7, '#a3e635');
        waveGradient.addColorStop(1, warmStop);
      } else if (pitch > 1.15) {
        // Pitch alto (agudo): degradê vibrante ciano elétrico combinando com #d4ff32
        const coolStop = modulation > 0.6 ? '#06b6d4' : '#38bdf8';
        waveGradient.addColorStop(0, coolStop);
        waveGradient.addColorStop(0.35, '#d4ff32');
        waveGradient.addColorStop(0.7, '#ffffff');
        waveGradient.addColorStop(1, coolStop);
      } else {
        // Pitch médio: degradê padrão centrado em #d4ff32 com nuances harmônicas de modulação
        const sideColor = modulation > 0.6 ? '#10b981' : '#84cc16';
        waveGradient.addColorStop(0, sideColor);
        waveGradient.addColorStop(0.25, '#d4ff32');
        waveGradient.addColorStop(0.5, modulation > 0.7 ? '#ffffff' : '#d4ff32');
        waveGradient.addColorStop(0.75, '#d4ff32');
        waveGradient.addColorStop(1, sideColor);
      }

      // ==========================================
      // BARRAS ESPECTRAIS (Modo 'spectrum' ou 'hybrid')
      // ==========================================
      if (viewMode === 'spectrum' || viewMode === 'hybrid') {
        const barCount = Math.min(36, Math.floor(width / 10));
        const barWidth = Math.max(2, width / barCount - 3);
        const barMaxHeight = height * (viewMode === 'spectrum' ? 0.75 : 0.42);

        for (let i = 0; i < barCount; i++) {
          const x = i * (width / barCount) + 2;
          const normalizedIdx = i / barCount;

          const pitchPeak = 0.2 + (pitch - 0.6) * 0.45;
          const distFromPeak = Math.abs(normalizedIdx - pitchPeak);
          const formantEnvelope = Math.exp(-distFromPeak * 4.5);
          const harmonicBump =
            Math.sin(normalizedIdx * Math.PI * (3 + modulation * 4) + phase) *
            (0.28 * modulation);
          const noise = Math.sin(phase * 2 + i * 1.3) * 0.15;

          const barHeight = Math.max(
            3,
            (formantEnvelope + harmonicBump + noise) *
              barMaxHeight *
              speechEnvelope *
              (1.0 + currentBoost * 0.3)
          );

          const barY = height - barHeight;
          const barGrad = ctx.createLinearGradient(0, barY, 0, height);
          barGrad.addColorStop(0, 'rgba(212, 255, 50, 0.6)');
          barGrad.addColorStop(1, 'rgba(212, 255, 50, 0.05)');

          ctx.fillStyle = barGrad;
          ctx.beginPath();
          ctx.roundRect(x, barY, barWidth, barHeight, [2, 2, 0, 0]);
          ctx.fill();
        }
      }

      // ==========================================
      // ONDA SONORA SUAVE (Modo 'wave' ou 'hybrid')
      // ==========================================
      if (viewMode === 'wave' || viewMode === 'hybrid') {
        const pointCount = Math.min(220, Math.max(90, Math.floor(width / 1.8)));
        const step = width / (pointCount - 1);

        interface WavePoint {
          x: number;
          y: number;
        }

        const points: WavePoint[] = [];

        for (let i = 0; i < pointCount; i++) {
          const x = i * step;
          const normX = i / (pointCount - 1);

          // Windowing envelope para atenuar as pontas da onda
          const windowEnv = Math.sin(normX * Math.PI);

          // Onda senoidal fundamental
          const fundamental = Math.sin(normX * cycles - phase);

          // Modulação de frequência (FM)
          const fm = Math.sin(normX * cycles * modFreq - phase * 1.8) * modDepth;

          // 2º harmônico sobreposto
          const overtone = Math.sin(normX * cycles * 2.0 - phase * 1.2) * (0.35 * modulation);

          // Micro-flutter de timbre
          const flutter = Math.sin(normX * cycles * 3.5 + phase * 0.8) * (0.12 * modulation);

          const combinedWave =
            (fundamental + fm + overtone + flutter) /
            (1 + modDepth * 0.6 + 0.35 * modulation + 0.12 * modulation);

          const y = centerY + combinedWave * maxAmplitude * windowEnv;
          points.push({ x, y });
        }

        // 1. Preenchimento de degradê inferior sob a onda (#d4ff32)
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        for (let i = 0; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.lineTo(width, centerY);
        ctx.closePath();

        const fillGrad = ctx.createLinearGradient(
          0,
          centerY - maxAmplitude,
          0,
          centerY + maxAmplitude
        );
        fillGrad.addColorStop(0, `rgba(212, 255, 50, ${0.14 + modulation * 0.22})`);
        fillGrad.addColorStop(0.6, `rgba(212, 255, 50, ${0.03 + modulation * 0.08})`);
        fillGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = fillGrad;
        ctx.fill();

        // 2. Linha secundária harmônica de ressonância
        ctx.beginPath();
        for (let i = 0; i < pointCount; i++) {
          const normX = i / (pointCount - 1);
          const windowEnv = Math.sin(normX * Math.PI);
          const wave2 =
            Math.sin(normX * cycles * 1.5 - phase * 0.8 + 1.2) *
            (maxAmplitude * 0.45 * windowEnv);
          const y = centerY + wave2;
          if (i === 0) ctx.moveTo(points[i].x, y);
          else ctx.lineTo(points[i].x, y);
        }
        ctx.strokeStyle = 'rgba(212, 255, 50, 0.25)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // 3. Linha principal contínua e suave da onda utilizando o degradê #d4ff32
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 0; i < points.length - 1; i++) {
          const midX = (points[i].x + points[i + 1].x) / 2;
          const midY = (points[i].y + points[i + 1].y) / 2;
          ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
        }
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);

        ctx.strokeStyle = waveGradient;
        ctx.lineWidth = isPlaying || currentBoost > 0.2 ? 3.0 : 2.4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Glow com a cor #d4ff32
        ctx.shadowColor = '#d4ff32';
        ctx.shadowBlur = 8 + modulation * 14 + currentBoost * 8;
        ctx.stroke();
        ctx.shadowBlur = 0; // reset
      }

      ctx.restore();
      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
    };
  }, [pitch, speed, modulation, isPlaying, viewMode, compact, voiceMetrics]);

  return (
    <div
      id="voice-wave-visualizer-container"
      ref={containerRef}
      className={`wave-container rounded-xl border border-white/10 bg-[#0d0f17] overflow-hidden shadow-inner flex flex-col ${className}`}
    >
      {/* Barra de telemetria superior */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#141724] border-b border-white/5 text-[11px]">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-[#d4ff32]'
              }`}
            />
            <span className="font-bold text-white tracking-wide uppercase text-[10px] flex items-center gap-1">
              <AudioWaveform className="w-3 h-3 text-[#d4ff32]" />
              <span>{isPlaying ? 'Voz Ativa' : 'Onda Sonora em Tempo Real'}</span>
            </span>
          </div>

          <span className="text-neutral-600 hidden sm:inline">•</span>

          <div className="hidden sm:flex items-center gap-1.5 text-neutral-400 text-[10px]">
            <span>{voiceMetrics.classification}</span>
            <span className="px-1.5 py-0.2 rounded bg-white/5 text-[#d4ff32] font-mono font-bold">
              {voiceMetrics.fundamentalHz} Hz
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Métricas rápidas */}
          <div className="hidden md:flex items-center gap-2 text-[10px] text-neutral-400">
            <span>
              Pitch: <strong className="text-[#d4ff32] font-mono">{pitch.toFixed(2)}x</strong>
            </span>
            <span>
              Mod: <strong className="text-[#d4ff32] font-mono">{Math.round(modulation * 100)}%</strong>
            </span>
          </div>

          {/* Seletor de modo */}
          <div className="flex items-center bg-black/40 rounded-lg p-0.5 border border-white/10">
            <button
              type="button"
              onClick={() => setViewMode('hybrid')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                viewMode === 'hybrid'
                  ? 'bg-[#d4ff32] text-black font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Modo Híbrido: Onda + Espectro"
            >
              Híbrido
            </button>
            <button
              type="button"
              onClick={() => setViewMode('wave')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                viewMode === 'wave'
                  ? 'bg-[#d4ff32] text-black font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Modo Onda Contínua"
            >
              Onda
            </button>
            <button
              type="button"
              onClick={() => setViewMode('spectrum')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                viewMode === 'spectrum'
                  ? 'bg-[#d4ff32] text-black font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Modo Barras Espectrais"
            >
              Barras
            </button>
          </div>
        </div>
      </div>

      {/* Canvas da Onda Sonora em Tempo Real */}
      <div className="relative w-full overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full block cursor-crosshair"
          style={{ height: compact ? '56px' : '82px' }}
        />

        {/* Badges de Frequência sobre o Canvas */}
        <div className="absolute top-1.5 left-2.5 pointer-events-none flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs border border-white/10 text-[9px] font-mono text-neutral-300">
            F₀: <span className="text-[#d4ff32] font-bold">{voiceMetrics.fundamentalHz}Hz</span>
          </span>
          <span className="px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs border border-white/10 text-[9px] font-mono text-neutral-400 hidden sm:inline">
            Formantes: {voiceMetrics.f1}Hz / {voiceMetrics.f2}Hz
          </span>
        </div>

        <div className="absolute bottom-1.5 right-2.5 pointer-events-none flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs border border-white/10 text-[9px] font-mono text-neutral-400">
            Ressonância:{' '}
            <span className="text-[#d4ff32] font-bold">
              {modulation > 0.65 ? 'Rica' : modulation > 0.35 ? 'Natural' : 'Pura'}
            </span>
          </span>
          {isPlaying && (
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-[9px] font-mono text-emerald-300 font-bold animate-pulse">
              AO VIVO
            </span>
          )}
        </div>
      </div>

      {/* Slider de modulação integrado em modo não-compacto */}
      {onModulationChange && !compact && (
        <div className="px-3 py-2 bg-[#12141e] border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-neutral-300">
            <Radio className="w-3.5 h-3.5 text-[#d4ff32]" />
            <span className="text-[11px] font-semibold">Modulação &amp; Ressonância Vocal:</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Timbre pré-definido */}
            <div className="hidden lg:flex items-center gap-1">
              <button
                type="button"
                onClick={() => onModulationChange(0.25)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  modulation < 0.35
                    ? 'bg-[#d4ff32]/20 text-[#d4ff32] border border-[#d4ff32]/40'
                    : 'bg-white/5 text-neutral-400 hover:text-white'
                }`}
              >
                Suave
              </button>
              <button
                type="button"
                onClick={() => onModulationChange(0.55)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  modulation >= 0.35 && modulation <= 0.7
                    ? 'bg-[#d4ff32]/20 text-[#d4ff32] border border-[#d4ff32]/40'
                    : 'bg-white/5 text-neutral-400 hover:text-white'
                }`}
              >
                Natural
              </button>
              <button
                type="button"
                onClick={() => onModulationChange(0.85)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  modulation > 0.7
                    ? 'bg-[#d4ff32]/20 text-[#d4ff32] border border-[#d4ff32]/40'
                    : 'bg-white/5 text-neutral-400 hover:text-white'
                }`}
              >
                Cinemático
              </button>
            </div>

            {/* Slider de alcance */}
            <div className="flex items-center gap-2 flex-1 sm:w-44">
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={modulation}
                onChange={(e) => onModulationChange(parseFloat(e.target.value))}
                className="w-full accent-[#d4ff32] cursor-pointer"
                title="Ajuste o grau de modulação e textura harmônica da voz"
              />
              <span className="font-mono text-[11px] text-[#d4ff32] w-8 text-right">
                {Math.round(modulation * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

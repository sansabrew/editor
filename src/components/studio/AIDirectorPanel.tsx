import React, { useState } from 'react';
import {
  Sparkles,
  Sliders,
  CheckCircle2,
  Volume2,
  Film,
  Zap,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  User,
  Layers,
} from 'lucide-react';
import {
  MultimediaProject,
  AutomationLevel,
  AIDirectorInsights,
} from '../../types';

interface AIDirectorPanelProps {
  project: MultimediaProject;
  onUpdateProject: (project: MultimediaProject) => void;
  onOpenAutoVideo: () => void;
  onShowToast: (msg: string) => void;
}

export const AIDirectorPanel: React.FC<AIDirectorPanelProps> = ({
  project,
  onUpdateProject,
  onOpenAutoVideo,
  onShowToast,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [automationLevel, setAutomationLevel] = useState<AutomationLevel>('diretor');

  // Calculate project metrics
  const sceneCount = project.scenes.length;
  const trackCount = project.tracks.length;
  const hasVoice = project.tracks.some((t) => t.type === 'audio-voice' && t.clips.length > 0);
  const hasBGM = project.tracks.some((t) => t.type === 'audio-bgm' && t.clips.length > 0);
  const hasSFX = project.tracks.some((t) => t.type === 'audio-sfx' && t.clips.length > 0);

  const pacingScore = Math.min(98, 85 + (sceneCount >= 3 ? 10 : 0));
  const continuityScore = Math.min(99, 90 + (hasVoice ? 5 : 0));

  // Auto Ducking & Mix Quick Fix
  const handleAutoMixFix = () => {
    const updatedTracks = project.tracks.map((track) => {
      if (track.type === 'audio-bgm') {
        return {
          ...track,
          volume: 0.3,
          clips: track.clips.map((c) => ({ ...c, volume: 0.3 })),
        };
      }
      if (track.type === 'audio-voice') {
        return {
          ...track,
          volume: 1.0,
          clips: track.clips.map((c) => ({ ...c, volume: 1.0 })),
        };
      }
      if (track.type === 'audio-sfx') {
        return {
          ...track,
          volume: 0.75,
          clips: track.clips.map((c) => ({ ...c, volume: 0.75 })),
        };
      }
      return track;
    });

    onUpdateProject({ ...project, tracks: updatedTracks });
    onShowToast('AI Auto Mix aplicado: ducking da trilha a 30% sob voz principal e SFX calibrados!');
  };

  // Add Transition SFX Quick Fix
  const handleAddTransitionSFX = () => {
    const sfxTrack = project.tracks.find((t) => t.type === 'audio-sfx');
    if (!sfxTrack) return;

    let timeAcc = 0;
    const newSFXClips = project.scenes.map((scene, i) => {
      const clip = {
        id: `clip-sfx-director-${scene.id}`,
        trackId: sfxTrack.id,
        name: i === 0 ? 'Impacto Abertura' : 'Whoosh Transição',
        startTime: timeAcc,
        duration: 1.8,
        mediaType: 'audio' as const,
        volume: 0.7,
        fadeIn: 0.05,
        fadeOut: 0.25,
        color: '#f97316',
      };
      timeAcc += scene.duration;
      return clip;
    });

    const updatedTracks = project.tracks.map((t) =>
      t.id === sfxTrack.id ? { ...t, clips: newSFXClips } : t
    );

    onUpdateProject({ ...project, tracks: updatedTracks });
    onShowToast('Efeitos sonoros cinematográficos posicionados em todas as transições!');
  };

  return (
    <div
      id="ai-director-widget"
      className="bg-[#12141c] border border-white/10 rounded-xl overflow-hidden transition-all shadow-lg"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#171924] border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-[#d4ff32] flex items-center justify-center text-black font-bold text-xs shadow-xs">
            <Sparkles className="w-3 h-3 fill-black" />
          </div>
          <span className="text-xs font-bold text-white tracking-wide">
            IA DIRETOR
          </span>
          <span className="px-1.5 py-0.5 rounded bg-[#d4ff32]/20 text-[#d4ff32] text-[10px] font-mono font-bold uppercase">
            {automationLevel}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenAutoVideo}
            className="px-2 py-0.5 rounded bg-[#d4ff32]/10 hover:bg-[#d4ff32]/20 border border-[#d4ff32]/30 text-[#d4ff32] text-[10px] font-bold transition-colors"
            title="Abrir gerador de vídeo automático"
          >
            Novo Vídeo IA
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded text-neutral-400 hover:text-white"
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="px-3 py-2 flex items-center justify-between text-[11px] text-neutral-300">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="text-neutral-400">Ritmo:</span>
            <span className="text-[#d4ff32] font-mono font-bold">{pacingScore}%</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="text-neutral-400">Continuidade:</span>
            <span className="text-[#d4ff32] font-mono font-bold">{continuityScore}%</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-neutral-400">
          <span>{sceneCount} cenas</span>
          <span>•</span>
          <span>{project.duration.toFixed(1)}s</span>
        </div>
      </div>

      {/* Expanded Director Panel */}
      {isExpanded && (
        <div className="p-3 border-t border-white/5 bg-[#0e1017] space-y-2.5 text-xs animate-fadeIn">
          {/* Automation Level Selection */}
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-neutral-400 font-medium">Modo de Operação:</span>
            <select
              value={automationLevel}
              onChange={(e) => setAutomationLevel(e.target.value as AutomationLevel)}
              className="bg-[#181a24] border border-white/10 text-white rounded px-2 py-0.5 text-[11px] focus:outline-hidden"
            >
              <option value="manual">Manual</option>
              <option value="assistido">Assistido</option>
              <option value="automatico">Automático</option>
              <option value="diretor">Automático + IA Diretor</option>
            </select>
          </div>

          {/* Quick Director Actions */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
              Ações Rápidas do Diretor:
            </span>

            <button
              type="button"
              onClick={handleAutoMixFix}
              className="w-full flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 text-left transition-colors border border-white/5"
            >
              <div className="flex items-center gap-2">
                <Volume2 className="w-3.5 h-3.5 text-[#d4ff32]" />
                <span className="text-[11px] font-medium text-white">AI Auto Mix &amp; Ducking</span>
              </div>
              <span className="text-[10px] text-neutral-400">Ajustar</span>
            </button>

            <button
              type="button"
              onClick={handleAddTransitionSFX}
              className="w-full flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 text-left transition-colors border border-white/5"
            >
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] font-medium text-white">Sincronizar SFX em Transições</span>
              </div>
              <span className="text-[10px] text-neutral-400">Aplicar</span>
            </button>

            <button
              type="button"
              onClick={onOpenAutoVideo}
              className="w-full flex items-center justify-between p-2 rounded-lg bg-[#d4ff32]/10 hover:bg-[#d4ff32]/20 text-left transition-colors border border-[#d4ff32]/30 text-[#d4ff32]"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 fill-[#d4ff32]" />
                <span className="text-[11px] font-bold">Regenerar ou Criar Vídeo Automático</span>
              </div>
              <span className="text-[10px] font-mono">Abrir →</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

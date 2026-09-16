import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Scissors,
  Trash2,
  Copy,
  Plus,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Volume2,
  VolumeX,
  Lock,
  Unlock,
  Layers,
  Sparkles,
  Music,
  Video,
  Mic,
  FileText,
  MousePointer,
  Magnet,
  Eraser,
} from 'lucide-react';
import {
  TimelineTrack,
  TimelineClip,
  EditorTheme,
  StoryboardScene,
} from '../../types';

interface MultitrackTimelineProps {
  tracks: TimelineTrack[];
  currentTime: number;
  totalDuration: number;
  onSeek: (time: number) => void;
  onUpdateTrack: (trackId: string, updates: Partial<TimelineTrack>) => void;
  onSelectClip?: (clip: TimelineClip) => void;
  selectedClipId?: string;
  onSplitClipAtPlayhead?: (clipId: string, splitTime: number) => void;
  onDeleteClip?: (clipId: string) => void;
  onDuplicateClip?: (clipId: string) => void;
  onAddClipToTrack?: (trackId: string) => void;
  onOpenQuickMedia?: (initialTab?: 'upload' | 'ai-generate' | 'stock') => void;
  onClearTimeline?: () => void;
  theme: EditorTheme;
  onShowToast: (msg: string) => void;
}

export const MultitrackTimeline: React.FC<MultitrackTimelineProps> = ({
  tracks,
  currentTime,
  totalDuration,
  onSeek,
  onUpdateTrack,
  onSelectClip,
  selectedClipId,
  onSplitClipAtPlayhead,
  onDeleteClip,
  onDuplicateClip,
  onAddClipToTrack,
  onOpenQuickMedia,
  onClearTimeline,
  theme,
  onShowToast,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(36); // px per second
  const [activeTool, setActiveTool] = useState<'select' | 'split'>('select');
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const rulerRef = useRef<HTMLDivElement>(null);

  // Timeline width based on duration + buffer
  const timelineWidth = Math.max(1200, (totalDuration + 8) * zoomLevel);

  // Generate markers every 1s or 5s depending on zoom
  const stepSeconds = zoomLevel > 50 ? 1 : zoomLevel > 20 ? 2 : 5;
  const markers: number[] = [];
  for (let s = 0; s <= totalDuration + 5; s += stepSeconds) {
    markers.push(s);
  }

  // Find clip at playhead
  const findClipAtPlayhead = (): TimelineClip | null => {
    for (const track of tracks) {
      const found = track.clips.find(
        (c) => currentTime >= c.startTime && currentTime <= c.startTime + c.duration
      );
      if (found) return found;
    }
    return null;
  };

  // Split clip at current playhead
  const handleSplitAtPlayhead = () => {
    const targetClip = tracks
      .flatMap((t) => t.clips)
      .find((c) => c.id === selectedClipId) || findClipAtPlayhead();

    if (!targetClip) {
      onShowToast('Selecione ou posicione o indicador sobre um clipe para cortar.');
      return;
    }

    if (currentTime <= targetClip.startTime || currentTime >= targetClip.startTime + targetClip.duration) {
      onShowToast('O indicador de reprodução deve estar dentro do clipe para cortar.');
      return;
    }

    if (onSplitClipAtPlayhead) {
      onSplitClipAtPlayhead(targetClip.id, currentTime);
      onShowToast(`Clipe "${targetClip.name}" cortado no frame ${currentTime.toFixed(2)}s.`);
    }
  };

  // Delete selected clip
  const handleDeleteSelected = () => {
    if (!selectedClipId) {
      onShowToast('Nenhum clipe selecionado para excluir.');
      return;
    }
    if (onDeleteClip) {
      onDeleteClip(selectedClipId);
      onShowToast('Clipe excluído da trilha.');
    }
  };

  // Duplicate selected clip
  const handleDuplicateSelected = () => {
    if (!selectedClipId) {
      onShowToast('Selecione um clipe para duplicar.');
      return;
    }
    if (onDuplicateClip) {
      onDuplicateClip(selectedClipId);
      onShowToast('Clipe duplicado na linha do tempo.');
    }
  };

  // Handle click or drag on timeline lanes to scrub playhead
  const handleTimelineScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scrollLeft = containerRef.current.scrollLeft;
    const clickX = e.clientX - rect.left + scrollLeft;
    let newTime = Math.max(0, clickX / zoomLevel);
    if (snapToGrid) {
      newTime = Math.round(newTime * 2) / 2; // snap to 0.5s
    }
    newTime = Math.min(totalDuration + 2, newTime);
    onSeek(newTime);
  };

  // Mouse drag scrubbing
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDraggingPlayhead(true);
    handleTimelineScrub(e);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingPlayhead || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const scrollLeft = containerRef.current.scrollLeft;
      const clickX = e.clientX - rect.left + scrollLeft;
      let newTime = Math.max(0, clickX / zoomLevel);
      if (snapToGrid) {
        newTime = Math.round(newTime * 4) / 4; // snap to 0.25s
      }
      newTime = Math.min(totalDuration + 2, newTime);
      onSeek(newTime);
    };

    const handleMouseUp = () => {
      setIsDraggingPlayhead(false);
    };

    if (isDraggingPlayhead) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingPlayhead, zoomLevel, snapToGrid, totalDuration, onSeek]);

  // Track icon helper
  const getTrackIcon = (type: string) => {
    if (type.includes('audio-bgm') || type.includes('audio-sfx')) {
      return <Music className="w-3.5 h-3.5 text-emerald-400" />;
    }
    if (type.includes('audio-voice')) {
      return <Mic className="w-3.5 h-3.5 text-purple-400" />;
    }
    if (type.includes('text')) {
      return <FileText className="w-3.5 h-3.5 text-amber-400" />;
    }
    return <Video className="w-3.5 h-3.5 text-blue-400" />;
  };

  return (
    <div
      id="multitrack-timeline-container"
      className="flex flex-col h-full bg-[#101116] text-neutral-200 select-none border-t border-white/10"
    >
      {/* Top Toolbar: Tools, Zoom, Markers, Snapping */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10 bg-[#14161f] shrink-0 text-xs">
        {/* Left: Tools (Select, Razor Cut, Delete, Duplicate) & Quick Add */}
        <div className="flex items-center gap-1.5">
          {/* Quick Media Upload/Stock Modal */}
          {onOpenQuickMedia && (
            <button
              type="button"
              id="timeline-quick-media-btn"
              onClick={() => onOpenQuickMedia('upload')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#d4ff32] hover:bg-[#bbf438] text-black font-bold text-[11px] shadow-[0_0_10px_rgba(212,255,50,0.3)] transition-all active:scale-95"
              title="Adicionar Vídeos, Imagens ou Áudio com facilidade"
            >
              <Plus className="w-3 h-3 text-black stroke-[3]" />
              <span>+ Mídia</span>
            </button>
          )}

          {/* Quick AI Image Generation */}
          {onOpenQuickMedia && (
            <button
              type="button"
              id="timeline-quick-ai-btn"
              onClick={() => onOpenQuickMedia('ai-generate')}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[#d4ff32] font-semibold text-[11px] border border-[#d4ff32]/30 transition-all active:scale-95"
              title="Gerar Imagem com Inteligência Artificial para a Timeline"
            >
              <Sparkles className="w-3 h-3 fill-[#d4ff32]" />
              <span className="hidden sm:inline">Gerar Imagem IA</span>
            </button>
          )}

          <div className="h-4 w-px bg-white/10 mx-0.5" />

          {/* Select Tool (V) */}
          <button
            type="button"
            onClick={() => setActiveTool('select')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
              activeTool === 'select'
                ? 'bg-[#d4ff32] text-black font-semibold shadow-[0_0_10px_rgba(212,255,50,0.3)]'
                : 'bg-white/5 hover:bg-white/10 text-neutral-300'
            }`}
            title="Ferramenta Seleção (V)"
          >
            <MousePointer className="w-3 h-3" />
            <span className="text-[11px]">Selecionar</span>
          </button>

          {/* Razor / Split Tool (C) */}
          <button
            type="button"
            onClick={() => {
              setActiveTool('split');
              handleSplitAtPlayhead();
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
              activeTool === 'split'
                ? 'bg-[#d4ff32] text-black font-semibold shadow-[0_0_10px_rgba(212,255,50,0.3)]'
                : 'bg-white/5 hover:bg-white/10 text-neutral-300'
            }`}
            title="Cortar no Indicador de Reprodução (C)"
          >
            <Scissors className="w-3 h-3" />
            <span className="text-[11px]">Cortar (C)</span>
          </button>

          {/* Delete Clip */}
          <button
            type="button"
            onClick={handleDeleteSelected}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 transition-colors"
            title="Excluir clipe selecionado (Del)"
          >
            <Trash2 className="w-3 h-3" />
            <span className="text-[11px]">Excluir</span>
          </button>

          {/* Duplicate Clip */}
          <button
            type="button"
            onClick={handleDuplicateSelected}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
            title="Duplicar clipe selecionado"
          >
            <Copy className="w-3 h-3" />
            <span className="text-[11px]">Duplicar</span>
          </button>

          {/* Clear Timeline Action */}
          {onClearTimeline && (
            <button
              type="button"
              id="timeline-clear-btn"
              onClick={() => {
                const totalClips = tracks.reduce((acc, t) => acc + (t.clips?.length || 0), 0);
                if (totalClips === 0) {
                  onShowToast('A linha do tempo já está limpa (0 clipes).');
                  return;
                }
                if (!isConfirmingClear) {
                  setIsConfirmingClear(true);
                  setTimeout(() => setIsConfirmingClear(false), 3500);
                } else {
                  onClearTimeline();
                  setIsConfirmingClear(false);
                }
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
                isConfirmingClear
                  ? 'bg-red-600 text-white font-bold animate-pulse'
                  : 'bg-white/5 hover:bg-red-500/20 text-neutral-400 hover:text-red-400'
              }`}
              title={isConfirmingClear ? 'Clique novamente para confirmar a limpeza' : 'Limpar todos os clipes da linha do tempo'}
            >
              <Eraser className="w-3 h-3" />
              <span className="text-[11px]">
                {isConfirmingClear ? 'Confirmar Limpar?' : 'Limpar Timeline'}
              </span>
            </button>
          )}

          {/* Snap to Grid Toggle */}
          <button
            type="button"
            onClick={() => setSnapToGrid(!snapToGrid)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
              snapToGrid ? 'text-[#d4ff32] bg-[#d4ff32]/10 font-medium' : 'text-neutral-500 hover:text-neutral-300'
            }`}
            title="Ajuste Magnético / Snapping"
          >
            <Magnet className="w-3 h-3" />
            <span className="text-[10px]">Snap</span>
          </button>
        </div>

        {/* Center: Playhead Timecode Badge */}
        <div className="hidden md:flex items-center gap-2 font-mono text-[11px] bg-black/40 px-3 py-0.5 rounded-full border border-white/10">
          <span className="text-[#d4ff32] font-semibold">{currentTime.toFixed(2)}s</span>
          <span className="opacity-40">/</span>
          <span className="text-neutral-400">{totalDuration.toFixed(2)}s</span>
        </div>

        {/* Right: Zoom Level Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(16, z - 8))}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 transition-colors"
            title="Diminuir Zoom (-)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <input
            type="range"
            min="16"
            max="120"
            value={zoomLevel}
            onChange={(e) => setZoomLevel(parseInt(e.target.value))}
            className="w-16 h-1 bg-white/20 accent-[#d4ff32] rounded cursor-pointer"
            title="Ajuste do Zoom da Timeline"
          />

          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(120, z + 8))}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 transition-colors"
            title="Aumentar Zoom (+)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setZoomLevel(36)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
            title="Resetar Zoom Padrão"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Timeline Body (Fixed Headers + Scrollable Lanes) */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Side: Track Headers (Fixed) */}
        <div className="w-48 md:w-56 border-r border-white/10 flex flex-col shrink-0 overflow-y-auto bg-[#13151d] z-20">
          {/* Ruler spacer */}
          <div className="h-7 border-b border-white/10 flex items-center px-3 text-[10px] font-bold uppercase tracking-wider text-neutral-400 bg-[#0e0f14]">
            Trilhas de Edição
          </div>

          {/* Track Rows Info */}
          {tracks.map((track) => (
            <div
              key={track.id}
              className="h-14 border-b border-white/10 px-2.5 flex items-center justify-between text-xs hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2 truncate min-w-0">
                {getTrackIcon(track.type)}
                <div className="truncate">
                  <div className="font-semibold text-neutral-200 truncate text-[11px]">
                    {track.name}
                  </div>
                  <div className="text-[9px] text-neutral-500 font-mono">
                    {track.clips.length} {track.clips.length === 1 ? 'clipe' : 'clipes'}
                  </div>
                </div>
              </div>

              {/* Track Toggles: Mute & Lock */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => onUpdateTrack(track.id, { muted: !track.muted })}
                  className={`p-1 rounded text-[10px] transition-colors ${
                    track.muted
                      ? 'bg-red-500/20 text-red-400 font-bold'
                      : 'text-neutral-500 hover:text-neutral-200'
                  }`}
                  title={track.muted ? 'Desmutar Trilha' : 'Mutar Trilha'}
                >
                  {track.muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateTrack(track.id, { locked: !track.locked })}
                  className={`p-1 rounded text-[10px] transition-colors ${
                    track.locked
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'text-neutral-500 hover:text-neutral-200'
                  }`}
                  title={track.locked ? 'Desbloquear Trilha' : 'Bloquear Trilha'}
                >
                  {track.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Right Side: Horizontal Scrollable Timeline Canvas & Playhead */}
        <div
          ref={containerRef}
          className="flex-1 overflow-x-auto overflow-y-auto relative cursor-pointer"
          onMouseDown={handleMouseDown}
        >
          <div style={{ width: `${timelineWidth}px` }} className="relative h-full min-h-[220px]">
            {/* Time Ruler */}
            <div
              ref={rulerRef}
              className="h-7 border-b border-white/10 bg-[#0f1015] relative flex items-center sticky top-0 z-10"
            >
              {markers.map((sec) => (
                <div
                  key={sec}
                  className="absolute top-0 bottom-0 border-l border-white/15 pl-1.5 text-[9px] font-mono text-neutral-400 flex items-center pointer-events-none"
                  style={{ left: `${sec * zoomLevel}px` }}
                >
                  {sec}s
                </div>
              ))}
            </div>

            {/* Neon Lime Playhead Scrubber Needle */}
            <div
              id="movia-playhead-needle"
              className="absolute top-0 bottom-0 w-[2px] bg-[#d4ff32] shadow-[0_0_12px_rgba(212,255,50,0.8)] z-30 pointer-events-none transition-all duration-75"
              style={{ left: `${currentTime * zoomLevel}px` }}
            >
              {/* Playhead Top Pin */}
              <div className="w-3.5 h-4 bg-[#d4ff32] rounded-b-sm -ml-[6px] shadow-[0_0_10px_rgba(212,255,50,0.8)] flex items-center justify-center text-[7px] text-black font-extrabold cursor-ew-resize">
                ▼
              </div>
            </div>

            {/* Track Lanes with Clips */}
            {tracks.map((track) => (
              <div
                key={track.id}
                className="h-14 border-b border-white/5 relative flex items-center bg-black/20 hover:bg-black/30 transition-colors"
              >
                {/* Clips in this track */}
                {track.clips.map((clip) => {
                  const clipLeft = clip.startTime * zoomLevel;
                  const clipWidth = Math.max(24, clip.duration * zoomLevel);
                  const isSelected = clip.id === selectedClipId;

                  return (
                    <div
                      key={clip.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectClip) onSelectClip(clip);
                      }}
                      className={`absolute h-10 rounded-lg border px-2 flex items-center justify-between text-xs font-medium shadow-md transition-all cursor-pointer select-none overflow-hidden ${
                        isSelected
                          ? 'border-[#d4ff32] ring-2 ring-[#d4ff32]/50 shadow-[0_0_15px_rgba(212,255,50,0.4)] z-20'
                          : 'border-white/15 hover:border-white/30 z-10'
                      }`}
                      style={{
                        left: `${clipLeft}px`,
                        width: `${clipWidth}px`,
                        backgroundColor: clip.color || '#1e293b',
                      }}
                      title={`${clip.name} (${clip.duration.toFixed(1)}s)`}
                    >
                      {/* Left thumbnail or waveform preview icon */}
                      <div className="flex items-center gap-1.5 truncate">
                        {clip.mediaUrl ? (
                          <img
                            src={clip.mediaUrl}
                            alt=""
                            className="w-7 h-7 rounded object-cover shrink-0 border border-white/20"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-4 h-4 rounded bg-white/15 flex items-center justify-center shrink-0">
                            {getTrackIcon(track.type)}
                          </div>
                        )}

                        <div className="truncate min-w-0">
                          <span className="truncate text-white font-medium text-[11px] block">
                            {clip.name}
                          </span>
                          <span className="font-mono text-[9px] text-white/70">
                            {clip.duration.toFixed(1)}s
                          </span>
                        </div>
                      </div>

                      {/* Right Duration Badge */}
                      <div className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-black/50 text-neutral-300 shrink-0 ml-1">
                        {clip.duration.toFixed(1)}s
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

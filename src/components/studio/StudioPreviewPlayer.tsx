import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Sliders,
  Sparkles,
  Eye,
  SkipBack,
  SkipForward,
  Repeat,
  Layers,
  Palette,
  Camera,
} from 'lucide-react';
import {
  StoryboardScene,
  ProjectAspectRatio,
  EditorTheme,
  VideoFilter,
  CameraMotion,
} from '../../types';

interface StudioPreviewPlayerProps {
  activeScene?: StoryboardScene;
  currentTime: number;
  totalDuration: number;
  isPlaying: boolean;
  aspectRatio: ProjectAspectRatio;
  theme: EditorTheme;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onUpdateScene?: (sceneId: string, updates: Partial<StoryboardScene>) => void;
  onShowToast: (msg: string) => void;
}

export const StudioPreviewPlayer: React.FC<StudioPreviewPlayerProps> = ({
  activeScene,
  currentTime,
  totalDuration,
  isPlaying,
  aspectRatio,
  theme,
  onTogglePlay,
  onSeek,
  onUpdateScene,
  onShowToast,
}) => {
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSafeGuides, setShowSafeGuides] = useState(false);
  const [isLooping, setIsLooping] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [activeFilter, setActiveFilter] = useState<VideoFilter>(activeScene?.filter || 'normal');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);

  // Sync scene filter
  useEffect(() => {
    if (activeScene?.filter) {
      setActiveFilter(activeScene.filter);
    }
  }, [activeScene?.filter]);

  // Spacebar play/pause keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        onTogglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onTogglePlay]);

  // Handle Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Step 1 frame (at 30 FPS = ~0.0333s)
  const stepFrame = (forward: boolean) => {
    const delta = forward ? 1 / 30 : -1 / 30;
    const newTime = Math.max(0, Math.min(totalDuration, currentTime + delta));
    onSeek(newTime);
  };

  // Format timecode (MM:SS:FF)
  const formatTimecode = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * 30);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
  };

  // Aspect ratio dimension class
  const getAspectRatioContainerClass = () => {
    switch (aspectRatio) {
      case '9:16':
        return 'aspect-[9/16] max-h-[500px] max-w-[280px]';
      case '1:1':
        return 'aspect-square max-h-[460px] max-w-[460px]';
      case '4:5':
        return 'aspect-[4/5] max-h-[480px] max-w-[384px]';
      case '21:9':
        return 'aspect-[21/9] max-w-[650px]';
      case '16:9':
      default:
        return 'aspect-video max-w-[620px]';
    }
  };

  // Filter CSS filter strings
  const getFilterStyle = (filter: VideoFilter): string => {
    switch (filter) {
      case 'cinematic':
        return 'contrast(1.15) saturate(1.25) brightness(0.95) hue-rotate(-5deg)';
      case 'noir':
        return 'grayscale(1) contrast(1.4) brightness(0.9)';
      case 'cyberpunk':
        return 'contrast(1.3) saturate(1.7) hue-rotate(25deg)';
      case 'warm':
        return 'sepia(0.3) saturate(1.4) brightness(1.05)';
      case 'vivid':
        return 'saturate(1.6) contrast(1.2)';
      case 'vintage':
        return 'sepia(0.5) contrast(0.95) brightness(0.95)';
      case 'normal':
      default:
        return 'none';
    }
  };

  // Compute camera motion transform animation
  const getCameraMotionClass = (motion?: CameraMotion) => {
    if (!isPlaying) return 'scale-100 transition-transform duration-300';
    switch (motion) {
      case 'zoom-in':
        return 'scale-110 transition-transform duration-[5000ms] ease-out';
      case 'zoom-out':
        return 'scale-95 transition-transform duration-[5000ms] ease-out';
      case 'pan-right':
        return 'translate-x-3 scale-105 transition-transform duration-[5000ms] ease-out';
      case 'tilt-up':
        return '-translate-y-3 scale-105 transition-transform duration-[5000ms] ease-out';
      case 'dolly':
        return 'scale-115 -translate-y-1 transition-transform duration-[5000ms] ease-out';
      case 'shake':
        return 'animate-pulse scale-105';
      case 'static':
      default:
        return 'scale-100';
    }
  };

  const handleSelectFilter = (filter: VideoFilter) => {
    setActiveFilter(filter);
    if (activeScene && onUpdateScene) {
      onUpdateScene(activeScene.id, { filter });
    }
    setIsFilterMenuOpen(false);
    onShowToast(`Filtro "${filter}" aplicado à cena.`);
  };

  // Fallback visual imagery if scene has none
  const defaultVisual =
    activeScene?.visualMediaUrl ||
    'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80';

  return (
    <div
      ref={containerRef}
      id="studio-preview-player-container"
      className="flex flex-col items-center justify-center w-full h-full bg-[#0d0e13] p-2 md:p-3 select-none relative overflow-hidden"
    >
      {/* Top Floating Utility Bar */}
      <div className="w-full max-w-2xl flex items-center justify-between px-3 py-1.5 mb-1.5 text-xs text-neutral-300">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#d4ff32] animate-pulse" />
          <span className="font-semibold text-white truncate max-w-[200px]">
            {activeScene ? activeScene.title : 'Sem Cena Selecionada'}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono text-neutral-400">
            {aspectRatio}
          </span>
        </div>

        {/* Filters & Safe Zone Toggles */}
        <div className="flex items-center gap-1.5 relative">
          {/* Safe Guides Toggle */}
          <button
            type="button"
            onClick={() => setShowSafeGuides(!showSafeGuides)}
            className={`p-1.5 rounded-md transition-colors ${
              showSafeGuides ? 'bg-[#d4ff32] text-black font-semibold' : 'bg-white/5 hover:bg-white/10 text-neutral-300'
            }`}
            title="Guias de Enquadramento Seguro (Safe Guides)"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {/* Filter/LUT Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-neutral-300 transition-colors"
              title="Grading e Filtros Cinematográficos"
            >
              <Palette className="w-3.5 h-3.5 text-[#d4ff32]" />
              <span className="capitalize text-[11px] font-medium">{activeFilter}</span>
            </button>

            {isFilterMenuOpen && (
              <div
                className="absolute right-0 mt-1 w-44 rounded-xl bg-[#1a1c24] border border-white/15 shadow-2xl py-1 z-50 text-xs text-neutral-200"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-3 py-1 text-[10px] uppercase font-semibold text-neutral-400 border-b border-white/10">
                  LUTs &amp; Color Grading
                </div>
                {(['normal', 'cinematic', 'cyberpunk', 'noir', 'warm', 'vivid', 'vintage'] as VideoFilter[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => handleSelectFilter(f)}
                    className={`w-full px-3 py-1.5 text-left capitalize hover:bg-white/10 transition-colors flex items-center justify-between ${
                      activeFilter === f ? 'text-[#d4ff32] font-semibold bg-[#d4ff32]/10' : ''
                    }`}
                  >
                    <span>{f}</span>
                    {activeFilter === f && <span className="w-1.5 h-1.5 rounded-full bg-[#d4ff32]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Video Viewport Stage */}
      <div
        id="video-viewport-stage"
        className={`relative w-full ${getAspectRatioContainerClass()} bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10 flex items-center justify-center group`}
      >
        {/* Active Scene Media Frame */}
        <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
          <img
            src={defaultVisual}
            alt={activeScene?.title || 'Preview Frame'}
            style={{ filter: getFilterStyle(activeFilter) }}
            className={`w-full h-full object-cover select-none pointer-events-none ${getCameraMotionClass(
              activeScene?.cameraMotion
            )}`}
            referrerPolicy="no-referrer"
          />

          {/* Vignette Overlay for extra film aesthetic */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_60%,rgba(0,0,0,0.65)_100%)]" />
        </div>

        {/* Safe Zone Guides Overlay */}
        {showSafeGuides && (
          <div className="absolute inset-0 pointer-events-none border border-dashed border-cyan-400/40 m-6 flex items-center justify-center">
            <div className="border border-dashed border-[#d4ff32]/40 w-[85%] h-[85%] flex items-center justify-center">
              <span className="absolute top-2 left-2 text-[9px] font-mono text-[#d4ff32]/80 bg-black/60 px-1 rounded">
                TITLE SAFE 85%
              </span>
              <div className="w-2 h-2 border-t border-l border-white/40" />
            </div>
          </div>
        )}

        {/* Subtitles & Animated Narration Overlay */}
        {activeScene?.narrationText && (
          <div className="absolute bottom-6 left-6 right-6 text-center z-20 pointer-events-none">
            <span className="inline-block px-3.5 py-1.5 rounded-lg bg-black/80 backdrop-blur-md text-white text-xs sm:text-sm font-semibold tracking-wide shadow-xl border border-white/15 max-w-md">
              {activeScene.narrationText}
            </span>
          </div>
        )}

        {/* Big Center Play/Pause Overlay */}
        <button
          type="button"
          onClick={onTogglePlay}
          className={`absolute p-4 rounded-full bg-[#d4ff32] text-black shadow-[0_0_30px_rgba(212,255,50,0.4)] transition-all transform z-30 ${
            isPlaying ? 'opacity-0 group-hover:opacity-80 scale-95 group-hover:scale-100' : 'opacity-90 scale-100 hover:scale-105'
          }`}
          title={isPlaying ? 'Pausar (Espaço)' : 'Reproduzir (Espaço)'}
        >
          {isPlaying ? <Pause className="w-6 h-6 fill-black" /> : <Play className="w-6 h-6 fill-black ml-0.5" />}
        </button>

        {/* Camera Motion Badge */}
        {activeScene?.cameraMotion && activeScene.cameraMotion !== 'static' && (
          <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-xs text-[10px] text-white font-medium border border-white/10 flex items-center gap-1 z-20">
            <Camera className="w-3 h-3 text-[#d4ff32]" />
            <span className="capitalize">{activeScene.cameraMotion}</span>
          </div>
        )}

        {/* Transition Badge */}
        {activeScene?.transition && activeScene.transition !== 'cut' && (
          <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-xs text-[10px] text-[#d4ff32] font-semibold border border-[#d4ff32]/30 uppercase z-20">
            {activeScene.transition}
          </div>
        )}
      </div>

      {/* Video Transport Controls Bar */}
      <div className="w-full max-w-2xl mt-2 px-3 py-2 rounded-xl bg-[#14161d] border border-white/10 text-xs text-neutral-200 flex flex-wrap items-center justify-between gap-2 shadow-lg">
        {/* Left: Play/Pause, Steps, Timecode */}
        <div className="flex items-center gap-2">
          {/* Rewind */}
          <button
            type="button"
            onClick={() => onSeek(0)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-300 hover:text-white transition-colors"
            title="Voltar ao início"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Step Back 1 Frame */}
          <button
            type="button"
            onClick={() => stepFrame(false)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-300 hover:text-white transition-colors"
            title="Recuar 1 frame (30fps)"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          {/* Play / Pause Toggle */}
          <button
            type="button"
            onClick={onTogglePlay}
            className="p-2 rounded-lg bg-[#d4ff32] hover:bg-[#bbf438] text-black font-semibold transition-all shadow-[0_0_12px_rgba(212,255,50,0.25)]"
            title={isPlaying ? 'Pausar (Espaço)' : 'Reproduzir (Espaço)'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black ml-0.5" />}
          </button>

          {/* Step Forward 1 Frame */}
          <button
            type="button"
            onClick={() => stepFrame(true)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-300 hover:text-white transition-colors"
            title="Avançar 1 frame (30fps)"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          {/* Timecode */}
          <div className="font-mono text-xs text-neutral-300 ml-1">
            <span className="text-white font-semibold">{formatTimecode(currentTime)}</span>
            <span className="opacity-40 mx-1">/</span>
            <span className="opacity-70">{formatTimecode(totalDuration)}</span>
          </div>
        </div>

        {/* Right: Speed, Loop, Volume, Fullscreen */}
        <div className="flex items-center gap-2">
          {/* Playback Speed */}
          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
            className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[11px] text-neutral-300 font-mono outline-hidden cursor-pointer"
            title="Velocidade de reprodução"
          >
            <option value="0.5">0.5x</option>
            <option value="1">1.0x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2.0x</option>
          </select>

          {/* Loop Toggle */}
          <button
            type="button"
            onClick={() => setIsLooping(!isLooping)}
            className={`p-1.5 rounded-lg transition-colors ${
              isLooping ? 'text-[#d4ff32] bg-[#d4ff32]/10' : 'text-neutral-400 hover:text-white'
            }`}
            title={isLooping ? 'Repetição Ativada' : 'Repetição Desativada'}
          >
            <Repeat className="w-3.5 h-3.5" />
          </button>

          {/* Volume Control */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-300 hover:text-white transition-colors"
              title={isMuted ? 'Desmutar Áudio' : 'Mutar Áudio'}
            >
              {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                if (isMuted) setIsMuted(false);
              }}
              className="w-14 h-1 bg-white/20 accent-[#d4ff32] rounded cursor-pointer"
              title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
            />
          </div>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-300 hover:text-white transition-colors"
            title={isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  StoryboardScene,
  EditorTheme,
  VisualStyle,
  SceneTransition,
  CameraMotion,
} from '../../types';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Volume2,
  Video,
  Image as ImageIcon,
  Clock,
  ArrowRight,
  Move,
  Film,
} from 'lucide-react';
import { playNarrationPreview } from '../../utils/audioGenerator';

interface ScenesDeckProps {
  scenes: StoryboardScene[];
  activeSceneId: string;
  onSelectScene: (sceneId: string) => void;
  onUpdateScene: (sceneId: string, updates: Partial<StoryboardScene>) => void;
  onAddScene: () => void;
  onDeleteScene: (sceneId: string) => void;
  onReorderScenes: (fromIndex: number, toIndex: number) => void;
  onOpenMediaGenerator: (scene: StoryboardScene) => void;
  onOpenQuickMedia?: (scene: StoryboardScene) => void;
  onOpenScriptVoice?: () => void;
  theme: EditorTheme;
  onShowToast: (msg: string) => void;
}

export const ScenesDeck: React.FC<ScenesDeckProps> = ({
  scenes,
  activeSceneId,
  onSelectScene,
  onUpdateScene,
  onAddScene,
  onDeleteScene,
  onReorderScenes,
  onOpenMediaGenerator,
  onOpenQuickMedia,
  onOpenScriptVoice,
  theme,
  onShowToast,
}) => {
  const [playingSceneVoice, setPlayingSceneVoice] = useState<string | null>(null);

  const isDark = theme === 'dark';

  const handlePlayVoice = async (scene: StoryboardScene, e: React.MouseEvent) => {
    e.stopPropagation();
    if (playingSceneVoice === scene.id) {
      window.speechSynthesis?.cancel();
      setPlayingSceneVoice(null);
      return;
    }
    setPlayingSceneVoice(scene.id);
    try {
      await playNarrationPreview(scene.narrationText);
    } finally {
      setPlayingSceneVoice(null);
    }
  };

  return (
    <div
      id="scenes-deck-container"
      className="flex flex-col h-full overflow-hidden text-xs bg-[#0e1017] text-neutral-200"
    >
      {/* Deck Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 shrink-0 bg-[#13151f]">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-[#d4ff32]" />
          <span className="font-bold text-sm text-white">Storyboard &amp; Cenas</span>
          <span className="px-1.5 py-0.5 rounded-full bg-[#d4ff32]/15 text-[#d4ff32] font-mono text-[10px] font-bold">
            {scenes.length} {scenes.length === 1 ? 'cena' : 'cenas'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {onOpenScriptVoice && (
            <button
              type="button"
              id="deck-script-voice-btn"
              onClick={onOpenScriptVoice}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-neutral-200 hover:text-white font-medium transition-colors text-[11px]"
              title="Assistente de Roteiro e Narração com Voz IA"
            >
              <Volume2 className="w-3.5 h-3.5 text-[#d4ff32]" />
              <span className="hidden sm:inline">Roteiro &amp; Voz</span>
            </button>
          )}

          <button
            type="button"
            id="add-scene-deck-btn"
            onClick={onAddScene}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#d4ff32] hover:bg-[#bbf438] text-black font-extrabold shadow-xs transition-colors text-[11px]"
          >
            <Plus className="w-3.5 h-3.5 text-black stroke-[2.5]" />
            <span>Nova Cena</span>
          </button>
        </div>
      </div>

      {/* Scenes List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {scenes.map((scene, index) => {
          const isActive = scene.id === activeSceneId;

          return (
            <div
              key={scene.id}
              id={`scene-card-${scene.id}`}
              onClick={() => onSelectScene(scene.id)}
              className={`rounded-xl border transition-all cursor-pointer overflow-hidden ${
                isActive
                  ? 'border-[#d4ff32] ring-1 ring-[#d4ff32]/50 shadow-md bg-[#d4ff32]/5'
                  : 'border-white/10 hover:border-white/25 bg-[#141620]'
              }`}
            >
              {/* Scene Card Top Bar */}
              <div className="flex items-center justify-between px-3 py-1.5 bg-inherit/15 border-b border-inherit/10">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono font-bold text-blue-400">#{index + 1}</span>
                  <input
                    type="text"
                    value={scene.title}
                    onChange={(e) => onUpdateScene(scene.id, { title: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                    className="font-medium bg-transparent border-b border-transparent hover:border-inherit/30 focus:border-blue-500 focus:outline-hidden px-1 truncate max-w-[150px] sm:max-w-xs"
                  />
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Duration input */}
                  <div
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-inherit/20"
                    title="Duração da cena em segundos"
                  >
                    <Clock className="w-3 h-3 text-neutral-400" />
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={scene.duration}
                      onChange={(e) =>
                        onUpdateScene(scene.id, { duration: Math.max(1, Number(e.target.value)) })
                      }
                      onClick={(e) => e.stopPropagation()}
                      className="w-8 font-mono text-center bg-transparent border-none focus:outline-hidden"
                    />
                    <span className="text-[10px] opacity-70">s</span>
                  </div>

                  {/* Move Up / Down */}
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onReorderScenes(index, index - 1);
                    }}
                    className="p-1 rounded-sm hover:bg-inherit/20 disabled:opacity-30"
                    title="Mover cena para cima"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    disabled={index === scenes.length - 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      onReorderScenes(index, index + 1);
                    }}
                    className="p-1 rounded-sm hover:bg-inherit/20 disabled:opacity-30"
                    title="Mover cena para baixo"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete Scene */}
                  {scenes.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteScene(scene.id);
                      }}
                      className="p-1 rounded-sm text-red-400 hover:bg-red-500/10"
                      title="Excluir Cena"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Scene Card Body */}
              <div className="p-3 space-y-2.5">
                {/* Media Preview Thumbnail & Visual Prompt */}
                <div className="flex gap-2.5">
                  <div className="flex flex-col gap-1 shrink-0">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenQuickMedia) {
                          onOpenQuickMedia(scene);
                        } else {
                          onOpenMediaGenerator(scene);
                        }
                      }}
                      className="relative w-24 h-16 rounded-lg overflow-hidden bg-neutral-900 border border-white/15 shrink-0 group flex items-center justify-center cursor-pointer shadow-xs"
                      title="Clique para trocar imagem, fazer upload ou gerar com IA"
                    >
                      {scene.visualMediaUrl ? (
                        <img
                          src={scene.visualMediaUrl}
                          alt={scene.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex flex-col items-center text-neutral-400">
                          <ImageIcon className="w-5 h-5 opacity-60" />
                          <span className="text-[9px] mt-0.5">Sem Mídia</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-[10px] text-white font-medium gap-1">
                        <Sparkles className="w-3 h-3 text-[#d4ff32]" />
                        <span>Trocar</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenQuickMedia) {
                          onOpenQuickMedia(scene);
                        } else {
                          onOpenMediaGenerator(scene);
                        }
                      }}
                      className="text-[9px] font-semibold text-[#d4ff32] hover:underline flex items-center justify-center gap-0.5 py-0.5"
                    >
                      <span>+ Trocar Mídia</span>
                    </button>
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-[11px] opacity-75">Visual:</span>
                      <select
                        value={scene.visualStyle}
                        onChange={(e) =>
                          onUpdateScene(scene.id, {
                            visualStyle: e.target.value as VisualStyle,
                          })
                        }
                        onClick={(e) => e.stopPropagation()}
                        className="text-[10px] px-1.5 py-0.5 rounded-sm bg-inherit/20 border border-inherit/20 focus:outline-hidden"
                      >
                        <option value="cinematic">Cinemático</option>
                        <option value="concept-art">Concept Art</option>
                        <option value="anime">Anime</option>
                        <option value="photorealistic">Fotorrealista</option>
                        <option value="3d-render">3D Render</option>
                      </select>

                      <select
                        value={scene.cameraMotion || 'static'}
                        onChange={(e) =>
                          onUpdateScene(scene.id, {
                            cameraMotion: e.target.value as CameraMotion,
                          })
                        }
                        onClick={(e) => e.stopPropagation()}
                        className="text-[10px] px-1.5 py-0.5 rounded-sm bg-inherit/20 border border-inherit/20 focus:outline-hidden"
                      >
                        <option value="static">Câmera Fixa</option>
                        <option value="zoom-in">Zoom In</option>
                        <option value="zoom-out">Zoom Out</option>
                        <option value="pan-right">Pan Panorâmico</option>
                        <option value="tilt-up">Tilt Vertical</option>
                      </select>
                    </div>

                    <textarea
                      value={scene.visualPrompt}
                      onChange={(e) => onUpdateScene(scene.id, { visualPrompt: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                      rows={2}
                      placeholder="Descrição visual da cena..."
                      className="w-full text-xs p-1.5 rounded-md border border-inherit/15 bg-inherit/5 focus:outline-hidden focus:ring-1 focus:ring-blue-500 resize-none"
                    />
                  </div>
                </div>

                {/* Narration and SFX */}
                <div className="space-y-1.5 pt-1.5 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-[#d4ff32]" />
                      <span className="font-semibold text-[11px] text-neutral-300">
                        Narração / Fala:
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handlePlayVoice(scene, e)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 text-[#d4ff32] hover:bg-white/20 text-[10px] font-semibold transition-colors"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>{playingSceneVoice === scene.id ? 'Parar' : 'Ouvir'}</span>
                    </button>
                  </div>

                  <input
                    type="text"
                    value={scene.narrationText}
                    onChange={(e) => onUpdateScene(scene.id, { narrationText: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Texto narrado na cena..."
                    className="w-full text-xs px-2 py-1.5 rounded-md border border-white/10 bg-black/40 text-white focus:outline-hidden focus:border-[#d4ff32]"
                  />
                </div>

                {/* Transition & SFX Trigger */}
                <div className="flex items-center justify-between text-[10px] pt-1 opacity-80">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium">SFX:</span>
                    <input
                      type="text"
                      value={scene.sfxPrompt || ''}
                      onChange={(e) => onUpdateScene(scene.id, { sfxPrompt: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Ex: whoosh rápido..."
                      className="w-28 px-1 py-0.5 bg-transparent border-b border-inherit/20 focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="font-medium">Transição:</span>
                    <select
                      value={scene.transition}
                      onChange={(e) =>
                        onUpdateScene(scene.id, {
                          transition: e.target.value as SceneTransition,
                        })
                      }
                      onClick={(e) => e.stopPropagation()}
                      className="px-1 py-0.5 rounded-sm bg-inherit/20 border border-inherit/20 focus:outline-hidden"
                    >
                      <option value="cut">Corte Direto</option>
                      <option value="crossfade">Fusão (Crossfade)</option>
                      <option value="fade-black">Fade Preto</option>
                      <option value="wipe">Wipe</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

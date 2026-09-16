import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MultimediaProject,
  StoryboardScene,
  TimelineTrack,
  TimelineClip,
  MediaAsset,
  UserProfile,
  EditorTheme,
  ProjectAspectRatio,
} from '../../types';
import { StudioPreviewPlayer } from './StudioPreviewPlayer';
import { MultitrackTimeline } from './MultitrackTimeline';
import { ScenesDeck } from './ScenesDeck';
import { AudioStudioPanel } from './AudioStudioPanel';
import { ImageVideoGenPanel } from './ImageVideoGenPanel';
import { MediaVaultPanel } from './MediaVaultPanel';
import { ExportStudioModal } from './ExportStudioModal';
import { AuthQuotaModal } from './AuthQuotaModal';
import { ProjectManagerModal } from './ProjectManagerModal';
import { TemplatesModal } from './TemplatesModal';
import { QuickMediaInsertModal } from './QuickMediaInsertModal';
import { ScriptAndVoiceModal } from './ScriptAndVoiceModal';
import { AIAutoVideoModal } from './AIAutoVideoModal';
import { AIDirectorPanel } from './AIDirectorPanel';
import {
  Film,
  Music,
  Video,
  HardDrive,
  Download,
  FolderKanban,
  User,
  RefreshCw,
  Sparkles,
  Layers,
  FileText,
  Sliders,
  Ratio,
  Plus,
} from 'lucide-react';
import {
  createDefaultTracksFromScenes,
  scenesToScript,
} from '../../utils/scriptConverter';
import { getAudioContext } from '../../utils/audioGenerator';

interface StudioWorkspaceProps {
  project: MultimediaProject;
  allProjects: MultimediaProject[];
  onUpdateProject: (updated: MultimediaProject) => void;
  onSelectProject: (projectId: string) => void;
  onCreateProject: (title: string, aspectRatio: ProjectAspectRatio, cleanTimeline?: boolean) => void;
  onDuplicateProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  assets: MediaAsset[];
  onAddAsset: (asset: MediaAsset) => void;
  onDeleteAsset: (assetId: string) => void;
  user: UserProfile;
  onUpdateUser: (updates: Partial<UserProfile>) => void;
  theme: EditorTheme;
  onSyncToEditorScript: (scriptContent: string) => void;
  onShowToast: (msg: string) => void;
  activeStudioTab?: 'scenes' | 'audio' | 'visual' | 'vault';
  onSetStudioTab?: (tab: 'scenes' | 'audio' | 'visual' | 'vault') => void;
  isExportOpen?: boolean;
  onSetExportOpen?: (open: boolean) => void;
  isTemplatesOpen?: boolean;
  onSetTemplatesOpen?: (open: boolean) => void;
  isScriptVoiceOpen?: boolean;
  onSetScriptVoiceOpen?: (open: boolean) => void;
  isAutoVideoOpen?: boolean;
  onSetAutoVideoOpen?: (open: boolean) => void;
}

export const StudioWorkspace: React.FC<StudioWorkspaceProps> = ({
  project,
  allProjects,
  onUpdateProject,
  onSelectProject,
  onCreateProject,
  onDuplicateProject,
  onDeleteProject,
  assets,
  onAddAsset,
  onDeleteAsset,
  user,
  onUpdateUser,
  theme,
  onSyncToEditorScript,
  onShowToast,
  activeStudioTab: propActiveStudioTab,
  onSetStudioTab: propOnSetStudioTab,
  isExportOpen: propIsExportOpen,
  onSetExportOpen: propOnSetExportOpen,
  isTemplatesOpen: propIsTemplatesOpen,
  onSetTemplatesOpen: propOnSetTemplatesOpen,
  isScriptVoiceOpen: propIsScriptVoiceOpen,
  onSetScriptVoiceOpen: propOnSetScriptVoiceOpen,
  isAutoVideoOpen: propIsAutoVideoOpen,
  onSetAutoVideoOpen: propOnSetAutoVideoOpen,
}) => {
  // Navigation for right tab inside studio
  const [internalRightTab, setInternalRightTab] = useState<'scenes' | 'audio' | 'visual' | 'vault'>('scenes');
  const activeRightTab = propActiveStudioTab || internalRightTab;
  const setActiveRightTab = (tab: 'scenes' | 'audio' | 'visual' | 'vault') => {
    if (propOnSetStudioTab) propOnSetStudioTab(tab);
    setInternalRightTab(tab);
  };

  // Modals state
  const [internalExportOpen, setInternalExportOpen] = useState(false);
  const isExportOpen = propIsExportOpen !== undefined ? propIsExportOpen : internalExportOpen;
  const setIsExportOpen = (open: boolean) => {
    if (propOnSetExportOpen) propOnSetExportOpen(open);
    setInternalExportOpen(open);
  };

  // Templates Modal state
  const [internalTemplatesOpen, setInternalTemplatesOpen] = useState(false);
  const isTemplatesOpen = propIsTemplatesOpen !== undefined ? propIsTemplatesOpen : internalTemplatesOpen;
  const setIsTemplatesOpen = (open: boolean) => {
    if (propOnSetTemplatesOpen) propOnSetTemplatesOpen(open);
    setInternalTemplatesOpen(open);
  };

  // Script and Voice Modal state
  const [internalScriptVoiceOpen, setInternalScriptVoiceOpen] = useState(false);
  const isScriptVoiceOpen = propIsScriptVoiceOpen !== undefined ? propIsScriptVoiceOpen : internalScriptVoiceOpen;
  const setIsScriptVoiceOpen = (open: boolean) => {
    if (propOnSetScriptVoiceOpen) propOnSetScriptVoiceOpen(open);
    setInternalScriptVoiceOpen(open);
  };

  // AI Auto Video Modal state
  const [internalAutoVideoOpen, setInternalAutoVideoOpen] = useState(false);
  const isAutoVideoOpen = propIsAutoVideoOpen !== undefined ? propIsAutoVideoOpen : internalAutoVideoOpen;
  const setIsAutoVideoOpen = (open: boolean) => {
    if (propOnSetAutoVideoOpen) propOnSetAutoVideoOpen(open);
    setInternalAutoVideoOpen(open);
  };

  // Quick Media Insert Modal state
  const [isQuickMediaOpen, setIsQuickMediaOpen] = useState(false);
  const [quickMediaInitialTab, setQuickMediaInitialTab] = useState<'upload' | 'ai-generate' | 'stock'>('upload');
  const [quickMediaTargetScene, setQuickMediaTargetScene] = useState<StoryboardScene | undefined>(undefined);

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false);

  // Playback state
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSceneId, setActiveSceneId] = useState<string>(
    project.scenes[0]?.id || ''
  );
  const [selectedClipId, setSelectedClipId] = useState<string | undefined>(undefined);

  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Audio synthesizer oscillator ref for live preview soundtrack
  const synthNodesRef = useRef<{ osc1: OscillatorNode; osc2: OscillatorNode; gain: GainNode } | null>(null);

  // Calculate project total duration
  const totalDuration = project.scenes.reduce((acc, s) => acc + (s.duration || 5), 0);

  // Synchronize activeSceneId when currentTime changes
  useEffect(() => {
    let accumulated = 0;
    for (const scene of project.scenes) {
      const dur = scene.duration || 5;
      if (currentTime >= accumulated && currentTime < accumulated + dur) {
        if (activeSceneId !== scene.id) {
          setActiveSceneId(scene.id);
        }
        break;
      }
      accumulated += dur;
    }
  }, [currentTime, project.scenes, activeSceneId]);

  // Update scenes and sync tracks automatically
  const handleUpdateScenes = useCallback(
    (newScenes: StoryboardScene[]) => {
      const newDuration = newScenes.reduce((acc, s) => acc + (s.duration || 5), 0);
      const newTracks = createDefaultTracksFromScenes(newScenes);
      onUpdateProject({
        ...project,
        scenes: newScenes,
        duration: newDuration,
        tracks: newTracks,
        updatedAt: Date.now(),
      });
    },
    [project, onUpdateProject]
  );

  // Update single scene
  const handleUpdateScene = useCallback(
    (sceneId: string, updates: Partial<StoryboardScene>) => {
      const newScenes = project.scenes.map((s) =>
        s.id === sceneId ? { ...s, ...updates } : s
      );
      handleUpdateScenes(newScenes);
    },
    [project.scenes, handleUpdateScenes]
  );

  // Add new scene
  const handleAddScene = useCallback(() => {
    const newSceneNum = project.scenes.length + 1;
    const newScene: StoryboardScene = {
      id: `scene-${Date.now()}-${newSceneNum}`,
      order: newSceneNum,
      title: `Cena ${newSceneNum}: Nova Tomada`,
      duration: 5,
      visualPrompt: 'Cena cinematográfica com iluminação atmosférica contrastada e detalhes ultra-nítidos.',
      visualStyle: 'cinematic',
      visualMediaType: 'image',
      visualMediaUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
      narrationText: `Narração gravada para a tomada ${newSceneNum}.`,
      voiceId: 'pt-BR-natural',
      transition: 'crossfade',
      cameraMotion: 'zoom-in',
      filter: 'cinematic',
    };
    handleUpdateScenes([...project.scenes, newScene]);
    setActiveSceneId(newScene.id);
    onShowToast(`Cena ${newSceneNum} adicionada ao Storyboard!`);
  }, [project.scenes, handleUpdateScenes, onShowToast]);

  // Delete scene
  const handleDeleteScene = useCallback(
    (sceneId: string) => {
      if (project.scenes.length <= 1) {
        onShowToast('O projeto precisa ter pelo menos 1 cena.');
        return;
      }
      const remaining = project.scenes.filter((s) => s.id !== sceneId);
      handleUpdateScenes(remaining);
      if (sceneId === activeSceneId) {
        setActiveSceneId(remaining[0].id);
      }
      onShowToast('Cena removida com sucesso.');
    },
    [project.scenes, activeSceneId, handleUpdateScenes, onShowToast]
  );

  // Reorder scenes
  const handleReorderScenes = useCallback(
    (fromIdx: number, toIdx: number) => {
      if (toIdx < 0 || toIdx >= project.scenes.length) return;
      const copy = [...project.scenes];
      const [moved] = copy.splice(fromIdx, 1);
      copy.splice(toIdx, 0, moved);
      const reindexed = copy.map((s, i) => ({ ...s, order: i + 1 }));
      handleUpdateScenes(reindexed);
    },
    [project.scenes, handleUpdateScenes]
  );

  // Split clip at playhead
  const handleSplitClip = (clipId: string, splitTime: number) => {
    const updatedTracks = project.tracks.map((track) => {
      const clipIndex = track.clips.findIndex((c) => c.id === clipId);
      if (clipIndex === -1) return track;

      const target = track.clips[clipIndex];
      const originalEnd = target.startTime + target.duration;
      if (splitTime <= target.startTime || splitTime >= originalEnd) return track;

      const firstPartDuration = splitTime - target.startTime;
      const secondPartDuration = originalEnd - splitTime;

      const clipPart1: TimelineClip = {
        ...target,
        duration: firstPartDuration,
      };

      const clipPart2: TimelineClip = {
        ...target,
        id: `clip-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: `${target.name} (Parte 2)`,
        startTime: splitTime,
        duration: secondPartDuration,
      };

      const newClips = [...track.clips];
      newClips.splice(clipIndex, 1, clipPart1, clipPart2);
      return { ...track, clips: newClips };
    });

    onUpdateProject({ ...project, tracks: updatedTracks });
  };

  // Delete clip from timeline
  const handleDeleteClip = (clipId: string) => {
    const updatedTracks = project.tracks.map((track) => ({
      ...track,
      clips: track.clips.filter((c) => c.id !== clipId),
    }));
    setSelectedClipId(undefined);
    onUpdateProject({ ...project, tracks: updatedTracks });
  };

  // Duplicate clip on timeline
  const handleDuplicateClip = (clipId: string) => {
    let duplicated = false;
    const updatedTracks = project.tracks.map((track) => {
      const clip = track.clips.find((c) => c.id === clipId);
      if (!clip) return track;

      const newClip: TimelineClip = {
        ...clip,
        id: `clip-${Date.now()}`,
        name: `${clip.name} (Cópia)`,
        startTime: clip.startTime + clip.duration,
      };
      duplicated = true;
      return { ...track, clips: [...track.clips, newClip] };
    });

    if (duplicated) {
      onUpdateProject({ ...project, tracks: updatedTracks });
    }
  };

  // Live synthesizer sound loop during playback
  useEffect(() => {
    if (isPlaying) {
      try {
        const ctx = getAudioContext();
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sawtooth';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(110, ctx.currentTime); // A2
        osc2.frequency.setValueAtTime(220, ctx.currentTime); // A3

        gain.gain.setValueAtTime(0.001, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.3);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start();
        osc2.start();
        synthNodesRef.current = { osc1, osc2, gain };
      } catch {
        // AudioContext may be restricted until user interaction
      }
    } else {
      if (synthNodesRef.current) {
        try {
          synthNodesRef.current.osc1.stop();
          synthNodesRef.current.osc2.stop();
          synthNodesRef.current.osc1.disconnect();
          synthNodesRef.current.osc2.disconnect();
          synthNodesRef.current.gain.disconnect();
        } catch {
          // ignore
        }
        synthNodesRef.current = null;
      }
    }

    return () => {
      if (synthNodesRef.current) {
        try {
          synthNodesRef.current.osc1.stop();
          synthNodesRef.current.osc2.stop();
        } catch {}
        synthNodesRef.current = null;
      }
    };
  }, [isPlaying]);

  // Playback Loop using requestAnimationFrame
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    lastTimeRef.current = performance.now();

    const loop = (now: number) => {
      const deltaSec = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      setCurrentTime((prev) => {
        const next = prev + deltaSec;
        if (next >= totalDuration) {
          setIsPlaying(false);
          return 0; // Rewind at end
        }
        return next;
      });

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, totalDuration]);

  // Seek handler
  const handleSeek = (time: number) => {
    setCurrentTime(time);
  };

  // Rewind handler
  const handleRewind = () => {
    setCurrentTime(0);
  };

  // Play / Pause toggle
  const handleTogglePlay = () => {
    setIsPlaying((p) => !p);
  };

  // Sync back to editor script
  const handleSyncScript = () => {
    const markdown = scenesToScript(project.scenes, project.title);
    onSyncToEditorScript(markdown);
    onShowToast('Roteiro sincronizado com o Editor!');
  };

  // Handle media generation application to active scene
  const handleApplyMediaToActiveScene = (mediaUrl: string, mediaType: 'image' | 'video') => {
    if (!activeSceneId) return;
    handleUpdateScene(activeSceneId, {
      visualMediaUrl: mediaUrl,
      visualMediaType: mediaType,
    });
    onShowToast('Mídia aplicada à cena ativa com sucesso!');
  };

  // Handle inserting clip from asset to timeline
  const handleInsertClipToTimeline = (trackType: string, asset: MediaAsset) => {
    const updatedTracks = project.tracks.map((track) => {
      if (track.type === trackType) {
        const newClip: TimelineClip = {
          id: `clip-${Date.now()}`,
          trackId: track.id,
          name: asset.title,
          startTime: currentTime,
          duration: asset.duration || 5,
          mediaUrl: asset.url,
          mediaType: asset.type.startsWith('audio') ? 'audio' : 'image',
          volume: 0.9,
          color: trackType === 'audio-bgm' ? '#8b5cf6' : trackType === 'audio-sfx' ? '#f97316' : '#10b981',
        };
        return { ...track, clips: [...track.clips, newClip] };
      }
      return track;
    });

    onUpdateProject({ ...project, tracks: updatedTracks });
    onShowToast(`Clipe "${asset.title}" inserido na linha do tempo!`);
  };

  // Open quick media modal helper
  const handleOpenQuickMedia = (tab: 'upload' | 'ai-generate' | 'stock' = 'upload', targetScene?: StoryboardScene) => {
    setQuickMediaInitialTab(tab);
    setQuickMediaTargetScene(targetScene);
    setIsQuickMediaOpen(true);
  };

  // Insert media directly from QuickMediaInsertModal to timeline
  const handleQuickMediaInsertToTimeline = (mediaUrl: string, mediaType: 'image' | 'video', title: string) => {
    const mainTrack = project.tracks.find((t) => t.type === 'video-main') || project.tracks[0];
    const targetTrackId = mainTrack ? mainTrack.id : project.tracks[0]?.id;

    if (!targetTrackId) return;

    const newClip: TimelineClip = {
      id: `clip-${Date.now()}`,
      trackId: targetTrackId,
      name: title,
      startTime: currentTime,
      duration: 5,
      mediaUrl,
      mediaType,
      volume: 1,
      color: '#d4ff32',
    };

    const updatedTracks = project.tracks.map((track) =>
      track.id === targetTrackId ? { ...track, clips: [...track.clips, newClip] } : track
    );

    onUpdateProject({ ...project, tracks: updatedTracks });

    // Also register in vault
    onAddAsset({
      id: `asset-${Date.now()}`,
      title,
      type: mediaType,
      url: mediaUrl,
      duration: 5,
      createdAt: Date.now(),
      tags: ['inserido', 'projeto', 'timeline'],
    });

    onShowToast(`Mídia "${title}" adicionada à linha do tempo!`);
  };

  // Apply media from QuickMediaInsertModal to target scene
  const handleQuickMediaApplyToScene = (sceneId: string, mediaUrl: string, mediaType: 'image' | 'video') => {
    handleUpdateScene(sceneId, {
      visualMediaUrl: mediaUrl,
      visualMediaType: mediaType,
    });
    onShowToast('Mídia aplicada à cena do storyboard!');
  };

  // Apply template selected in TemplatesModal
  const handleApplyTemplate = (newProject: MultimediaProject) => {
    onSelectProject(newProject.id);
    onUpdateProject(newProject);
    setIsTemplatesOpen(false);
    onShowToast(`Modelo "${newProject.title}" pronto para edição!`);
  };

  // Clear entire timeline clips
  const handleClearTimeline = useCallback(() => {
    const cleanTracks = project.tracks.map((track) => ({ ...track, clips: [] }));
    onUpdateProject({
      ...project,
      tracks: cleanTracks,
      updatedAt: Date.now(),
    });
    setSelectedClipId(undefined);
    onShowToast('Linha do tempo limpa com sucesso!');
  }, [project, onUpdateProject, onShowToast]);

  // Synchronize voice clips from ScriptAndVoiceModal to timeline
  const handleSyncVoiceClips = (voiceClips: TimelineClip[]) => {
    const existingVoiceTrack = project.tracks.find((t) => t.type === 'audio-voice');
    let newTracks: TimelineTrack[] = [...project.tracks];

    if (!existingVoiceTrack) {
      const newVoiceTrack: TimelineTrack = {
        id: `track-voice-${Date.now()}`,
        name: 'Voz & Narração IA',
        type: 'audio-voice',
        muted: false,
        solo: false,
        locked: false,
        volume: 1,
        clips: voiceClips,
      };
      newTracks.push(newVoiceTrack);
    } else {
      newTracks = newTracks.map((t) =>
        t.id === existingVoiceTrack.id ? { ...t, clips: voiceClips } : t
      );
    }

    onUpdateProject({ ...project, tracks: newTracks });
    onShowToast(`${voiceClips.length} clipes de narração inseridos na linha do tempo!`);
  };

  const activeScene = project.scenes.find((s) => s.id === activeSceneId) || project.scenes[0];

  return (
    <div
      id="studio-workspace-container"
      className="flex flex-col flex-1 overflow-hidden relative bg-[#0b0c10] text-neutral-100 select-none"
    >
      {/* Top Workspace Subheader */}
      <div className="flex items-center justify-between px-3 md:px-4 py-1.5 border-b border-white/10 bg-[#12141a] text-xs shrink-0">
        {/* Left: Project Info & Quick Tools */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsProjectManagerOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-white/10 hover:bg-white/5 font-semibold text-neutral-200"
            title="Abrir Gerenciador de Projetos"
          >
            <FolderKanban className="w-3.5 h-3.5 text-[#d4ff32]" />
            <span className="truncate max-w-[150px] sm:max-w-xs">{project.title}</span>
          </button>

          {/* New Project with Clean Timeline Quick Button */}
          <button
            type="button"
            id="subbar-new-clean-project-btn"
            onClick={() => {
              onCreateProject(
                `Projeto Limpo ${allProjects.length + 1}`,
                project.aspectRatio,
                true
              );
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#d4ff32]/10 hover:bg-[#d4ff32]/20 border border-[#d4ff32]/30 text-[#d4ff32] font-semibold transition-all active:scale-95 text-xs"
            title="Criar novo projeto com a linha do tempo totalmente limpa"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">Projeto Limpo</span>
          </button>

          <span className="px-2 py-0.5 rounded-md bg-white/5 font-mono text-[10px] text-neutral-400">
            {project.scenes.length} {project.scenes.length === 1 ? 'cena' : 'cenas'} • {totalDuration.toFixed(1)}s
          </span>

          <div className="h-3.5 border-r border-white/10 hidden sm:block" />

          {/* AI Auto Video Director Highlight Button */}
          <button
            type="button"
            id="subbar-auto-video-btn"
            onClick={() => setIsAutoVideoOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-[#d4ff32] to-[#b7f014] text-black font-extrabold text-xs shadow-[0_0_15px_rgba(212,255,50,0.3)] hover:shadow-[0_0_20px_rgba(212,255,50,0.45)] transition-all active:scale-95 border border-[#e5ff75]"
            title="AI Auto Video Director: Criar Vídeo Automaticamente a partir de Roteiro, Narração ou Ideia"
          >
            <Sparkles className="w-3.5 h-3.5 fill-black" />
            <span>🎬 AI Auto Video</span>
          </button>

          {/* Templates & Modelos Button */}
          <button
            type="button"
            id="subbar-templates-btn"
            onClick={() => setIsTemplatesOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#d4ff32]/10 hover:bg-[#d4ff32]/20 border border-[#d4ff32]/30 text-[#d4ff32] font-semibold transition-all active:scale-95"
            title="Escolher Modelos de Vídeo Prontos para Editar"
          >
            <Sparkles className="w-3.5 h-3.5 fill-[#d4ff32]" />
            <span className="hidden sm:inline">Modelos</span>
          </button>

          {/* Quick Media Button */}
          <button
            type="button"
            id="subbar-quick-media-btn"
            onClick={() => handleOpenQuickMedia('upload')}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-200 hover:text-white transition-colors text-xs"
            title="Upload ou Inserir Imagens e Vídeos com Facilidade"
          >
            <HardDrive className="w-3.5 h-3.5 text-[#d4ff32]" />
            <span className="hidden md:inline">+ Mídia</span>
          </button>

          {/* Script & Voice Button */}
          <button
            type="button"
            id="subbar-script-voice-btn"
            onClick={() => setIsScriptVoiceOpen(true)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-200 hover:text-white transition-colors text-xs"
            title="Assistente de Roteiro e Narração com Voz"
          >
            <FileText className="w-3.5 h-3.5 text-neutral-400" />
            <span className="hidden md:inline">Roteiro &amp; Voz</span>
          </button>

          {/* Sync to Script Button */}
          <button
            type="button"
            onClick={handleSyncScript}
            className="hidden xl:flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-white/5 text-neutral-400 hover:text-white transition-colors"
            title="Sincronizar cenas e falas com o roteiro de texto"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Sincronizar</span>
          </button>
        </div>

        {/* Right: Sub-panel Switcher Pills & Profile */}
        <div className="flex items-center gap-2">
          {/* Sub-tabs Pills */}
          <div className="flex items-center p-0.5 rounded-lg border border-white/10 bg-white/5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveRightTab('scenes')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                activeRightTab === 'scenes'
                  ? 'bg-[#d4ff32] text-black font-semibold shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Film className="w-3 h-3" />
              <span>Cenas</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveRightTab('audio')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                activeRightTab === 'audio'
                  ? 'bg-[#d4ff32] text-black font-semibold shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Music className="w-3 h-3" />
              <span>Áudio</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveRightTab('visual')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                activeRightTab === 'visual'
                  ? 'bg-[#d4ff32] text-black font-semibold shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Video className="w-3 h-3" />
              <span>Visual</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveRightTab('vault')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                activeRightTab === 'vault'
                  ? 'bg-[#d4ff32] text-black font-semibold shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <HardDrive className="w-3 h-3" />
              <span>Galeria</span>
            </button>
          </div>

          {/* User Credits & Quota */}
          <button
            type="button"
            onClick={() => setIsAuthOpen(true)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-white/10 hover:bg-white/5 text-neutral-300 hover:text-white transition-colors"
            title="Créditos e Conta"
          >
            <User className="w-3.5 h-3.5 text-[#d4ff32]" />
            <span className="font-mono text-[10px] text-[#d4ff32] hidden lg:inline font-bold">
              {user.audioCredits}m
            </span>
          </button>
        </div>
      </div>

      {/* Main Center Stage: Preview Player (Left) + Sub-Panel (Right) */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left Side: Realtime Video Player Viewport */}
        <div className="flex-1 h-full overflow-hidden border-r border-white/10 flex flex-col bg-[#0e0f14]">
          <StudioPreviewPlayer
            activeScene={activeScene}
            currentTime={currentTime}
            totalDuration={totalDuration}
            isPlaying={isPlaying}
            aspectRatio={project.aspectRatio}
            theme={theme}
            onTogglePlay={handleTogglePlay}
            onSeek={handleSeek}
            onUpdateScene={handleUpdateScene}
            onShowToast={onShowToast}
          />
        </div>

        {/* Right Side: Docked Tool Panel (Cenas / Áudio IA / Visual IA / Vault) */}
        <div className="w-full sm:w-80 lg:w-[420px] h-full overflow-hidden shrink-0 flex flex-col bg-[#12141c] border-l border-white/10">
          {/* AI Director Assistant Widget Bar */}
          <div className="p-2 border-b border-white/10 bg-[#0e1017]">
            <AIDirectorPanel
              project={project}
              onUpdateProject={onUpdateProject}
              onOpenAutoVideo={() => setIsAutoVideoOpen(true)}
              onShowToast={onShowToast}
            />
          </div>

          {activeRightTab === 'scenes' && (
            <ScenesDeck
              scenes={project.scenes}
              activeSceneId={activeSceneId}
              onSelectScene={(id) => {
                setActiveSceneId(id);
                // Seek to start time of that scene
                let start = 0;
                for (const sc of project.scenes) {
                  if (sc.id === id) break;
                  start += sc.duration || 5;
                }
                setCurrentTime(start);
              }}
              onUpdateScene={handleUpdateScene}
              onAddScene={handleAddScene}
              onDeleteScene={handleDeleteScene}
              onReorderScenes={handleReorderScenes}
              onOpenMediaGenerator={(scene) => {
                setActiveSceneId(scene.id);
                setActiveRightTab('visual');
              }}
              onOpenQuickMedia={(scene) => handleOpenQuickMedia('upload', scene)}
              onOpenScriptVoice={() => setIsScriptVoiceOpen(true)}
              theme={theme}
              onShowToast={onShowToast}
            />
          )}

          {activeRightTab === 'audio' && (
            <AudioStudioPanel
              theme={theme}
              onAddAssetToProject={onAddAsset}
              onInsertClipToTimeline={handleInsertClipToTimeline}
              currentSceneNarration={activeScene?.narrationText}
              onShowToast={onShowToast}
            />
          )}

          {activeRightTab === 'visual' && (
            <ImageVideoGenPanel
              theme={theme}
              aspectRatio={project.aspectRatio}
              activeScene={activeScene}
              onApplyToScene={handleApplyMediaToActiveScene}
              onAddAssetToVault={onAddAsset}
              onShowToast={onShowToast}
            />
          )}

          {activeRightTab === 'vault' && (
            <MediaVaultPanel
              assets={assets}
              theme={theme}
              onAddAsset={onAddAsset}
              onDeleteAsset={onDeleteAsset}
              onInsertToTimeline={(asset) =>
                handleInsertClipToTimeline(
                  asset.type === 'audio-bgm'
                    ? 'audio-bgm'
                    : asset.type === 'audio-sfx'
                    ? 'audio-sfx'
                    : asset.type === 'audio-voice'
                    ? 'audio-voice'
                    : 'video-overlay',
                  asset
                )
              }
              onShowToast={onShowToast}
            />
          )}
        </div>
      </div>

      {/* Bottom Area: Multitrack Timeline */}
      <div className="h-64 sm:h-72 shrink-0 overflow-hidden flex flex-col">
        <MultitrackTimeline
          tracks={project.tracks}
          currentTime={currentTime}
          totalDuration={totalDuration}
          onSeek={handleSeek}
          onUpdateTrack={(trackId, updates) => {
            const newTracks = project.tracks.map((t) =>
              t.id === trackId ? { ...t, ...updates } : t
            );
            onUpdateProject({ ...project, tracks: newTracks });
          }}
          onSelectClip={(clip) => setSelectedClipId(clip.id)}
          selectedClipId={selectedClipId}
          onSplitClipAtPlayhead={handleSplitClip}
          onDeleteClip={handleDeleteClip}
          onDuplicateClip={handleDuplicateClip}
          onOpenQuickMedia={(tab) => handleOpenQuickMedia(tab || 'upload')}
          onClearTimeline={handleClearTimeline}
          theme={theme}
          onShowToast={onShowToast}
        />
      </div>

      {/* Templates & Modelos Modal */}
      <TemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onSelectTemplate={handleApplyTemplate}
        theme={theme}
        onShowToast={onShowToast}
      />

      {/* AI Auto Video Director Modal */}
      <AIAutoVideoModal
        isOpen={isAutoVideoOpen}
        onClose={() => setIsAutoVideoOpen(false)}
        onProjectCreated={(newProject) => {
          onSelectProject(newProject.id);
          onUpdateProject(newProject);
          setIsAutoVideoOpen(false);
          onShowToast(`Projeto "${newProject.title}" criado com sucesso!`);
        }}
        currentScriptText={scenesToScript(project.scenes, project.title)}
        theme={theme}
        onShowToast={onShowToast}
      />

      {/* Quick Media Upload / AI Gen / Stock Modal */}
      <QuickMediaInsertModal
        isOpen={isQuickMediaOpen}
        onClose={() => {
          setIsQuickMediaOpen(false);
          setQuickMediaTargetScene(undefined);
        }}
        onInsertMediaToTimeline={handleQuickMediaInsertToTimeline}
        onApplyMediaToScene={handleQuickMediaApplyToScene}
        activeScene={quickMediaTargetScene || activeScene}
        currentTime={currentTime}
        initialTab={quickMediaInitialTab}
        theme={theme}
        onShowToast={onShowToast}
      />

      {/* Script & Voice Assistant Modal */}
      <ScriptAndVoiceModal
        isOpen={isScriptVoiceOpen}
        onClose={() => setIsScriptVoiceOpen(false)}
        scenes={project.scenes}
        onUpdateScenes={(updatedScenes) => {
          const newTracks = createDefaultTracksFromScenes(updatedScenes);
          const newDuration = updatedScenes.reduce((acc, s) => acc + (s.duration || 5), 0);
          onUpdateProject({
            ...project,
            scenes: updatedScenes,
            tracks: newTracks,
            duration: newDuration,
            updatedAt: Date.now(),
          });
          onShowToast('Cenas do storyboard atualizadas com sucesso!');
        }}
        onSyncVoiceClipsToTimeline={handleSyncVoiceClips}
        theme={theme}
        onShowToast={onShowToast}
      />

      {/* Export Modal */}
      <ExportStudioModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        project={project}
        theme={theme}
        onShowToast={onShowToast}
      />

      {/* Auth & Quota Modal */}
      <AuthQuotaModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        user={user}
        onUpdateUser={onUpdateUser}
        theme={theme}
        onShowToast={onShowToast}
      />

      {/* Project Manager Modal */}
      <ProjectManagerModal
        isOpen={isProjectManagerOpen}
        onClose={() => setIsProjectManagerOpen(false)}
        projects={allProjects}
        activeProjectId={project.id}
        onSelectProject={onSelectProject}
        onCreateProject={onCreateProject}
        onDuplicateProject={onDuplicateProject}
        onDeleteProject={onDeleteProject}
        theme={theme}
      />
    </div>
  );
};

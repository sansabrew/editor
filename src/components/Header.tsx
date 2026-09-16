import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Film,
  Music,
  FileText,
  HardDrive,
  Download,
  Settings as SettingsIcon,
  Sun,
  Moon,
  FolderKanban,
  Check,
  ChevronDown,
  Layers,
  Ratio,
  Plus,
  Play,
  Share2,
} from 'lucide-react';
import { EditorTheme, EditorViewMode, AppWorkspaceMode, ProjectAspectRatio } from '../types';

interface HeaderProps {
  viewMode: EditorViewMode;
  onSetViewMode: (mode: EditorViewMode) => void;
  workspaceMode: AppWorkspaceMode;
  onSetWorkspaceMode: (mode: AppWorkspaceMode) => void;
  activeStudioTab: 'scenes' | 'audio' | 'visual' | 'vault';
  onSetStudioTab: (tab: 'scenes' | 'audio' | 'visual' | 'vault') => void;
  projectTitle: string;
  onUpdateProjectTitle: (title: string) => void;
  aspectRatio: ProjectAspectRatio;
  onChangeAspectRatio: (ratio: ProjectAspectRatio) => void;
  onOpenExport: () => void;
  onOpenProjectManager: () => void;
  onOpenSettings: () => void;
  onOpenTemplates?: () => void;
  onOpenScriptVoice?: () => void;
  onOpenAutoVideo?: () => void;
  theme: EditorTheme;
  onSetTheme: (theme: EditorTheme) => void;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  onSetViewMode,
  workspaceMode,
  onSetWorkspaceMode,
  activeStudioTab,
  onSetStudioTab,
  projectTitle,
  onUpdateProjectTitle,
  aspectRatio,
  onChangeAspectRatio,
  onOpenExport,
  onOpenProjectManager,
  onOpenSettings,
  onOpenTemplates,
  onOpenScriptVoice,
  onOpenAutoVideo,
  theme,
  onSetTheme,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(projectTitle);
  const [isRatioMenuOpen, setIsRatioMenuOpen] = useState(false);

  const isDark = theme === 'dark';

  const handleTitleSubmit = () => {
    if (tempTitle.trim()) {
      onUpdateProjectTitle(tempTitle.trim());
    } else {
      setTempTitle(projectTitle);
    }
    setIsEditingTitle(false);
  };

  const aspectRatios: { id: ProjectAspectRatio; label: string; desc: string }[] = [
    { id: '16:9', label: '16:9', desc: 'YouTube / Widescreen' },
    { id: '9:16', label: '9:16', desc: 'TikTok / Reels / Shorts' },
    { id: '1:1', label: '1:1', desc: 'Instagram Feed' },
    { id: '4:5', label: '4:5', desc: 'Portrait Social' },
    { id: '21:9', label: '21:9', desc: 'Cinemascope' },
  ];

  return (
    <header
      id="movia-main-header"
      className="flex items-center justify-between px-3 md:px-4 py-2 border-b border-white/10 bg-[#0c0d11] text-neutral-100 select-none shrink-0 z-40 relative"
    >
      {/* Left: Brand Identity & Project Name */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Movia Brand Icon + Wordmark + #1 AI VIDEO Badge */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#d4ff32] flex items-center justify-center shadow-[0_0_15px_rgba(212,255,50,0.35)] shrink-0">
            <svg
              className="w-4 h-4 text-black"
              viewBox="0 0 24 24"
              fill="currentColor"
              stroke="none"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base tracking-tight text-white font-sans">
              Movia
            </span>
            <span className="px-1.5 py-0.5 rounded-full bg-[#d4ff32]/20 border border-[#d4ff32]/30 text-[#d4ff32] text-[9px] font-mono font-bold uppercase tracking-wider hidden sm:inline-block">
              #1 AI VIDEO
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-4 w-px bg-white/10 hidden md:block" />

        {/* Project Title (Inline Editable) */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-neutral-300 min-w-0">
          {isEditingTitle ? (
            <input
              type="text"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
              autoFocus
              className="px-2 py-0.5 rounded bg-neutral-800 border border-[#d4ff32]/50 text-white text-xs outline-hidden font-medium"
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setTempTitle(projectTitle);
                setIsEditingTitle(true);
              }}
              className="px-2 py-0.5 rounded hover:bg-neutral-800/80 truncate max-w-[180px] font-medium text-neutral-300 hover:text-white transition-colors text-left"
              title="Clique para renomear o projeto"
            >
              {projectTitle}
            </button>
          )}

          {/* Project Manager Button */}
          <button
            type="button"
            onClick={onOpenProjectManager}
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800"
            title="Gerenciar e Alternar Projetos"
          >
            <FolderKanban className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Center: Main Navigation Tabs */}
      <nav className="flex items-center gap-1 bg-[#15171e] p-1 rounded-xl border border-white/10 text-xs font-medium">
        <button
          type="button"
          onClick={() => {
            onSetWorkspaceMode('studio');
            onSetStudioTab('scenes');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
            workspaceMode === 'studio' && activeStudioTab === 'scenes'
              ? 'bg-[#d4ff32] text-black font-semibold shadow-[0_0_15px_rgba(212,255,50,0.25)]'
              : 'text-neutral-400 hover:text-white hover:bg-white/5'
          }`}
          title="Timeline, Player e Cenas"
        >
          <Film className="w-3.5 h-3.5" />
          <span>Studio</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onSetWorkspaceMode('editor');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
            workspaceMode === 'editor'
              ? 'bg-[#d4ff32] text-black font-semibold shadow-[0_0_15px_rgba(212,255,50,0.25)]'
              : 'text-neutral-400 hover:text-white hover:bg-white/5'
          }`}
          title="Roteiro & Scriptwriter com IA"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Roteiro</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onSetWorkspaceMode('studio');
            onSetStudioTab('audio');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
            workspaceMode === 'studio' && activeStudioTab === 'audio'
              ? 'bg-[#d4ff32] text-black font-semibold shadow-[0_0_15px_rgba(212,255,50,0.25)]'
              : 'text-neutral-400 hover:text-white hover:bg-white/5'
          }`}
          title="Sintetizador de Áudio, BGM e Voz IA"
        >
          <Music className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Áudio IA</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onSetWorkspaceMode('studio');
            onSetStudioTab('visual');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
            workspaceMode === 'studio' && activeStudioTab === 'visual'
              ? 'bg-[#d4ff32] text-black font-semibold shadow-[0_0_15px_rgba(212,255,50,0.25)]'
              : 'text-neutral-400 hover:text-white hover:bg-white/5'
          }`}
          title="Geração Visual e Câmera com IA"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Visual IA</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onSetWorkspaceMode('studio');
            onSetStudioTab('vault');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
            workspaceMode === 'studio' && activeStudioTab === 'vault'
              ? 'bg-[#d4ff32] text-black font-semibold shadow-[0_0_15px_rgba(212,255,50,0.25)]'
              : 'text-neutral-400 hover:text-white hover:bg-white/5'
          }`}
          title="Galeria de Mídias e Uploads"
        >
          <HardDrive className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Mídia</span>
        </button>

        {/* AI AUTO VIDEO in Navigation */}
        {onOpenAutoVideo && (
          <button
            type="button"
            id="nav-ai-auto-video-btn"
            onClick={onOpenAutoVideo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-neutral-200 hover:text-white hover:bg-white/5 transition-all text-xs font-semibold"
            title="Produção e Edição Automática com Diretor IA"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#d4ff32]" />
            <span>AI AUTO VIDEO</span>
          </button>
        )}
      </nav>

      {/* Right: Auto Video Highlight, Templates, Aspect Ratio, Settings & Primary Export Action */}
      <div className="flex items-center gap-2">
        {/* Highlighted Primary Action: Criar vídeo automaticamente */}
        {onOpenAutoVideo && (
          <button
            type="button"
            id="header-create-auto-video-btn"
            onClick={onOpenAutoVideo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#d4ff32] to-[#b7f014] text-black text-xs font-bold shadow-[0_0_20px_rgba(212,255,50,0.35)] hover:shadow-[0_0_25px_rgba(212,255,50,0.5)] transition-all active:scale-95 border border-[#e5ff75]"
            title="Transforme roteiro, narração ou ideia em um vídeo completo"
          >
            <Film className="w-3.5 h-3.5 fill-black" />
            <span className="font-extrabold tracking-tight">🎬 Criar vídeo automaticamente</span>
          </button>
        )}

        {/* Templates Button */}
        {onOpenTemplates && (
          <button
            type="button"
            id="open-templates-header-btn"
            onClick={onOpenTemplates}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#181b24] hover:bg-[#232734] border border-[#d4ff32]/30 text-xs text-[#d4ff32] font-semibold transition-all hover:border-[#d4ff32] shadow-xs active:scale-95"
            title="Explorar Modelos & Templates Prontos para Editar"
          >
            <Sparkles className="w-3.5 h-3.5 fill-[#d4ff32] text-[#d4ff32]" />
            <span className="hidden md:inline">Modelos</span>
          </button>
        )}

        {/* Script & Voice Button */}
        {onOpenScriptVoice && (
          <button
            type="button"
            id="open-scriptvoice-header-btn"
            onClick={onOpenScriptVoice}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#181b24] hover:bg-[#232734] border border-white/10 text-xs text-neutral-300 hover:text-white transition-all active:scale-95 hidden lg:flex"
            title="Assistente de Roteiro & Narração com Voz"
          >
            <FileText className="w-3.5 h-3.5 text-neutral-400" />
            <span>Roteiro &amp; Voz</span>
          </button>
        )}

        {/* Aspect Ratio Selector */}
        <div className="relative">
          <button
            type="button"
            id="aspect-ratio-selector-btn"
            onClick={() => setIsRatioMenuOpen(!isRatioMenuOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#15171e] hover:bg-[#1f222b] border border-white/10 text-xs text-neutral-300 hover:text-white transition-colors"
            title="Formato de Proporção do Vídeo"
          >
            <Ratio className="w-3.5 h-3.5 text-[#d4ff32]" />
            <span className="font-mono font-medium">{aspectRatio}</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {isRatioMenuOpen && (
            <div
              className="absolute right-0 mt-1 w-48 rounded-xl bg-[#171920] border border-white/15 shadow-2xl py-1 z-50 text-xs"
              onClick={() => setIsRatioMenuOpen(false)}
            >
              <div className="px-3 py-1.5 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider border-b border-white/10">
                Formato do Vídeo
              </div>
              {aspectRatios.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => onChangeAspectRatio(r.id)}
                  className={`w-full px-3 py-1.5 flex items-center justify-between text-left hover:bg-white/5 transition-colors ${
                    aspectRatio === r.id ? 'text-[#d4ff32] font-semibold bg-[#d4ff32]/10' : 'text-neutral-200'
                  }`}
                >
                  <div>
                    <div className="font-medium font-mono">{r.label}</div>
                    <div className="text-[10px] opacity-60">{r.desc}</div>
                  </div>
                  {aspectRatio === r.id && <Check className="w-3.5 h-3.5 text-[#d4ff32]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Settings button */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="p-1.5 rounded-lg bg-[#15171e] hover:bg-[#1f222b] border border-white/10 text-neutral-400 hover:text-white transition-colors hidden sm:flex"
          title="Configurações do App"
        >
          <SettingsIcon className="w-3.5 h-3.5" />
        </button>

        {/* Primary CTA: Criar Vídeo / Exportar (Movia Lime Button) */}
        <button
          type="button"
          id="movia-create-video-cta"
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#d4ff32] hover:bg-[#bbf438] text-black font-semibold text-xs transition-all shadow-[0_0_20px_rgba(212,255,50,0.35)] hover:shadow-[0_0_25px_rgba(212,255,50,0.5)] active:scale-95 shrink-0"
          title="Renderizar e Exportar Vídeo Final"
        >
          <Sparkles className="w-3.5 h-3.5 fill-black text-black" />
          <span className="font-sans font-bold">Criar vídeo</span>
        </button>
      </div>
    </header>
  );
};

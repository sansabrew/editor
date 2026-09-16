import React, { useState } from 'react';
import {
  VIDEO_TEMPLATES,
  VideoTemplateItem,
} from '../../data/sampleProjects';
import { MultimediaProject, EditorTheme } from '../../types';
import { createCleanTracks } from '../../utils/scriptConverter';
import {
  Sparkles,
  X,
  Play,
  Check,
  Film,
  Clock,
  Music,
  Layers,
  Ratio,
  ArrowRight,
  Plus,
} from 'lucide-react';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (project: MultimediaProject) => void;
  theme: EditorTheme;
  onShowToast: (msg: string) => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  theme,
  onShowToast,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [previewTemplate, setPreviewTemplate] = useState<VideoTemplateItem>(VIDEO_TEMPLATES[0]);

  if (!isOpen) return null;

  const categories = ['Todos', 'Comercial', 'Redes Sociais', 'Cinema', 'Viagem', 'Tech & SaaS'];

  const filteredTemplates =
    selectedCategory === 'Todos'
      ? VIDEO_TEMPLATES
      : VIDEO_TEMPLATES.filter((t) => t.category === selectedCategory);

  const handleApplyTemplate = (template: VideoTemplateItem) => {
    const newProj = template.createProject();
    onSelectTemplate(newProj);
    onShowToast(`Template "${template.title}" carregado com sucesso!`);
    onClose();
  };

  const handleCreateCleanProject = () => {
    const cleanProject: MultimediaProject = {
      id: `proj-${Date.now()}-clean`,
      title: 'Projeto em Branco',
      aspectRatio: '16:9',
      fps: 30,
      sampleRate: 48000,
      duration: 5,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      scenes: [
        {
          id: `scene-${Date.now()}-1`,
          order: 1,
          title: 'Cena 1',
          duration: 5,
          visualPrompt: '',
          visualStyle: 'cinematic',
          visualMediaType: 'image',
          visualMediaUrl: '',
          narrationText: '',
          voiceId: 'pt-BR-natural',
          transition: 'cut',
          cameraMotion: 'static',
        },
      ],
      tracks: createCleanTracks(),
    };
    onSelectTemplate(cleanProject);
    onShowToast('Novo projeto criado com linha do tempo limpa!');
    onClose();
  };

  return (
    <div
      id="templates-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        id="templates-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-white/15 bg-[#101218] text-neutral-100 shadow-2xl overflow-hidden text-xs"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#151720]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#d4ff32] flex items-center justify-center shadow-[0_0_12px_rgba(212,255,50,0.4)]">
              <Sparkles className="w-4 h-4 text-black fill-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">Modelos &amp; Templates de Vídeo</span>
                <span className="px-1.5 py-0.2 rounded-full bg-[#d4ff32]/20 text-[#d4ff32] font-mono text-[9px] font-bold">
                  PRONTOS PARA EDITAR
                </span>
              </div>
              <span className="text-[11px] text-neutral-400">
                Escolha um modelo cinematográfico completo com cenas, imagens, narração e trilhas na timeline.
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Clean Timeline Fast Option Banner */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-[#d4ff32]/5 border-b border-[#d4ff32]/20">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white text-xs">Prefere começar do zero sem nenhum clipe pré-carregado?</span>
            <span className="text-[11px] text-neutral-400 hidden sm:inline">Inicie um projeto com a linha do tempo totalmente limpa.</span>
          </div>
          <button
            type="button"
            id="btn-template-clean-project"
            onClick={handleCreateCleanProject}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#d4ff32] hover:bg-[#bbf438] text-black font-bold text-xs shadow-[0_0_10px_rgba(212,255,50,0.3)] transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Criar Projeto Limpo</span>
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 px-5 py-2.5 border-b border-white/5 bg-[#12141c] overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#d4ff32] text-black font-semibold shadow-xs'
                  : 'bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Modal Main Content: Left Cards Grid + Right Preview Detail */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Left Grid */}
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5 border-r border-white/10">
            {filteredTemplates.map((template) => {
              const isSelected = previewTemplate.id === template.id;
              return (
                <div
                  key={template.id}
                  onClick={() => setPreviewTemplate(template)}
                  className={`rounded-xl border overflow-hidden cursor-pointer transition-all flex flex-col group ${
                    isSelected
                      ? 'border-[#d4ff32] bg-[#d4ff32]/5 ring-1 ring-[#d4ff32]'
                      : 'border-white/10 hover:border-white/25 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  {/* Thumbnail Banner */}
                  <div className="h-32 w-full relative overflow-hidden bg-neutral-900">
                    <img
                      src={template.coverUrl}
                      alt={template.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                    {/* Aspect Ratio Badge */}
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-xs font-mono text-[10px] text-[#d4ff32] font-semibold border border-white/10">
                      {template.aspectRatio}
                    </span>

                    {/* Category Badge */}
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[10px] text-neutral-300">
                      {template.category}
                    </span>

                    {/* Duration badge */}
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] text-white font-mono bg-black/60 px-1.5 py-0.5 rounded">
                      <Clock className="w-3 h-3 text-[#d4ff32]" />
                      <span>{template.duration}s</span>
                      <span>•</span>
                      <span>{template.scenesCount} cenas</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-semibold text-white text-xs mb-1 group-hover:text-[#d4ff32] transition-colors">
                        {template.title}
                      </h4>
                      <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                        {template.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {template.tags.slice(0, 2).map((t) => (
                          <span
                            key={t}
                            className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] text-neutral-400"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApplyTemplate(template);
                        }}
                        className="px-2.5 py-1 rounded-md bg-[#d4ff32] hover:bg-[#bbf438] text-black font-bold text-[11px] flex items-center gap-1 shadow-xs transition-all active:scale-95"
                      >
                        <span>Usar</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Detail Preview Panel */}
          <div className="hidden md:flex w-72 lg:w-80 flex-col bg-[#12141c] overflow-y-auto p-4 shrink-0 justify-between">
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden border border-white/10 aspect-video bg-black">
                <img
                  src={previewTemplate.coverUrl}
                  alt=""
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-2 left-2 right-2">
                  <span className="font-bold text-white block text-sm">{previewTemplate.title}</span>
                  <span className="text-[10px] text-[#d4ff32] font-mono">{previewTemplate.category}</span>
                </div>
              </div>

              {/* Specs */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Proporção (Aspect):</span>
                  <span className="font-mono font-bold text-[#d4ff32]">{previewTemplate.aspectRatio}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Duração Total:</span>
                  <span className="font-mono text-white">{previewTemplate.duration}s</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Cenas no Storyboard:</span>
                  <span className="font-mono text-white">{previewTemplate.scenesCount} Tomadas</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Trilha Musical:</span>
                  <span className="font-medium text-emerald-400">{previewTemplate.musicGenre}</span>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                  Sobre Este Template:
                </label>
                <p className="text-[11px] text-neutral-300 leading-relaxed bg-white/5 p-2.5 rounded-lg border border-white/5">
                  {previewTemplate.description}
                </p>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {previewTemplate.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] text-neutral-400 border border-white/5"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Button to load */}
            <div className="pt-4 border-t border-white/10">
              <button
                type="button"
                id="apply-template-btn"
                onClick={() => handleApplyTemplate(previewTemplate)}
                className="w-full py-2.5 rounded-xl bg-[#d4ff32] hover:bg-[#bbf438] text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(212,255,50,0.35)] transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4 fill-black" />
                <span>Carregar &amp; Editar este Modelo</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

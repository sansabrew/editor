import React, { useState } from 'react';
import {
  MultimediaProject,
  ProjectAspectRatio,
  EditorTheme,
} from '../../types';
import {
  FolderKanban,
  Plus,
  Trash2,
  Copy,
  Check,
  X,
  FileText,
  Clock,
  Ratio,
  Sparkles,
} from 'lucide-react';

interface ProjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: MultimediaProject[];
  activeProjectId: string;
  onSelectProject: (projectId: string) => void;
  onCreateProject: (title: string, aspectRatio: ProjectAspectRatio, cleanTimeline?: boolean) => void;
  onDuplicateProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onCreateFromCurrentScript?: () => void;
  theme: EditorTheme;
}

export const ProjectManagerModal: React.FC<ProjectManagerModalProps> = ({
  isOpen,
  onClose,
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onDuplicateProject,
  onDeleteProject,
  onCreateFromCurrentScript,
  theme,
}) => {
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAspect, setNewAspect] = useState<ProjectAspectRatio>('16:9');
  const [cleanTimeline, setCleanTimeline] = useState(true);

  if (!isOpen) return null;

  const isDark = theme === 'dark';

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreateProject(newTitle.trim(), newAspect, cleanTimeline);
    setNewTitle('');
    setIsCreatingNew(false);
  };

  const handleQuickCreateCleanProject = () => {
    const defaultTitle = `Projeto Limpo ${projects.length + 1}`;
    onCreateProject(defaultTitle, '16:9', true);
    onClose();
  };

  return (
    <div
      id="project-manager-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        id="project-manager-modal-card"
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-lg rounded-xl border shadow-2xl overflow-hidden text-xs ${
          isDark ? 'bg-neutral-900 border-neutral-700 text-neutral-100' : 'bg-white border-neutral-200 text-neutral-800'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-inherit/15">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-blue-500" />
            <span className="font-semibold text-sm">Gerenciador de Projetos Multimídia</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md hover:bg-inherit/20 text-neutral-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3.5">
          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              id="btn-open-create-clean-project"
              onClick={() => {
                setCleanTimeline(true);
                setIsCreatingNew(true);
              }}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-[#d4ff32] hover:bg-[#bbf438] text-black font-bold shadow-xs transition-all"
              title="Criar novo projeto com a linha do tempo totalmente limpa e sem clipes"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Novo com Linha do Tempo Limpa</span>
            </button>

            {onCreateFromCurrentScript ? (
              <button
                type="button"
                onClick={() => {
                  onCreateFromCurrentScript();
                  onClose();
                }}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-xs transition-colors"
                title="Converte o documento de texto ativo no editor em um novo projeto de vídeo e áudio"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Criar do Roteiro Atual</span>
              </button>
            ) : (
              <button
                type="button"
                id="btn-quick-clean-instant"
                onClick={handleQuickCreateCleanProject}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg border border-inherit/20 hover:bg-inherit/10 text-neutral-300 font-medium transition-colors"
                title="Cria instantaneamente um projeto em branco limpo"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#d4ff32]" />
                <span>Criação Rápida 1-Clique</span>
              </button>
            )}
          </div>

          {/* New Project Form inline */}
          {isCreatingNew && (
            <form
              onSubmit={handleCreateSubmit}
              className="p-3.5 rounded-xl border border-[#d4ff32]/30 bg-[#d4ff32]/5 space-y-3 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#d4ff32] text-sm">Configurar Novo Projeto</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#d4ff32]/20 text-[#d4ff32] font-semibold">
                  {cleanTimeline ? 'Linha do Tempo Limpa' : 'Com Modelo Padrão'}
                </span>
              </div>

              <div>
                <label className="block mb-1 font-medium opacity-90">Título do Projeto:</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Novo Vídeo do Zero"
                  className="w-full px-3 py-2 rounded-lg border border-inherit/20 bg-black/40 focus:outline-hidden focus:ring-1 focus:ring-[#d4ff32] text-xs"
                  autoFocus
                />
              </div>

              <div>
                <label className="block mb-1 font-medium opacity-90">Proporção de Tela (Aspect Ratio):</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['16:9', '9:16', '1:1', '4:3'] as ProjectAspectRatio[]).map((aspect) => (
                    <button
                      key={aspect}
                      type="button"
                      onClick={() => setNewAspect(aspect)}
                      className={`py-1.5 px-2 rounded-lg border text-center font-mono font-medium transition-colors ${
                        newAspect === aspect
                          ? 'border-[#d4ff32] bg-[#d4ff32]/20 text-[#d4ff32]'
                          : 'border-inherit/20 hover:bg-inherit/10'
                      }`}
                    >
                      {aspect}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clean Timeline Option Toggle Box */}
              <div>
                <label className="block mb-1.5 font-medium opacity-90">Opção de Linha do Tempo:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCleanTimeline(true)}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      cleanTimeline
                        ? 'border-[#d4ff32] bg-[#d4ff32]/10 text-white shadow-xs'
                        : 'border-inherit/20 bg-inherit/5 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-[11px] text-[#d4ff32]">
                      <Check className={`w-3.5 h-3.5 ${cleanTimeline ? 'opacity-100' : 'opacity-0'}`} />
                      <span>Linha do Tempo Limpa</span>
                    </div>
                    <p className="mt-1 text-[10px] text-neutral-400 leading-tight">
                      Todas as faixas (vídeo, áudio, legendas) iniciam vazias (0 clipes), prontas para você adicionar suas próprias mídias.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCleanTimeline(false)}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      !cleanTimeline
                        ? 'border-blue-500 bg-blue-500/10 text-white shadow-xs'
                        : 'border-inherit/20 bg-inherit/5 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-[11px] text-blue-400">
                      <Check className={`w-3.5 h-3.5 ${!cleanTimeline ? 'opacity-100' : 'opacity-0'}`} />
                      <span>Com Clipes de Exemplo</span>
                    </div>
                    <p className="mt-1 text-[10px] text-neutral-400 leading-tight">
                      Pré-carrega imagens, narração TTS e faixas de exemplo para servir de ponto de partida.
                    </p>
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-inherit/15">
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="px-3 py-1.5 rounded-lg border border-inherit/20 hover:bg-inherit/20"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#d4ff32] hover:bg-[#bbf438] text-black font-bold"
                >
                  {cleanTimeline ? 'Criar Projeto Limpo' : 'Criar com Exemplo'}
                </button>
              </div>
            </form>
          )}

          {/* Projects List */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {projects.map((proj) => {
              const isActive = proj.id === activeProjectId;
              const totalClips = proj.tracks.reduce((acc, t) => acc + (t.clips?.length || 0), 0);
              const isTimelineClean = totalClips === 0;

              return (
                <div
                  key={proj.id}
                  onClick={() => {
                    onSelectProject(proj.id);
                    onClose();
                  }}
                  className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer ${
                    isActive
                      ? 'border-[#d4ff32] bg-[#d4ff32]/10 shadow-xs'
                      : 'border-inherit/15 hover:border-inherit/30 bg-inherit/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-md bg-[#d4ff32]/20 text-[#d4ff32] flex items-center justify-center shrink-0 font-bold overflow-hidden">
                      {proj.scenes[0]?.visualMediaUrl ? (
                        <img
                          src={proj.scenes[0].visualMediaUrl}
                          alt=""
                          className="w-full h-full object-cover rounded-md"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <FolderKanban className="w-4 h-4" />
                      )}
                    </div>

                    <div className="truncate">
                      <div className="font-semibold truncate flex items-center gap-1.5">
                        <span>{proj.title}</span>
                        {isActive && (
                          <span className="px-1.5 py-0.2 rounded-xs bg-[#d4ff32] text-black text-[9px] font-bold">
                            Ativo
                          </span>
                        )}
                        {isTimelineClean && (
                          <span className="px-1.5 py-0.2 rounded-xs bg-white/10 text-[#d4ff32] text-[9px] font-mono">
                            Timeline limpa
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] opacity-65 font-mono">
                        <span>{proj.aspectRatio}</span>
                        <span>•</span>
                        <span>{proj.scenes.length} {proj.scenes.length === 1 ? 'cena' : 'cenas'}</span>
                        <span>•</span>
                        <span>{totalClips} clipes</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => onDuplicateProject(proj.id)}
                      className="p-1.5 rounded-md hover:bg-inherit/20 text-neutral-400 hover:text-neutral-200"
                      title="Duplicar Projeto"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {projects.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onDeleteProject(proj.id)}
                        className="p-1.5 rounded-md hover:bg-red-500/20 text-red-400"
                        title="Excluir Projeto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-4 py-3 border-t border-inherit/15 bg-inherit/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-inherit/20 hover:bg-inherit/30 font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

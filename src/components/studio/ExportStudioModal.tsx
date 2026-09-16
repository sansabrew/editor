import React, { useState } from 'react';
import {
  ExportFormat,
  ExportResolution,
  MultimediaProject,
  EditorTheme,
} from '../../types';
import {
  Download,
  Film,
  Music,
  FileText,
  CheckCircle,
  X,
  RefreshCw,
  Sparkles,
  Sliders,
  Layers,
} from 'lucide-react';
import { scenesToScript } from '../../utils/scriptConverter';
import { downloadFile } from '../../utils/textUtils';
import { renderProjectToVideoBlob } from '../../utils/videoExporter';
import { generateBGMTrack } from '../../utils/audioGenerator';

interface ExportStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: MultimediaProject;
  theme: EditorTheme;
  onShowToast: (msg: string) => void;
}

export const ExportStudioModal: React.FC<ExportStudioModalProps> = ({
  isOpen,
  onClose,
  project,
  theme,
  onShowToast,
}) => {
  const [format, setFormat] = useState<ExportFormat>('video-webm');
  const [resolution, setResolution] = useState<ExportResolution>('1080p');
  const [fps, setFps] = useState<number>(30);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [downloadBlob, setDownloadBlob] = useState<{ blob: Blob; filename: string } | null>(null);

  if (!isOpen) return null;

  const handleStartExport = async () => {
    setIsExporting(true);
    setProgress(5);
    setCurrentStep('Iniciando pipeline de exportação do Movia...');

    try {
      if (format === 'storyboard-doc') {
        setProgress(60);
        setCurrentStep('Gerando roteiro em Markdown...');
        const script = scenesToScript(project.scenes, project.title);
        const filename = `${project.title.toLowerCase().replace(/\s+/g, '_')}_roteiro.md`;
        downloadFile(filename, script, 'text/markdown');
        setIsExporting(false);
        onShowToast(`Roteiro baixado com sucesso!`);
        onClose();
        return;
      }

      if (format.startsWith('audio')) {
        setProgress(30);
        setCurrentStep('Sintetizando Master de Áudio com Web Audio API...');
        const audioResult = await generateBGMTrack({
          genre: 'cinematic',
          mood: 'epic',
          tempo: 110,
          duration: Math.min(30, project.duration || 15),
        });
        setProgress(100);
        setCurrentStep('Master de áudio concluído!');
        const filename = `${project.title.toLowerCase().replace(/\s+/g, '_')}_master.wav`;
        setDownloadBlob({ blob: audioResult.blob, filename });
        setIsExporting(false);
        onShowToast('Áudio master gerado!');
        return;
      }

      // Video format: Render real canvas video stream
      const videoBlob = await renderProjectToVideoBlob(project, (pct, status) => {
        setProgress(pct);
        setCurrentStep(status);
      });

      const filename = `${project.title.toLowerCase().replace(/\s+/g, '_')}_${resolution}.webm`;
      setDownloadBlob({ blob: videoBlob, filename });
      setIsExporting(false);
      onShowToast(`Renderização de "${project.title}" finalizada com sucesso!`);
    } catch (err) {
      console.error('Erro na exportação:', err);
      setIsExporting(false);
      onShowToast('Falha na renderização. Tente novamente.');
    }
  };

  const handleDownloadCompleted = () => {
    if (!downloadBlob) return;
    const url = URL.createObjectURL(downloadBlob.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = downloadBlob.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onShowToast(`Download do arquivo iniciado!`);
    onClose();
  };

  return (
    <div
      id="export-studio-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        id="export-studio-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#12141a] text-neutral-100 shadow-2xl overflow-hidden text-xs"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#161820]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#d4ff32] flex items-center justify-center">
              <Download className="w-3.5 h-3.5 text-black" />
            </div>
            <div>
              <span className="font-bold text-sm text-white">Exportar &amp; Renderizar Vídeo</span>
              <span className="text-[10px] text-neutral-400 block">Movia Video Engine</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4">
          {/* Format Selection */}
          <div>
            <label className="block font-semibold mb-2 text-neutral-300">Formato de Saída:</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  id: 'video-webm',
                  title: 'Vídeo WebM / MP4',
                  desc: 'Vídeo animado com filtros, cenas e legendas',
                  icon: <Film className="w-4 h-4 text-[#d4ff32]" />,
                },
                {
                  id: 'audio-wav',
                  title: 'Áudio Master (WAV)',
                  desc: 'Master estéreo sintetizado com alta fidelidade',
                  icon: <Music className="w-4 h-4 text-emerald-400" />,
                },
                {
                  id: 'storyboard-doc',
                  title: 'Roteiro & Script (MD)',
                  desc: 'Documento completo de cenas e narração',
                  icon: <FileText className="w-4 h-4 text-purple-400" />,
                },
                {
                  id: 'audio-mp3',
                  title: 'Áudio Compacto (MP3)',
                  desc: 'Trilha sonora leve para web',
                  icon: <Music className="w-4 h-4 text-amber-400" />,
                },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => setFormat(fmt.id as ExportFormat)}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    format === fmt.id
                      ? 'border-[#d4ff32] bg-[#d4ff32]/10 ring-1 ring-[#d4ff32]'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {fmt.icon}
                    <span className="font-semibold text-white">{fmt.title}</span>
                  </div>
                  <span className="text-[10px] text-neutral-400">{fmt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Video Parameters */}
          {format.startsWith('video') && (
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <div>
                <label className="block font-medium mb-1 text-neutral-400 text-[11px]">Resolução:</label>
                <select
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value as ExportResolution)}
                  className="w-full px-2 py-1.5 rounded-lg bg-[#1a1d26] border border-white/10 text-white outline-hidden cursor-pointer"
                >
                  <option value="1080p">1080p Full HD (Recomendado)</option>
                  <option value="720p">720p HD (Render Rápido)</option>
                  <option value="4k">4K Ultra HD (Cinema)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1 text-neutral-400 text-[11px]">Taxa de Quadros (FPS):</label>
                <select
                  value={fps}
                  onChange={(e) => setFps(parseInt(e.target.value))}
                  className="w-full px-2 py-1.5 rounded-lg bg-[#1a1d26] border border-white/10 text-white outline-hidden cursor-pointer"
                >
                  <option value={30}>30 FPS (Padrão Web / Social)</option>
                  <option value={24}>24 FPS (Cinematográfico)</option>
                  <option value={60}>60 FPS (Ultra Fluido)</option>
                </select>
              </div>
            </div>
          )}

          {/* Project Summary */}
          <div className="p-3 rounded-xl border border-white/10 bg-white/5 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-neutral-400">Projeto:</span>
              <span className="font-semibold text-white">{project.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Duração:</span>
              <span className="font-mono text-white">{project.duration.toFixed(1)}s ({project.scenes.length} cenas)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Formato / Aspecto:</span>
              <span className="font-mono text-[#d4ff32] font-semibold">{project.aspectRatio}</span>
            </div>
          </div>

          {/* Export Progress Bar */}
          {isExporting && (
            <div className="space-y-2 p-3 rounded-xl bg-[#d4ff32]/10 border border-[#d4ff32]/30">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-[#d4ff32] flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{currentStep}</span>
                </span>
                <span className="font-mono text-[#d4ff32] font-bold">{progress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-black/60 overflow-hidden">
                <div
                  className="h-full bg-[#d4ff32] shadow-[0_0_10px_rgba(212,255,50,0.8)] transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Completed Download Button */}
          {downloadBlob && !isExporting && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">Arquivo Pronto para Download!</span>
              </div>
              <button
                type="button"
                onClick={handleDownloadCompleted}
                className="px-3.5 py-1.5 rounded-lg bg-[#d4ff32] hover:bg-[#bbf438] text-black font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(212,255,50,0.3)] transition-all active:scale-95"
              >
                <Download className="w-3.5 h-3.5 fill-black" />
                <span>Baixar {downloadBlob.filename}</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-white/10 bg-[#161820]">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 font-medium text-neutral-300"
          >
            Fechar
          </button>

          {!downloadBlob && (
            <button
              type="button"
              id="start-export-btn"
              onClick={handleStartExport}
              disabled={isExporting}
              className="px-4 py-1.5 rounded-lg bg-[#d4ff32] hover:bg-[#bbf438] text-black font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(212,255,50,0.3)] disabled:opacity-50 transition-all active:scale-95"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-black" />
                  <span>Renderizando...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 fill-black text-black" />
                  <span>Iniciar Renderização &amp; Export</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

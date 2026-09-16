import React, { useState, useRef } from 'react';
import {
  Upload,
  Sparkles,
  Image as ImageIcon,
  Film,
  X,
  Plus,
  Check,
  RefreshCw,
  Search,
  Sliders,
  FolderOpen,
} from 'lucide-react';
import { EditorTheme, StoryboardScene, MediaAsset } from '../../types';

interface QuickMediaInsertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertMediaToTimeline: (mediaUrl: string, mediaType: 'image' | 'video', title: string) => void;
  onApplyMediaToScene?: (sceneId: string, mediaUrl: string, mediaType: 'image' | 'video') => void;
  activeScene?: StoryboardScene;
  currentTime: number;
  initialTab?: 'upload' | 'ai-generate' | 'stock';
  theme: EditorTheme;
  onShowToast: (msg: string) => void;
}

// Curated stock photos for fast 1-click media insertion
const CURATED_STOCK_MEDIA = [
  {
    id: 'st-01',
    category: 'Produtos & Moda',
    title: 'Tênis Esportivo Neon Runner',
    type: 'image' as const,
    url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'st-02',
    category: 'Produtos & Moda',
    title: 'Sérum Estético Facial',
    type: 'image' as const,
    url: 'https://images.unsplash.com/photo-1608248597359-07f240d9954d?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'st-03',
    category: 'Tecnologia & IA',
    title: 'Interface Holográfica e Ondas',
    type: 'image' as const,
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'st-04',
    category: 'Tecnologia & IA',
    title: 'Estúdio Gamer & Produção',
    type: 'image' as const,
    url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'st-05',
    category: 'Cinema & Cyber',
    title: 'Metrópole Noturna Sob Chuva',
    type: 'image' as const,
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'st-06',
    category: 'Cinema & Cyber',
    title: 'Androide & Arte Conceitual',
    type: 'image' as const,
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'st-07',
    category: 'Viagem & Cidades',
    title: 'Cruzamento Iluminado de Shibuya',
    type: 'image' as const,
    url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'st-08',
    category: 'Viagem & Cidades',
    title: 'Vielas e Lanternas Vermelhas',
    type: 'image' as const,
    url: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'st-09',
    category: 'Natureza & Espaço',
    title: 'Terra e Galáxia Orbitais',
    type: 'image' as const,
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1000&q=80',
  },
];

export const QuickMediaInsertModal: React.FC<QuickMediaInsertModalProps> = ({
  isOpen,
  onClose,
  onInsertMediaToTimeline,
  onApplyMediaToScene,
  activeScene,
  currentTime,
  initialTab = 'upload',
  theme,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'ai-generate' | 'stock'>(initialTab);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // AI Generation state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiStyle, setAiStyle] = useState<'cinematic' | 'photorealistic' | '3d-render' | 'cyberpunk'>('cinematic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPreviewUrl, setGeneratedPreviewUrl] = useState<string | null>(null);

  // File Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; url: string; type: 'image' | 'video' }[]>([]);

  // Stock filter
  const [stockCategory, setStockCategory] = useState<string>('Todos');

  if (!isOpen) return null;

  // Process uploaded files
  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newItems: { name: string; url: string; type: 'image' | 'video' }[] = [];

    Array.from(files).forEach((file) => {
      const isVideo = file.type.startsWith('video');
      const isImg = file.type.startsWith('image');
      if (!isImg && !isVideo) return;

      const url = URL.createObjectURL(file);
      newItems.push({
        name: file.name.replace(/\.[^/.]+$/, ''),
        url,
        type: isVideo ? 'video' : 'image',
      });
    });

    setUploadedFiles((prev) => [...newItems, ...prev]);
    onShowToast(`${newItems.length} arquivo(s) carregado(s)!`);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  // Generate AI Image simulation with rich canvas rendering / curated visuals
  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) {
      onShowToast('Digite uma descrição para a imagem.');
      return;
    }

    setIsGenerating(true);

    // Realistic synthesis simulation: generate canvas artwork or thematic visual
    setTimeout(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // Aesthetic gradient background
        const grad = ctx.createLinearGradient(0, 0, 1280, 720);
        if (aiStyle === 'cyberpunk') {
          grad.addColorStop(0, '#0f172a');
          grad.addColorStop(0.5, '#581c87');
          grad.addColorStop(1, '#06b6d4');
        } else if (aiStyle === 'cinematic') {
          grad.addColorStop(0, '#09090b');
          grad.addColorStop(0.5, '#1e293b');
          grad.addColorStop(1, '#0f766e');
        } else {
          grad.addColorStop(0, '#1c1917');
          grad.addColorStop(0.5, '#44403c');
          grad.addColorStop(1, '#d97706');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1280, 720);

        // Cyber / cinematic grid lines
        ctx.strokeStyle = 'rgba(212, 255, 50, 0.15)';
        ctx.lineWidth = 1;
        for (let x = 0; x < 1280; x += 80) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, 720);
          ctx.stroke();
        }
        for (let y = 0; y < 720; y += 80) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(1280, y);
          ctx.stroke();
        }

        // Particle orbs
        for (let i = 0; i < 24; i++) {
          const rx = Math.random() * 1280;
          const ry = Math.random() * 720;
          const rad = 20 + Math.random() * 60;
          const orbGrad = ctx.createRadialGradient(rx, ry, 0, rx, ry, rad);
          orbGrad.addColorStop(0, 'rgba(212, 255, 50, 0.4)');
          orbGrad.addColorStop(1, 'rgba(212, 255, 50, 0)');
          ctx.fillStyle = orbGrad;
          ctx.beginPath();
          ctx.arc(rx, ry, rad, 0, Math.PI * 2);
          ctx.fill();
        }

        // Card typography
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(aiPrompt.slice(0, 48), 640, 360);

        ctx.fillStyle = '#d4ff32';
        ctx.font = 'bold 18px monospace';
        ctx.fillText(`MOVIA AI GENERATION • ${aiStyle.toUpperCase()}`, 640, 410);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setGeneratedPreviewUrl(dataUrl);
      }

      setIsGenerating(false);
      onShowToast('Imagem gerada com sucesso pela IA!');
    }, 1200);
  };

  const handleInsertDirectly = (url: string, type: 'image' | 'video', title: string) => {
    onInsertMediaToTimeline(url, type, title);
    onClose();
  };

  const handleApplyToActiveSceneDirectly = (url: string, type: 'image' | 'video') => {
    if (activeScene && onApplyMediaToScene) {
      onApplyMediaToScene(activeScene.id, url, type);
      onClose();
    } else {
      handleInsertDirectly(url, type, 'Nova Imagem');
    }
  };

  const stockCategories = ['Todos', 'Produtos & Moda', 'Tecnologia & IA', 'Cinema & Cyber', 'Viagem & Cidades', 'Natureza & Espaço'];

  const filteredStock =
    stockCategory === 'Todos'
      ? CURATED_STOCK_MEDIA
      : CURATED_STOCK_MEDIA.filter((s) => s.category === stockCategory);

  return (
    <div
      id="quick-media-insert-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        id="quick-media-insert-card"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[88vh] flex flex-col rounded-2xl border border-white/15 bg-[#12141c] text-neutral-100 shadow-2xl overflow-hidden text-xs"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#161822]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#d4ff32] flex items-center justify-center shadow-[0_0_12px_rgba(212,255,50,0.35)]">
              <Plus className="w-4 h-4 text-black" />
            </div>
            <div>
              <span className="font-bold text-sm text-white">Adicionar Vídeos &amp; Imagens com Facilidade</span>
              <span className="text-[11px] text-neutral-400 block">
                Insira na posição atual ({currentTime.toFixed(2)}s) ou aplique à cena ativa ({activeScene?.title || 'Cena 1'})
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

        {/* Tab Switcher Pills */}
        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-white/5 bg-[#141620]">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'upload'
                ? 'bg-[#d4ff32] text-black font-semibold shadow-xs'
                : 'bg-white/5 hover:bg-white/10 text-neutral-300'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>📁 Upload do Computador</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ai-generate')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'ai-generate'
                ? 'bg-[#d4ff32] text-black font-semibold shadow-xs'
                : 'bg-white/5 hover:bg-white/10 text-neutral-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>✨ Gerar Imagem com IA</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stock')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'stock'
                ? 'bg-[#d4ff32] text-black font-semibold shadow-xs'
                : 'bg-white/5 hover:bg-white/10 text-neutral-300'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>🌐 Galeria de Fotos HD</span>
          </button>
        </div>

        {/* Tab 1: File Upload */}
        {activeTab === 'upload' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Drag and Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-[#d4ff32] bg-[#d4ff32]/10 scale-[1.01]'
                  : 'border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/8'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*,audio/*"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />

              <div className="w-12 h-12 rounded-2xl bg-[#d4ff32]/15 border border-[#d4ff32]/30 flex items-center justify-center mb-3">
                <Upload className="w-6 h-6 text-[#d4ff32]" />
              </div>

              <span className="font-bold text-white text-sm mb-1">
                Arraste seus vídeos e fotos aqui ou clique para selecionar
              </span>
              <span className="text-neutral-400 text-xs text-center max-w-sm">
                Compatível com MP4, WebM, PNG, JPG, WebP e GIFs animados.
              </span>
            </div>

            {/* List of uploaded files */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <span className="font-semibold text-neutral-300 block">Arquivos Carregados:</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {uploadedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl border border-white/10 bg-white/5 flex flex-col justify-between gap-2"
                    >
                      <div className="h-24 w-full rounded-lg overflow-hidden bg-black/50 relative">
                        {file.type === 'image' ? (
                          <img
                            src={file.url}
                            alt=""
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <video
                            src={file.url}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono text-white uppercase">
                          {file.type}
                        </span>
                      </div>

                      <span className="truncate font-medium text-white text-[11px] block">{file.name}</span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleInsertDirectly(file.url, file.type, file.name)}
                          className="flex-1 py-1 rounded-md bg-[#d4ff32] hover:bg-[#bbf438] text-black font-bold text-[10px] transition-colors"
                        >
                          + Na Linha do Tempo
                        </button>
                        {activeScene && (
                          <button
                            type="button"
                            onClick={() => handleApplyToActiveSceneDirectly(file.url, file.type)}
                            className="py-1 px-2 rounded-md bg-white/10 hover:bg-white/20 text-white font-medium text-[10px] transition-colors"
                            title="Substituir na cena ativa"
                          >
                            Na Cena
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: AI Image Generator */}
        {activeTab === 'ai-generate' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="space-y-3">
              <label className="block font-semibold text-neutral-200">
                Descreva a Imagem que você deseja criar com IA:
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerateAI()}
                  placeholder="Ex: Tênis esportivo futurista iluminado por neon ciano sobre asfalto molhado"
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-500 focus:outline-hidden focus:border-[#d4ff32]"
                />

                <button
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={isGenerating}
                  className="px-4 py-2.5 rounded-xl bg-[#d4ff32] hover:bg-[#bbf438] text-black font-extrabold flex items-center gap-1.5 shadow-[0_0_15px_rgba(212,255,50,0.3)] disabled:opacity-50 transition-all active:scale-95"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Gerando...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 fill-black" />
                      <span>Gerar com IA</span>
                    </>
                  )}
                </button>
              </div>

              {/* Quick Prompt Ideas */}
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-[10px] text-neutral-400 font-medium">Sugestões Rápidas:</span>
                {[
                  'Tênis Neon Cyberpunk',
                  'Frasco Sérum Skincare Dourado',
                  'Atleta em corrida noturna com chuva',
                  'Metrópole futurista com naves',
                  'Pessoa com óculos VR em estúdio minimalista',
                ].map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setAiPrompt(sug)}
                    className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-[10px] text-neutral-300 border border-white/5 transition-colors"
                  >
                    + {sug}
                  </button>
                ))}
              </div>

              {/* Style Selector */}
              <div className="pt-2">
                <label className="block text-[11px] font-semibold text-neutral-400 mb-1.5">
                  Estilo Visual:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'cinematic', label: 'Cinemático' },
                    { id: 'cyberpunk', label: 'Cyberpunk Neon' },
                    { id: 'photorealistic', label: 'Foto Realista' },
                    { id: '3d-render', label: '3D Render' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setAiStyle(st.id as any)}
                      className={`py-1.5 rounded-lg border text-center font-medium transition-colors ${
                        aiStyle === st.id
                          ? 'border-[#d4ff32] bg-[#d4ff32]/10 text-[#d4ff32]'
                          : 'border-white/10 bg-white/5 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Generated Preview Card */}
            {generatedPreviewUrl && (
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <span className="font-semibold text-white block">Resultado Gerado:</span>
                <div className="h-44 w-full rounded-xl overflow-hidden bg-black relative border border-white/10">
                  <img
                    src={generatedPreviewUrl}
                    alt="AI Generated Preview"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleInsertDirectly(generatedPreviewUrl, 'image', aiPrompt || 'Quadro IA')}
                    className="px-3.5 py-1.5 rounded-lg bg-[#d4ff32] hover:bg-[#bbf438] text-black font-extrabold flex items-center gap-1.5 shadow-[0_0_15px_rgba(212,255,50,0.3)] transition-all active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Inserir na Linha do Tempo</span>
                  </button>

                  {activeScene && (
                    <button
                      type="button"
                      onClick={() => handleApplyToActiveSceneDirectly(generatedPreviewUrl, 'image')}
                      className="px-3.5 py-1.5 rounded-lg border border-white/20 hover:bg-white/10 text-white font-medium transition-colors"
                    >
                      Aplicar na Cena Ativa ({activeScene.title})
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Curated HD Stock Media */}
        {activeTab === 'stock' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {stockCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setStockCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    stockCategory === cat
                      ? 'bg-[#d4ff32] text-black font-semibold'
                      : 'bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredStock.map((stock) => (
                <div
                  key={stock.id}
                  className="rounded-xl border border-white/10 bg-white/5 overflow-hidden flex flex-col justify-between group hover:border-[#d4ff32]/50 transition-colors"
                >
                  <div className="h-28 w-full relative overflow-hidden bg-black">
                    <img
                      src={stock.url}
                      alt={stock.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 text-[9px] text-neutral-300">
                      {stock.category}
                    </span>
                  </div>

                  <div className="p-2.5 flex-1 flex flex-col justify-between">
                    <span className="font-semibold text-white text-[11px] block truncate mb-2">
                      {stock.title}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleInsertDirectly(stock.url, stock.type, stock.title)}
                        className="flex-1 py-1 rounded-md bg-[#d4ff32] hover:bg-[#bbf438] text-black font-bold text-[10px] transition-colors"
                      >
                        + Timeline
                      </button>
                      {activeScene && (
                        <button
                          type="button"
                          onClick={() => handleApplyToActiveSceneDirectly(stock.url, stock.type)}
                          className="py-1 px-2 rounded-md bg-white/10 hover:bg-white/20 text-white font-medium text-[10px] transition-colors"
                          title="Aplicar na cena ativa"
                        >
                          Cena
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

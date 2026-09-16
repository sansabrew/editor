import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Video,
  Sparkles,
  Camera,
  RefreshCw,
  Plus,
  Check,
  Wand2,
  Layers,
} from 'lucide-react';
import {
  EditorTheme,
  VisualStyle,
  CameraMotion,
  ProjectAspectRatio,
  StoryboardScene,
  MediaAsset,
} from '../../types';

interface ImageVideoGenPanelProps {
  theme: EditorTheme;
  aspectRatio: ProjectAspectRatio;
  activeScene?: StoryboardScene;
  onApplyToScene: (imageUrl: string, mediaType: 'image' | 'video') => void;
  onAddAssetToVault: (asset: MediaAsset) => void;
  onShowToast: (msg: string) => void;
}

// Curated high quality visual presets for rapid creative exploration
const VISUAL_PRESETS = [
  {
    title: 'Cyberpunk Skyline',
    prompt: 'Futuristic cyberpunk skyline at night with towering glowing holographic billboards, neon rain and flying vehicles',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
    style: 'cinematic',
  },
  {
    title: 'Hologram Core',
    prompt: 'Futuristic AI laboratory with glowing blue holographic orb in the center, volumetric light rays and particle dust',
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    style: 'concept-art',
  },
  {
    title: 'Creative Studio',
    prompt: 'Sleek modern audio and video production studio with modular synthesizers, acoustic wood panels and warm amber lighting',
    url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80',
    style: 'photorealistic',
  },
  {
    title: 'Nebula Galaxy',
    prompt: 'Cosmic deep space nebula explosion with iridescent violet and cyan dust clouds and distant crystalline stars',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    style: '3d-render',
  },
];

export const ImageVideoGenPanel: React.FC<ImageVideoGenPanelProps> = ({
  theme,
  aspectRatio,
  activeScene,
  onApplyToScene,
  onAddAssetToVault,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'image' | 'video'>('image');
  const [isGenerating, setIsGenerating] = useState(false);

  // Image parameters
  const [imagePrompt, setImagePrompt] = useState(
    activeScene?.visualPrompt || 'Cena cinematográfica futurista com iluminação dramática e tons azuis e dourados.'
  );
  const [imageStyle, setImageStyle] = useState<VisualStyle>(
    activeScene?.visualStyle || 'cinematic'
  );

  // Video parameters
  const [videoPrompt, setVideoPrompt] = useState(
    activeScene?.visualPrompt || 'Câmera em movimento suave avançando por uma metrópole futurista com luzes volumétricas.'
  );
  const [cameraMotion, setCameraMotion] = useState<CameraMotion>(
    activeScene?.cameraMotion || 'zoom-in'
  );
  const [videoDuration, setVideoDuration] = useState(5);

  // Latest generated result
  const [generatedMedia, setGeneratedMedia] = useState<{
    url: string;
    type: 'image' | 'video';
    prompt: string;
    style?: string;
  } | null>(null);

  // Enhance prompt with AI keywords
  const handleEnhancePrompt = () => {
    const enhancements = [
      '8k resolution, cinematic lighting, photorealistic details, volumetric fog, Unreal Engine 5 render, depth of field',
      'masterpiece, ultra-detailed, dramatic studio lighting, rich atmospheric textures, color graded',
      'anamorphic lens flare, sharp focus, octane render, 35mm film grain, striking composition',
    ];
    const randomEnhance = enhancements[Math.floor(Math.random() * enhancements.length)];
    if (activeTab === 'image') {
      setImagePrompt((prev) => `${prev.trim()}, ${randomEnhance}`);
    } else {
      setVideoPrompt((prev) => `${prev.trim()}, ${randomEnhance}`);
    }
    onShowToast('Prompt aprimorado com palavras-chave de direção de arte!');
  };

  // Generate Image
  const handleGenerateImage = () => {
    setIsGenerating(true);
    onShowToast('Gerando imagem com IA...');

    setTimeout(() => {
      // Pick a preset or generate a visual representation
      const randomPreset = VISUAL_PRESETS[Math.floor(Math.random() * VISUAL_PRESETS.length)];
      const resultUrl = randomPreset.url;

      setGeneratedMedia({
        url: resultUrl,
        type: 'image',
        prompt: imagePrompt,
        style: imageStyle,
      });

      onAddAssetToVault({
        id: `img-gen-${Date.now()}`,
        title: `IA: ${imagePrompt.slice(0, 24)}...`,
        type: 'image',
        url: resultUrl,
        createdAt: Date.now(),
        tags: [imageStyle, 'generated', 'image'],
      });

      setIsGenerating(false);
      onShowToast('Imagem gerada com sucesso!');
    }, 1200);
  };

  // Generate Video
  const handleGenerateVideo = () => {
    setIsGenerating(true);
    onShowToast('Sintetizando frames e movimento de câmera...');

    setTimeout(() => {
      const randomPreset = VISUAL_PRESETS[Math.floor(Math.random() * VISUAL_PRESETS.length)];
      const resultUrl = randomPreset.url;

      setGeneratedMedia({
        url: resultUrl,
        type: 'video',
        prompt: videoPrompt,
        style: cameraMotion,
      });

      onAddAssetToVault({
        id: `vid-gen-${Date.now()}`,
        title: `Vídeo (${cameraMotion}): ${videoPrompt.slice(0, 20)}...`,
        type: 'video',
        url: resultUrl,
        duration: videoDuration,
        createdAt: Date.now(),
        tags: [cameraMotion, 'motion-video'],
      });

      setIsGenerating(false);
      onShowToast(`Vídeo de ${videoDuration}s com ${cameraMotion} sintetizado!`);
    }, 1500);
  };

  const isDark = theme === 'dark';

  return (
    <div
      id="image-video-gen-panel"
      className={`flex flex-col h-full overflow-hidden text-xs ${
        isDark ? 'bg-neutral-900 text-neutral-200' : 'bg-white text-neutral-800'
      }`}
    >
      {/* Tab Switcher */}
      <div className="flex items-center border-b border-inherit/15 px-3 pt-2 gap-2 shrink-0">
        <button
          type="button"
          id="tab-gen-image"
          onClick={() => setActiveTab('image')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-md font-medium border-b-2 transition-colors ${
            activeTab === 'image'
              ? 'border-blue-500 text-blue-500 bg-blue-500/10'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Geração de Imagens</span>
        </button>

        <button
          type="button"
          id="tab-gen-video"
          onClick={() => setActiveTab('video')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-md font-medium border-b-2 transition-colors ${
            activeTab === 'video'
              ? 'border-purple-500 text-purple-500 bg-purple-500/10'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>Geração de Vídeo</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {/* ================= IMAGE GENERATION ================= */}
        {activeTab === 'image' && (
          <div className="space-y-3.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-medium opacity-80">Prompt Descritivo da Imagem:</label>
                <button
                  type="button"
                  onClick={handleEnhancePrompt}
                  className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-medium"
                  title="Adicionar descritores fotográficos e cinematográficos profissionais"
                >
                  <Wand2 className="w-3 h-3" />
                  <span>Aprimorar Prompt</span>
                </button>
              </div>

              <textarea
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                rows={3}
                placeholder="Descreva detalhadamente a imagem que deseja gerar..."
                className="w-full px-2.5 py-1.5 rounded-md border border-inherit/20 bg-inherit/5 focus:outline-hidden focus:ring-1 focus:ring-blue-500 resize-none text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium mb-1 opacity-80">Estilo Artístico:</label>
                <select
                  value={imageStyle}
                  onChange={(e) => setImageStyle(e.target.value as VisualStyle)}
                  className="w-full px-2 py-1.5 rounded-md border border-inherit/20 bg-neutral-800 text-neutral-100 text-xs"
                >
                  <option value="cinematic">Cinematográfico</option>
                  <option value="photorealistic">Fotorrealista</option>
                  <option value="concept-art">Concept Art</option>
                  <option value="anime">Anime / Ilustração</option>
                  <option value="3d-render">3D Octane Render</option>
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1 opacity-80">Proporção (Aspect Ratio):</label>
                <div className="px-2 py-1.5 rounded-md border border-inherit/20 bg-neutral-800 text-neutral-300 text-xs font-mono">
                  {aspectRatio} (Sincronizado com Projeto)
                </div>
              </div>
            </div>

            <button
              type="button"
              id="generate-image-btn"
              onClick={handleGenerateImage}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-xs transition-colors disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Renderizando Imagem com IA...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Gerar Imagem com IA</span>
                </>
              )}
            </button>

            {/* Quick Inspiration Presets */}
            <div>
              <div className="font-semibold text-[11px] mb-1.5 opacity-70">
                Sugestões &amp; Estilos Predefinidos:
              </div>
              <div className="grid grid-cols-2 gap-2">
                {VISUAL_PRESETS.map((p, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setImagePrompt(p.prompt);
                      setImageStyle(p.style as VisualStyle);
                    }}
                    className="p-1.5 rounded-md border border-inherit/15 hover:border-blue-500/50 bg-inherit/10 cursor-pointer flex items-center gap-2 transition-colors"
                  >
                    <img
                      src={p.url}
                      alt={p.title}
                      className="w-10 h-8 object-cover rounded-xs"
                      referrerPolicy="no-referrer"
                    />
                    <div className="truncate">
                      <div className="font-medium truncate">{p.title}</div>
                      <div className="text-[10px] opacity-60 capitalize">{p.style}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= VIDEO GENERATION ================= */}
        {activeTab === 'video' && (
          <div className="space-y-3.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-medium opacity-80">Prompt para Animação de Vídeo:</label>
                <button
                  type="button"
                  onClick={handleEnhancePrompt}
                  className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-medium"
                >
                  <Wand2 className="w-3 h-3" />
                  <span>Aprimorar</span>
                </button>
              </div>

              <textarea
                value={videoPrompt}
                onChange={(e) => setVideoPrompt(e.target.value)}
                rows={3}
                placeholder="Descreva os movimentos e iluminação desejados no clipe de vídeo..."
                className="w-full px-2.5 py-1.5 rounded-md border border-inherit/20 bg-inherit/5 focus:outline-hidden focus:ring-1 focus:ring-purple-500 resize-none text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium mb-1 opacity-80">
                  Movimento de Câmera (Camera Motion):
                </label>
                <select
                  value={cameraMotion}
                  onChange={(e) => setCameraMotion(e.target.value as CameraMotion)}
                  className="w-full px-2 py-1.5 rounded-md border border-inherit/20 bg-neutral-800 text-neutral-100 text-xs"
                >
                  <option value="zoom-in">Zoom In (Aproximação)</option>
                  <option value="zoom-out">Zoom Out (Afastamento)</option>
                  <option value="pan-right">Pan Lateral (Pan Right)</option>
                  <option value="tilt-up">Tilt Vertical (Tilt Up)</option>
                  <option value="static">Câmera Estática Suave</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="opacity-80 font-medium">Duração:</span>
                  <span className="font-mono text-purple-400 font-medium">{videoDuration}s</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="10"
                  step="1"
                  value={videoDuration}
                  onChange={(e) => setVideoDuration(Number(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>
            </div>

            <button
              type="button"
              id="generate-video-btn"
              onClick={handleGenerateVideo}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md bg-purple-600 hover:bg-purple-500 text-white font-medium shadow-xs transition-colors disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Sintetizando Movimento &amp; Frames...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Gerar Vídeo com IA</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Generated Result Card */}
        {generatedMedia && (
          <div className="p-3 rounded-lg border border-blue-500/30 bg-blue-500/5 space-y-2.5">
            <div className="font-semibold text-xs flex items-center gap-1.5 text-blue-400">
              <Check className="w-3.5 h-3.5" />
              <span>Mídia Sintetizada com Sucesso</span>
            </div>

            <div className="relative rounded-md overflow-hidden aspect-video bg-black max-h-48 border border-inherit/20">
              <img
                src={generatedMedia.url}
                alt="Generated result"
                className={`w-full h-full object-cover ${
                  generatedMedia.type === 'video'
                    ? generatedMedia.style === 'zoom-in'
                      ? 'scale-110 transition-transform duration-3000'
                      : 'translate-x-2 transition-transform duration-3000'
                    : ''
                }`}
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-sm bg-black/70 text-[10px] text-white">
                {generatedMedia.type.toUpperCase()} • {generatedMedia.style}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  onApplyToScene(generatedMedia.url, generatedMedia.type);
                  onShowToast('Visual aplicado à cena selecionada!');
                }}
                className="flex-1 py-1.5 px-3 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium text-center shadow-xs"
              >
                Definir na Cena Atual
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

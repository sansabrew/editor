import React, { useState, useRef, useEffect } from 'react';
import {
  Music,
  Volume2,
  Mic,
  Play,
  Pause,
  Sparkles,
  Download,
  Plus,
  Sliders,
  Check,
  RefreshCw,
  Zap,
} from 'lucide-react';
import {
  BGMGenParams,
  SFXGenParams,
  VoiceGenParams,
  EditorTheme,
  MediaAsset,
} from '../../types';
import {
  generateBGMTrack,
  generateSFX,
  playNarrationPreview,
} from '../../utils/audioGenerator';
import { VoiceWaveVisualizer } from './VoiceWaveVisualizer';

interface AudioStudioPanelProps {
  theme: EditorTheme;
  onAddAssetToProject: (asset: MediaAsset) => void;
  onInsertClipToTimeline?: (trackType: string, asset: MediaAsset) => void;
  currentSceneNarration?: string;
  onShowToast: (msg: string) => void;
}

export const AudioStudioPanel: React.FC<AudioStudioPanelProps> = ({
  theme,
  onAddAssetToProject,
  onInsertClipToTimeline,
  currentSceneNarration,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'bgm' | 'sfx' | 'voice'>('bgm');
  const [isGenerating, setIsGenerating] = useState(false);
  const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // BGM parameters
  const [bgmParams, setBgmParams] = useState<BGMGenParams>({
    prompt: 'Trilha sonora relaxante futurista com pads analógicos e batida suave',
    genre: 'synthwave',
    mood: 'epic',
    tempo: 105,
    duration: 16,
    isLoop: true,
  });

  // SFX parameters
  const [sfxParams, setSfxParams] = useState<SFXGenParams>({
    prompt: 'Whoosh de transição rápida com brilho de alta frequência',
    category: 'whoosh',
    duration: 1.5,
    reverb: 0.6,
  });

  // Voice parameters
  const [voiceParams, setVoiceParams] = useState<VoiceGenParams>({
    text: currentSceneNarration || 'Bem-vindo ao novo horizonte da criatividade com inteligência artificial.',
    voiceId: 'pt-BR-natural',
    speed: 1.0,
    pitch: 1.0,
    language: 'pt-BR',
  });
  const [voiceModulation, setVoiceModulation] = useState<number>(0.55);

  // Latest generated preview
  const [latestGenerated, setLatestGenerated] = useState<{
    id: string;
    title: string;
    type: 'audio-bgm' | 'audio-sfx' | 'audio-voice';
    url: string;
    duration: number;
    blob?: Blob;
  } | null>(null);

  // Update voice text if scene narration updates
  useEffect(() => {
    if (currentSceneNarration) {
      setVoiceParams((prev) => ({ ...prev, text: currentSceneNarration }));
    }
  }, [currentSceneNarration]);

  // Handle Play/Pause for generated audio
  const togglePlayAudio = (url: string) => {
    if (playingAudioUrl === url) {
      audioRef.current?.pause();
      setPlayingAudioUrl(null);
    } else {
      if (!audioRef.current) {
        audioRef.current = new Audio(url);
        audioRef.current.onended = () => setPlayingAudioUrl(null);
      } else {
        audioRef.current.src = url;
      }
      audioRef.current.play().catch(() => setPlayingAudioUrl(null));
      setPlayingAudioUrl(url);
    }
  };

  // Generate BGM
  const handleGenerateBGM = async () => {
    setIsGenerating(true);
    try {
      const result = await generateBGMTrack({
        genre: bgmParams.genre,
        mood: bgmParams.mood,
        tempo: bgmParams.tempo,
        duration: bgmParams.duration,
      });

      const newAsset: MediaAsset = {
        id: `gen-bgm-${Date.now()}`,
        title: `${bgmParams.genre.toUpperCase()} - ${bgmParams.mood} (${bgmParams.duration}s)`,
        type: 'audio-bgm',
        url: result.url,
        duration: bgmParams.duration,
        createdAt: Date.now(),
        tags: [bgmParams.genre, bgmParams.mood, `${bgmParams.tempo}bpm`],
        sizeBytes: result.blob.size,
      };

      setLatestGenerated({
        id: newAsset.id,
        title: newAsset.title,
        type: 'audio-bgm',
        url: result.url,
        duration: bgmParams.duration,
        blob: result.blob,
      });

      onAddAssetToProject(newAsset);
      onShowToast(`Trilha ${newAsset.title} gerada com sucesso!`);
    } catch (err) {
      console.error(err);
      onShowToast('Falha na geração de áudio.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate SFX
  const handleGenerateSFX = async () => {
    setIsGenerating(true);
    try {
      const result = await generateSFX({
        category: sfxParams.category,
        duration: sfxParams.duration,
      });

      const newAsset: MediaAsset = {
        id: `gen-sfx-${Date.now()}`,
        title: `SFX ${sfxParams.category.toUpperCase()} (${sfxParams.duration}s)`,
        type: 'audio-sfx',
        url: result.url,
        duration: sfxParams.duration,
        createdAt: Date.now(),
        tags: [sfxParams.category, 'sound-effect'],
        sizeBytes: result.blob.size,
      };

      setLatestGenerated({
        id: newAsset.id,
        title: newAsset.title,
        type: 'audio-sfx',
        url: result.url,
        duration: sfxParams.duration,
        blob: result.blob,
      });

      onAddAssetToProject(newAsset);
      onShowToast(`SFX ${newAsset.title} gerado!`);
    } catch (err) {
      console.error(err);
      onShowToast('Falha ao gerar efeito sonoro.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Play TTS Voice preview
  const handlePlayVoicePreview = async () => {
    if (isPlayingTTS) {
      window.speechSynthesis?.cancel();
      setIsPlayingTTS(false);
      return;
    }

    setIsPlayingTTS(true);
    onShowToast('Sintetizando voz com IA...');
    try {
      await playNarrationPreview(voiceParams.text, {
        rate: voiceParams.speed,
        pitch: voiceParams.pitch,
        voiceName: voiceParams.voiceId,
      });
    } finally {
      setIsPlayingTTS(false);
    }
  };

  // Download generated WAV
  const handleDownloadWav = () => {
    if (!latestGenerated?.url) return;
    const a = document.createElement('a');
    a.href = latestGenerated.url;
    a.download = `${latestGenerated.title.toLowerCase().replace(/\s+/g, '_')}.wav`;
    a.click();
    onShowToast('Download de áudio WAV iniciado.');
  };

  const isDark = theme === 'dark';

  return (
    <div
      id="audio-studio-panel"
      className={`flex flex-col h-full overflow-hidden text-xs ${
        isDark ? 'bg-neutral-900/90 text-neutral-200' : 'bg-white text-neutral-800'
      }`}
    >
      {/* Engine Switcher Tabs */}
      <div className="flex items-center border-b border-inherit/15 px-3 pt-2 gap-2 shrink-0">
        <button
          type="button"
          id="audio-tab-bgm"
          onClick={() => setActiveTab('bgm')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-md font-medium border-b-2 transition-colors ${
            activeTab === 'bgm'
              ? 'border-blue-500 text-blue-500 bg-blue-500/10'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Music className="w-3.5 h-3.5" />
          <span>Música de Fundo (BGM)</span>
        </button>

        <button
          type="button"
          id="audio-tab-sfx"
          onClick={() => setActiveTab('sfx')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-md font-medium border-b-2 transition-colors ${
            activeTab === 'sfx'
              ? 'border-amber-500 text-amber-500 bg-amber-500/10'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Efeitos Sonoros (SFX)</span>
        </button>

        <button
          type="button"
          id="audio-tab-voice"
          onClick={() => setActiveTab('voice')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-md font-medium border-b-2 transition-colors ${
            activeTab === 'voice'
              ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Mic className="w-3.5 h-3.5" />
          <span>Narração &amp; Voz (TTS)</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {/* ===================== BGM TAB ===================== */}
        {activeTab === 'bgm' && (
          <div className="space-y-3.5">
            <div>
              <label className="block font-medium mb-1 opacity-80">
                Prompt de Estilo &amp; Clima Musical:
              </label>
              <textarea
                value={bgmParams.prompt}
                onChange={(e) => setBgmParams({ ...bgmParams, prompt: e.target.value })}
                rows={2}
                placeholder="Ex: Trilha sonora cinematográfica com violoncelos épicos e sintetizadores lentos..."
                className="w-full px-2.5 py-1.5 rounded-md border border-inherit/20 bg-inherit/5 focus:outline-hidden focus:ring-1 focus:ring-blue-500 resize-none text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Genre */}
              <div>
                <label className="block font-medium mb-1 opacity-80">Gênero:</label>
                <select
                  value={bgmParams.genre}
                  onChange={(e) =>
                    setBgmParams({ ...bgmParams, genre: e.target.value as BGMGenParams['genre'] })
                  }
                  className="w-full px-2 py-1.5 rounded-md border border-inherit/20 bg-neutral-800 text-neutral-100 text-xs"
                >
                  <option value="synthwave">Synthwave Futurista</option>
                  <option value="cinematic">Cinemático Orquestral</option>
                  <option value="lo-fi">Lo-Fi Chill Hop</option>
                  <option value="ambient">Espaço &amp; Ambient Drone</option>
                  <option value="acoustic">Acústico &amp; Orgânico</option>
                  <option value="orchestral">Orquestra &amp; Cordas</option>
                </select>
              </div>

              {/* Mood */}
              <div>
                <label className="block font-medium mb-1 opacity-80">Mood / Sensação:</label>
                <select
                  value={bgmParams.mood}
                  onChange={(e) =>
                    setBgmParams({ ...bgmParams, mood: e.target.value as BGMGenParams['mood'] })
                  }
                  className="w-full px-2 py-1.5 rounded-md border border-inherit/20 bg-neutral-800 text-neutral-100 text-xs"
                >
                  <option value="epic">Épico &amp; Grandioso</option>
                  <option value="calm">Calmo &amp; Meditativo</option>
                  <option value="suspenseful">Suspense &amp; Mistério</option>
                  <option value="uplifting">Inspirador &amp; Positivo</option>
                  <option value="melancholic">Nostálgico &amp; Profundo</option>
                  <option value="energetic">Enérgico &amp; Rápido</option>
                </select>
              </div>
            </div>

            {/* Sliders: Tempo & Duration */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="opacity-80">Andamento (BPM):</span>
                  <span className="font-mono font-medium text-blue-400">{bgmParams.tempo} BPM</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="160"
                  step="5"
                  value={bgmParams.tempo}
                  onChange={(e) => setBgmParams({ ...bgmParams, tempo: Number(e.target.value) })}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="opacity-80">Duração:</span>
                  <span className="font-mono font-medium text-blue-400">{bgmParams.duration}s</span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="45"
                  step="2"
                  value={bgmParams.duration}
                  onChange={(e) => setBgmParams({ ...bgmParams, duration: Number(e.target.value) })}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>
            </div>

            <button
              type="button"
              id="generate-bgm-action-btn"
              onClick={handleGenerateBGM}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-xs transition-colors disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Sintetizando Trilha Sonora IA...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Gerar Trilha de Fundo com IA</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* ===================== SFX TAB ===================== */}
        {activeTab === 'sfx' && (
          <div className="space-y-3.5">
            <div>
              <label className="block font-medium mb-1.5 opacity-80">
                Categoria de Efeito Sonoro:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'whoosh', label: 'Whoosh', icon: '💨' },
                  { id: 'impact', label: 'Impacto Sub', icon: '💥' },
                  { id: 'riser', label: 'Riser Crescente', icon: '📈' },
                  { id: 'magic', label: 'Chime & Brilho', icon: '✨' },
                  { id: 'ui-blip', label: 'UI & Sci-Fi', icon: '🔔' },
                  { id: 'ambient', label: 'Drone Ambiente', icon: '🌌' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      setSfxParams({
                        ...sfxParams,
                        category: item.id as SFXGenParams['category'],
                      })
                    }
                    className={`flex items-center gap-1.5 p-2 rounded-md border text-left font-medium transition-all ${
                      sfxParams.category === item.id
                        ? 'border-amber-500 bg-amber-500/15 text-amber-400'
                        : 'border-inherit/20 hover:bg-inherit/10 text-neutral-300'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-medium mb-1 opacity-80">Prompt Opcional:</label>
              <input
                type="text"
                value={sfxParams.prompt}
                onChange={(e) => setSfxParams({ ...sfxParams, prompt: e.target.value })}
                placeholder="Ex: Whoosh veloz com brilho metálico ao final"
                className="w-full px-2.5 py-1.5 rounded-md border border-inherit/20 bg-inherit/5 focus:outline-hidden focus:ring-1 focus:ring-amber-500 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="opacity-80">Duração:</span>
                  <span className="font-mono font-medium text-amber-400">{sfxParams.duration}s</span>
                </div>
                <input
                  type="range"
                  min="0.4"
                  max="4.0"
                  step="0.2"
                  value={sfxParams.duration}
                  onChange={(e) => setSfxParams({ ...sfxParams, duration: Number(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="opacity-80">Reverb / Espaço:</span>
                  <span className="font-mono font-medium text-amber-400">
                    {Math.round(sfxParams.reverb * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={sfxParams.reverb}
                  onChange={(e) => setSfxParams({ ...sfxParams, reverb: Number(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>

            <button
              type="button"
              id="generate-sfx-action-btn"
              onClick={handleGenerateSFX}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md bg-amber-600 hover:bg-amber-500 text-white font-medium shadow-xs transition-colors disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Sintetizando Efeito Sonoro...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Gerar Efeito Sonoro com IA</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* ===================== VOICE / TTS TAB ===================== */}
        {activeTab === 'voice' && (
          <div className="space-y-3.5">
            <div>
              <label className="block font-medium mb-1 opacity-80">
                Texto para Locução &amp; Dublagem:
              </label>
              <textarea
                value={voiceParams.text}
                onChange={(e) => setVoiceParams({ ...voiceParams, text: e.target.value })}
                rows={3}
                placeholder="Digite o texto que a inteligência artificial irá falar..."
                className="w-full px-2.5 py-1.5 rounded-md border border-inherit/20 bg-inherit/5 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 resize-none text-xs"
              />
            </div>

            {/* Real-time wave visualizer */}
            <div className="wave-container">
              <VoiceWaveVisualizer
                pitch={voiceParams.pitch}
                speed={voiceParams.speed}
                modulation={voiceModulation}
                onModulationChange={setVoiceModulation}
                voiceName={voiceParams.voiceId}
                isPlaying={isPlayingTTS}
                compact
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block font-medium mb-1 opacity-80 text-[11px]">Voz do Narrador:</label>
                <select
                  value={voiceParams.voiceId}
                  onChange={(e) => setVoiceParams({ ...voiceParams, voiceId: e.target.value })}
                  className="w-full px-2 py-1.5 rounded-md border border-inherit/20 bg-neutral-800 text-neutral-100 text-xs"
                >
                  <option value="pt-BR-natural">Narrador Brasileiro (Natural)</option>
                  <option value="pt-BR-expressive">Voz Suave &amp; Expressiva (PT-BR)</option>
                  <option value="en-US-cinematic">Cinematic Voiceover (EN-US)</option>
                  <option value="en-US-documentary">Documentary Narrator (EN-US)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] font-medium opacity-80 mb-1">
                  <span>Velocidade:</span>
                  <span className="font-mono text-emerald-400">{voiceParams.speed}x</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.5"
                  step="0.1"
                  value={voiceParams.speed}
                  onChange={(e) =>
                    setVoiceParams({ ...voiceParams, speed: Number(e.target.value) })
                  }
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] font-medium opacity-80 mb-1">
                  <span>Tom / Pitch:</span>
                  <span className="font-mono text-emerald-400">{voiceParams.pitch.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0.6"
                  max="1.5"
                  step="0.1"
                  value={voiceParams.pitch}
                  onChange={(e) =>
                    setVoiceParams({ ...voiceParams, pitch: Number(e.target.value) })
                  }
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                id="voice-preview-btn"
                onClick={handlePlayVoicePreview}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md font-medium shadow-xs transition-colors ${
                  isPlayingTTS
                    ? 'bg-red-600 text-white hover:bg-red-500'
                    : 'bg-emerald-600 text-white hover:bg-emerald-500'
                }`}
              >
                {isPlayingTTS ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Parar Fala</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Ouvir Locução com IA</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  onShowToast('Narração sincronizada com a trilha de voz!');
                  if (onInsertClipToTimeline) {
                    onInsertClipToTimeline('audio-voice', {
                      id: `voice-${Date.now()}`,
                      title: `Voz: ${voiceParams.text.slice(0, 20)}...`,
                      type: 'audio-voice',
                      url: '',
                      duration: Math.max(3, Math.round(voiceParams.text.length / 15)),
                      createdAt: Date.now(),
                      tags: ['tts', 'narration'],
                    });
                  }
                }}
                className="px-3 py-2 rounded-md border border-inherit/20 hover:bg-inherit/10 font-medium flex items-center gap-1.5"
                title="Inserir na Trilha de Voz da Timeline"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>Na Timeline</span>
              </button>
            </div>
          </div>
        )}

        {/* ===================== LATEST GENERATED AUDIO CARD ===================== */}
        {latestGenerated && (
          <div className="mt-4 p-2.5 rounded-lg border border-blue-500/30 bg-blue-500/5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 rounded-md bg-blue-500 text-white">
                  <Volume2 className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <div className="font-semibold truncate">{latestGenerated.title}</div>
                  <div className="text-[10px] opacity-70">
                    Áudio Gerado | {latestGenerated.duration} segundos
                  </div>
                </div>
              </div>

              {/* Play / Pause */}
              <button
                type="button"
                onClick={() => togglePlayAudio(latestGenerated.url)}
                className="p-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-xs"
                title={playingAudioUrl === latestGenerated.url ? 'Pausar' : 'Reproduzir'}
              >
                {playingAudioUrl === latestGenerated.url ? (
                  <Pause className="w-3.5 h-3.5" />
                ) : (
                  <Play className="w-3.5 h-3.5 ml-0.5" />
                )}
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 pt-1 border-t border-inherit/10">
              <button
                type="button"
                onClick={() => {
                  if (onInsertClipToTimeline) {
                    onInsertClipToTimeline(
                      latestGenerated.type === 'audio-bgm' ? 'audio-bgm' : 'audio-sfx',
                      {
                        id: latestGenerated.id,
                        title: latestGenerated.title,
                        type: latestGenerated.type,
                        url: latestGenerated.url,
                        duration: latestGenerated.duration,
                        createdAt: Date.now(),
                        tags: ['generated'],
                      }
                    );
                    onShowToast('Adicionado à Timeline com sucesso!');
                  }
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-md bg-inherit/15 hover:bg-inherit/25 font-medium text-[11px]"
              >
                <Plus className="w-3 h-3 text-blue-400" />
                <span>Inserir na Timeline</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadWav}
                className="flex items-center gap-1 py-1 px-2 rounded-md border border-inherit/20 hover:bg-inherit/10 text-[11px]"
                title="Baixar arquivo de áudio WAV"
              >
                <Download className="w-3 h-3" />
                <span>WAV</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

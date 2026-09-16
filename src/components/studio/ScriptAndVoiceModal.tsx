import React, { useState, useEffect } from 'react';
import {
  FileText,
  Volume2,
  Sparkles,
  Play,
  Square,
  Scissors,
  X,
  Check,
  RotateCcw,
  Sliders,
  Clock,
  Mic,
  ArrowRight,
  ListPlus,
} from 'lucide-react';
import { EditorTheme, StoryboardScene, TimelineClip } from '../../types';
import { playNarrationPreview } from '../../utils/audioGenerator';
import { VoiceWaveVisualizer } from './VoiceWaveVisualizer';

interface ScriptAndVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenes: StoryboardScene[];
  onUpdateScenes: (scenes: StoryboardScene[]) => void;
  onSyncVoiceClipsToTimeline: (clips: TimelineClip[]) => void;
  theme: EditorTheme;
  onShowToast: (msg: string) => void;
}

// AI Script Presets
const SCRIPT_PRESETS = [
  {
    id: 'preset-commercial',
    label: 'Comercial de Tênis Esportivo',
    text: `A noite não é um limite. É o seu novo terreno de propulsão.\nSinta a resposta instantânea em cada passada. Menos gravidade, mais controle e velocidade absoluta.\nNovo Movia Cyber Runner. Ultrapasse o que achava possível. Desafie a gravidade agora.`,
  },
  {
    id: 'preset-skincare',
    label: 'Skincare & Beleza Minimalista',
    text: `Sua pele merece uma fórmula sob medida. Simples, pura e livre de excessos.\nAbsorção instantânea com ativos dermatológicos de alta performance.\nDescubra a sua melhor versão todos os dias. O cuidado que transforma de dentro para fora.`,
  },
  {
    id: 'preset-scifi',
    label: 'Teaser Épico Cinemático',
    text: `No limiar do desconhecido, um sinal antigo desperta além da órbita dos planetas conhecidos.\nA civilização acreditava estar segura, até que os códigos começaram a reescrever a si mesmos.\nA fronteira entre o criador e a criação nunca mais será a mesma. Prepare-se.`,
  },
  {
    id: 'preset-tech',
    label: 'Pitch de Produto & IA',
    text: `Produzir vídeos cinematográficos não precisa mais levar semanas de edição exaustiva.\nCom o Movia Studio, seu roteiro vira vídeo, som e legendas com um simples clique.\nCrie mais rápido. Engaje mais. Comece a criar o seu próximo projeto agora mesmo.`,
  },
];

export const ScriptAndVoiceModal: React.FC<ScriptAndVoiceModalProps> = ({
  isOpen,
  onClose,
  scenes,
  onUpdateScenes,
  onSyncVoiceClipsToTimeline,
  theme,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'script' | 'voice'>('script');

  // Script text state (combined from scenes or editable freeform)
  const [scriptText, setScriptText] = useState<string>('');

  // Voice playback options
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [speechPitch, setSpeechPitch] = useState<number>(1.0);
  const [speechModulation, setSpeechModulation] = useState<number>(0.55);
  const [isPlayingVoice, setIsPlayingVoice] = useState<boolean>(false);
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState<number | null>(null);

  // Initialize script text from current scenes
  useEffect(() => {
    if (scenes.length > 0) {
      const combined = scenes.map((s) => s.narrationText).filter(Boolean).join('\n\n');
      setScriptText(combined);
    }
  }, [scenes, isOpen]);

  // Load browser voices
  useEffect(() => {
    const loadVoices = () => {
      if ('speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
        const ptVoice = voices.find((v) => v.lang.includes('pt') || v.name.includes('Brazil') || v.name.includes('Portuguese'));
        if (ptVoice) {
          setSelectedVoiceName(ptVoice.name);
        } else if (voices.length > 0) {
          setSelectedVoiceName(voices[0].name);
        }
      }
    };

    loadVoices();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  if (!isOpen) return null;

  // Convert script text into structured scenes
  const handleConvertScriptToScenes = () => {
    if (!scriptText.trim()) {
      onShowToast('Digite ou gere um roteiro antes de converter.');
      return;
    }

    // Split by double newline or single newline
    const paragraphs = scriptText
      .split(/\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    if (paragraphs.length === 0) return;

    // Build new storyboard scenes
    const newScenes: StoryboardScene[] = paragraphs.map((text, idx) => {
      // Calculate realistic duration based on word count (~2.5 words per second)
      const wordCount = text.split(/\s+/).length;
      const calculatedDuration = Math.max(3.5, Math.min(12, Math.round((wordCount / 2.3) * 10) / 10));

      // Existing scene to preserve visualMediaUrl if available
      const existing = scenes[idx];

      return {
        id: existing?.id || `scene-scr-${Date.now()}-${idx}`,
        order: idx + 1,
        title: `Cena ${idx + 1}: ${text.slice(0, 24)}...`,
        duration: calculatedDuration,
        narrationText: text,
        visualPrompt: existing?.visualPrompt || `Cena cinematográfica ilustrando: ${text.slice(0, 80)}`,
        visualStyle: existing?.visualStyle || 'cinematic',
        visualMediaType: existing?.visualMediaType || 'image',
        visualMediaUrl: existing?.visualMediaUrl || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=80',
        voiceId: selectedVoiceName || 'pt-BR-natural',
        transition: idx === 0 ? 'cut' : 'crossfade',
        cameraMotion: idx % 2 === 0 ? 'zoom-in' : 'pan-right',
        filter: 'cinematic',
      };
    });

    onUpdateScenes(newScenes);

    // Also build audio voice clips for timeline
    let runningTime = 0;
    const voiceClips: TimelineClip[] = newScenes.map((sc, i) => {
      const clip: TimelineClip = {
        id: `voice-clip-${sc.id}`,
        trackId: 'track-voice-1',
        name: `Voz: Cena ${i + 1}`,
        startTime: runningTime,
        duration: sc.duration,
        mediaType: 'audio',
        volume: 0.95,
        textContent: sc.narrationText,
        color: '#8b5cf6',
      };
      runningTime += sc.duration;
      return clip;
    });

    onSyncVoiceClipsToTimeline(voiceClips);
    onShowToast(`Roteiro dividido em ${newScenes.length} cenas e vozes adicionadas à timeline!`);
    onClose();
  };

  // Play narration of full script or single scene
  const handlePlayVoice = async (textToSpeak: string, index?: number) => {
    if (isPlayingVoice) {
      window.speechSynthesis?.cancel();
      setIsPlayingVoice(false);
      setCurrentPlayingIndex(null);
      return;
    }

    if (!textToSpeak.trim()) {
      onShowToast('Não há texto para narrar.');
      return;
    }

    setIsPlayingVoice(true);
    if (index !== undefined) setCurrentPlayingIndex(index);

    try {
      await playNarrationPreview(textToSpeak, {
        rate: speechRate,
        pitch: speechPitch,
        voiceName: selectedVoiceName,
      });
    } finally {
      setIsPlayingVoice(false);
      setCurrentPlayingIndex(null);
    }
  };

  const handleStopVoice = () => {
    window.speechSynthesis?.cancel();
    setIsPlayingVoice(false);
    setCurrentPlayingIndex(null);
  };

  return (
    <div
      id="script-voice-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        id="script-voice-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[88vh] flex flex-col rounded-2xl border border-white/15 bg-[#12141c] text-neutral-100 shadow-2xl overflow-hidden text-xs"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#161822]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#d4ff32] flex items-center justify-center shadow-[0_0_12px_rgba(212,255,50,0.35)]">
              <Mic className="w-4 h-4 text-black" />
            </div>
            <div>
              <span className="font-bold text-sm text-white">Roteiro &amp; Narração com Voz IA</span>
              <span className="text-[11px] text-neutral-400 block">
                Escreva, gere com IA e transforme seu roteiro em cenas e áudios sincronizados na linha do tempo.
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              handleStopVoice();
              onClose();
            }}
            className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-white/5 bg-[#141620]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('script')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'script'
                  ? 'bg-[#d4ff32] text-black font-semibold shadow-xs'
                  : 'bg-white/5 hover:bg-white/10 text-neutral-300'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>1. Escrever / Gerar Roteiro</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('voice')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'voice'
                  ? 'bg-[#d4ff32] text-black font-semibold shadow-xs'
                  : 'bg-white/5 hover:bg-white/10 text-neutral-300'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>2. Voz &amp; Narração (TTS)</span>
            </button>
          </div>

          {/* Quick Listen Button */}
          <div className="flex items-center gap-2">
            {isPlayingVoice ? (
              <button
                type="button"
                onClick={handleStopVoice}
                className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-400 text-white font-bold flex items-center gap-1.5 animate-pulse"
              >
                <Square className="w-3.5 h-3.5 fill-white" />
                <span>Parar Narração</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handlePlayVoice(scriptText)}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium flex items-center gap-1.5 transition-colors"
                title="Ouvir o roteiro completo falado por voz sintetizada"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Ouvir Voz</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: Script Writer */}
        {activeTab === 'script' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Presets Bar */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-neutral-400">
                Modelos de Roteiro Prontos com IA:
              </label>
              <div className="flex flex-wrap gap-2">
                {SCRIPT_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setScriptText(preset.text);
                      onShowToast(`Roteiro "${preset.label}" carregado.`);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 flex items-center gap-1.5 transition-colors text-[11px]"
                  >
                    <Sparkles className="w-3 h-3 text-[#d4ff32]" />
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Script Text Area */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-neutral-400">
                <span>Texto do Roteiro (separe os parágrafos para criar cenas diferentes):</span>
                <span>{scriptText.split(/\s+/).filter(Boolean).length} palavras</span>
              </div>

              <textarea
                value={scriptText}
                onChange={(e) => setScriptText(e.target.value)}
                rows={7}
                placeholder="Cole ou escreva seu roteiro aqui..."
                className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-500 focus:outline-hidden focus:border-[#d4ff32] font-sans text-xs leading-relaxed resize-none"
              />
            </div>

            {/* Action Bar */}
            <div className="p-4 rounded-2xl bg-[#d4ff32]/10 border border-[#d4ff32]/30 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <span className="font-bold text-white text-sm block">
                  Transformar Roteiro em Cenas &amp; Vozes
                </span>
                <span className="text-neutral-400 text-xs">
                  Cria as tomadas na linha do tempo com durações automáticas e clipes de áudio.
                </span>
              </div>

              <button
                type="button"
                id="convert-script-btn"
                onClick={handleConvertScriptToScenes}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#d4ff32] hover:bg-[#bbf438] text-black font-extrabold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(212,255,50,0.35)] transition-all active:scale-95 text-xs"
              >
                <Scissors className="w-4 h-4" />
                <span>✂️ Converter em Cenas na Timeline</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Voice & Narration Config */}
        {activeTab === 'voice' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Real-Time Wave Visualization Bar */}
            <div className="wave-container">
              <VoiceWaveVisualizer
                pitch={speechPitch}
                speed={speechRate}
                modulation={speechModulation}
                onModulationChange={setSpeechModulation}
                voiceName={selectedVoiceName}
                isPlaying={isPlayingVoice}
              />
            </div>

            {/* Voice controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
              {/* Voice selector */}
              <div>
                <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                  Voz do Sistema (TTS):
                </label>
                <select
                  value={selectedVoiceName}
                  onChange={(e) => setSelectedVoiceName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-white/15 text-white text-xs focus:outline-hidden focus:border-[#d4ff32]"
                >
                  {availableVoices.length > 0 ? (
                    availableVoices.map((v) => (
                      <option key={v.name} value={v.name}>
                        {v.name} ({v.lang})
                      </option>
                    ))
                  ) : (
                    <option value="">Voz Padrão do Navegador</option>
                  )}
                </select>
              </div>

              {/* Speed / Rate */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-300 mb-1">
                  <span>Velocidade de Fala:</span>
                  <span className="font-mono text-[#d4ff32]">{speechRate.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.6"
                  max="1.8"
                  step="0.1"
                  value={speechRate}
                  onChange={(e) => setSpeechRate(Number(e.target.value))}
                  className="w-full accent-[#d4ff32] cursor-pointer"
                />
              </div>

              {/* Pitch */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-300 mb-1">
                  <span>Tom da Voz (Pitch):</span>
                  <span className="font-mono text-[#d4ff32]">{speechPitch.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0.6"
                  max="1.5"
                  step="0.1"
                  value={speechPitch}
                  onChange={(e) => setSpeechPitch(Number(e.target.value))}
                  className="w-full accent-[#d4ff32] cursor-pointer"
                />
              </div>

              {/* Modulation */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-300 mb-1">
                  <span>Modulação Harmônica:</span>
                  <span className="font-mono text-[#d4ff32]">{Math.round(speechModulation * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={speechModulation}
                  onChange={(e) => setSpeechModulation(Number(e.target.value))}
                  className="w-full accent-[#d4ff32] cursor-pointer"
                />
              </div>
            </div>

            {/* List of current scene narrations to test individual speech */}
            <div className="space-y-2">
              <span className="font-bold text-white text-xs block">
                Narração de Cada Cena ({scenes.length} tomadas):
              </span>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {scenes.map((scene, idx) => (
                  <div
                    key={scene.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                      currentPlayingIndex === idx
                        ? 'border-[#d4ff32] bg-[#d4ff32]/10 ring-1 ring-[#d4ff32]'
                        : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="w-5 h-5 rounded bg-[#d4ff32]/20 text-[#d4ff32] font-mono font-bold flex items-center justify-center text-[10px] shrink-0">
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <span className="font-semibold text-white block text-[11px] truncate">
                          {scene.title}
                        </span>
                        <p className="text-neutral-400 text-[11px] line-clamp-1 italic">
                          "{scene.narrationText || 'Sem narração definida'}"
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-neutral-400 text-[10px]">{scene.duration}s</span>
                      <button
                        type="button"
                        onClick={() => handlePlayVoice(scene.narrationText, idx)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          currentPlayingIndex === idx
                            ? 'bg-red-500 text-white'
                            : 'bg-white/10 hover:bg-[#d4ff32] hover:text-black text-neutral-200'
                        }`}
                        title="Ouvir voz desta cena"
                      >
                        {currentPlayingIndex === idx ? (
                          <Square className="w-3.5 h-3.5 fill-current" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom confirmation */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  onShowToast('Preferências de voz atualizadas!');
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-[#d4ff32] hover:bg-[#bbf438] text-black font-extrabold flex items-center gap-1.5 transition-all active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Configurações de Voz</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

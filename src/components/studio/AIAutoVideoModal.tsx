import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Film,
  Music,
  FileText,
  Upload,
  Volume2,
  RefreshCw,
  Edit3,
  Trash2,
  Plus,
  Play,
  Pause,
  Check,
  ChevronRight,
  Sliders,
  User,
  MapPin,
  Clock,
  Layers,
  Wand2,
  X,
  AudioWaveform,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  Video,
} from 'lucide-react';
import {
  AutoVideoInputMode,
  VisualContinuityStyle,
  CharacterProfile,
  LocationProfile,
  SubtitleStyle,
  VoiceProfileConfig,
  AutomationLevel,
  AutoSceneDraft,
  AIDirectorInsights,
  MultimediaProject,
  ProjectAspectRatio,
  EditorTheme,
} from '../../types';
import {
  DEFAULT_VOICE_PROFILES,
  analyzeScriptAndBuildScenes,
  expandIdeaToScreenplay,
  transcribeAudioFile,
  modifySceneWithAI,
  compileAutoVideoProject,
  getSampleMediaForStyle,
} from '../../utils/aiAutoDirector';
import { playNarrationPreview } from '../../utils/audioGenerator';
import { VoiceWaveVisualizer } from './VoiceWaveVisualizer';

interface AIAutoVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (project: MultimediaProject) => void;
  currentScriptText?: string;
  theme: EditorTheme;
  onShowToast: (msg: string) => void;
}

export const AIAutoVideoModal: React.FC<AIAutoVideoModalProps> = ({
  isOpen,
  onClose,
  onProjectCreated,
  currentScriptText = '',
  theme,
  onShowToast,
}) => {
  if (!isOpen) return null;

  // Multi-step workflow:
  // 1: Entrada (Roteiro / Narração / Ideia + Configurações)
  // 2: Análise da IA & Continuidade (Personagens, Locais, Voz, Mix)
  // 3: Storyboard & Revisão das Cenas (Editar, Regenerar, Editar com IA)
  // 4: Geração em Lote com Progresso
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1 State
  const [inputMode, setInputMode] = useState<AutoVideoInputMode>('script');
  const [title, setTitle] = useState('');
  const [scriptText, setScriptText] = useState(
    currentScriptText.trim() ||
      `# A Revolução das Cidades Inteligentes

Em 2050, as metrópoles serão completamente orquestradas por inteligência artificial e energia limpa.

Veículos autônomos circulam silenciosamente por avenidas arborizadas e viadutos suspensos.

Cidadãos interagem com interfaces holográficas que traduzem dados urbanos em tempo real.

A conexão entre a imaginação humana e a tecnologia constrói um horizonte sem precedentes.`
  );

  const [ideaText, setIdeaText] = useState(
    'Um documentário cinematográfico sobre a primeira colônia humana autossustentável em Marte no ano de 2050.'
  );

  const [targetDuration, setTargetDuration] = useState<number>(30); // 15, 30, 60, 90, 0 (auto)
  const [aspectRatio, setAspectRatio] = useState<ProjectAspectRatio>('16:9');
  const [visualStyle, setVisualStyle] = useState<VisualContinuityStyle>('cinematic');

  // Audio Narration State
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const audioInputRef = useRef<HTMLInputElement>(null);

  // Step 2 & 3 State (AI Analyzer Output)
  const [characters, setCharacters] = useState<CharacterProfile[]>([]);
  const [locations, setLocations] = useState<LocationProfile[]>([]);
  const [scenes, setScenes] = useState<AutoSceneDraft[]>([]);
  const [insights, setInsights] = useState<AIDirectorInsights | null>(null);

  // Voice Configuration
  const [selectedVoice, setSelectedVoice] = useState<VoiceProfileConfig>(DEFAULT_VOICE_PROFILES[0]);
  const [voiceSpeed, setVoiceSpeed] = useState(0.95);
  const [voicePitch, setVoicePitch] = useState(0.9);
  const [voiceModulation, setVoiceModulation] = useState<number>(0.65);
  const [applyVoiceToAll, setApplyVoiceToAll] = useState(true);
  const [isPlayingVoiceSample, setIsPlayingVoiceSample] = useState(false);

  // When changing voice profile, adapt acoustics
  const handleSelectVoiceProfile = (vp: VoiceProfileConfig) => {
    setSelectedVoice(vp);
    setVoiceSpeed(vp.speed);
    setVoicePitch(vp.pitch);
    const modMap: Record<string, number> = {
      cinematografica: 0.8,
      dramatico: 0.75,
      documentario: 0.5,
      comercial: 0.7,
      motivacional: 0.6,
      futurista: 0.85,
      natural: 0.45,
    };
    setVoiceModulation(modMap[vp.archetype] ?? 0.6);
  };

  // Audio Features
  const [generateBGM, setGenerateBGM] = useState(true);
  const [generateSFX, setGenerateSFX] = useState(true);
  const [enableAutoMix, setEnableAutoMix] = useState(true);
  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyle>('cinematic');
  const [automationLevel, setAutomationLevel] = useState<AutomationLevel>('diretor');

  // Scene Editing & AI Edit state
  const [editingSceneIndex, setEditingSceneIndex] = useState<number | null>(null);
  const [aiEditSceneIndex, setAiEditSceneIndex] = useState<number | null>(null);
  const [aiEditInstruction, setAiEditInstruction] = useState('');

  // Scene Regenerate Modal state
  const [regenerateSceneIndex, setRegenerateSceneIndex] = useState<number | null>(null);
  const [regenerateAspect, setRegenerateAspect] = useState<'image' | 'voice' | 'text' | 'duration' | 'style'>('image');
  const [regenerateInstruction, setRegenerateInstruction] = useState('');

  // Step 4: Batch Generation Progress
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentGeneratingScene, setCurrentGeneratingScene] = useState(1);
  const [generationStepStatus, setGenerationStepStatus] = useState<string>('Iniciando análise neural...');
  const [isGenerationComplete, setIsGenerationComplete] = useState(false);
  const [compiledProject, setCompiledProject] = useState<MultimediaProject | null>(null);

  // Handle Idea Expansion
  const handleExpandIdea = () => {
    if (!ideaText.trim()) return;
    const expanded = expandIdeaToScreenplay(ideaText);
    setTitle(expanded.title);
    setScriptText(expanded.script);
    setInputMode('script');
    onShowToast('Ideia expandida em roteiro cinematográfico com sucesso!');
  };

  // Handle Audio File Selection
  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAudioFile(file);
    const blobUrl = URL.createObjectURL(file);
    setAudioUrl(blobUrl);

    setIsTranscribing(true);
    onShowToast('Analisando áudio, frequências e pausas com IA...');

    try {
      const result = await transcribeAudioFile(file);
      setScriptText(result.transcript);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
      setTargetDuration(Math.round(result.duration));
      onShowToast(`Áudio de ${Math.round(result.duration)}s transcrito e mapeado em cenas!`);
    } catch (err) {
      console.error(err);
      onShowToast('Erro ao processar áudio. Usando roteiro padrão.');
    } finally {
      setIsTranscribing(false);
    }
  };

  // Run AI Script Analyzer & Proceed to Step 2
  const handleProceedToAnalysis = () => {
    const content = inputMode === 'idea' ? ideaText : scriptText;
    if (!content.trim()) {
      onShowToast('Por favor, insira um roteiro, ideia ou áudio para continuar.');
      return;
    }

    let finalScript = scriptText;
    if (inputMode === 'idea') {
      const exp = expandIdeaToScreenplay(ideaText);
      finalScript = exp.script;
      setScriptText(exp.script);
      if (!title) setTitle(exp.title);
    }

    const analyzed = analyzeScriptAndBuildScenes(finalScript, {
      title: title.trim() || undefined,
      targetDuration: targetDuration > 0 ? targetDuration : undefined,
      visualStyle,
      primaryVoice: selectedVoice,
    });

    if (!title) setTitle(analyzed.projectTitle);
    setCharacters(analyzed.characters);
    setLocations(analyzed.locations);
    setScenes(analyzed.scenes);
    setInsights(analyzed.insights);

    setCurrentStep(2);
    onShowToast('Roteiro analisado! Personagens, cenários e cenas detectados.');
  };

  // Test Voice Sample
  const handlePlayVoicePreview = async () => {
    if (isPlayingVoiceSample) return;
    setIsPlayingVoiceSample(true);
    try {
      await playNarrationPreview(selectedVoice.samplePhrase, {
        rate: voiceSpeed,
        pitch: voicePitch,
        voiceName: selectedVoice.gender === 'masculino' ? 'Male' : 'Female',
      });
    } finally {
      setIsPlayingVoiceSample(false);
    }
  };

  // Apply "Editar com IA" to a scene
  const handleApplyAiEdit = (sceneIndex: number) => {
    if (!aiEditInstruction.trim()) return;

    const targetScene = scenes[sceneIndex];
    if (!targetScene) return;

    const modified = modifySceneWithAI(targetScene, aiEditInstruction, visualStyle);
    const updatedScenes = [...scenes];
    updatedScenes[sceneIndex] = modified;
    setScenes(updatedScenes);

    setAiEditSceneIndex(null);
    setAiEditInstruction('');
    onShowToast(`Cena ${sceneIndex + 1} modificada com a instrução do Diretor IA!`);
  };

  // Apply Regenerate to a scene
  const handleApplyRegenerate = () => {
    if (regenerateSceneIndex === null) return;
    const targetScene = scenes[regenerateSceneIndex];
    if (!targetScene) return;

    const updated = { ...targetScene };
    const instruction = regenerateInstruction.trim() || 'Melhorar composição e estilo';

    if (regenerateAspect === 'image') {
      updated.visualMediaUrl = getSampleMediaForStyle(visualStyle, regenerateSceneIndex + 2);
      updated.visualPrompt += `, regenerado com foco em ${instruction}`;
    } else if (regenerateAspect === 'voice') {
      updated.voiceStyle = 'dramatico';
      updated.description += ` (Voz ajustada para ${instruction})`;
    } else if (regenerateAspect === 'duration') {
      updated.duration = Math.max(3, updated.duration + 2);
    } else if (regenerateAspect === 'text') {
      updated.narrationText = `${updated.narrationText} ${instruction}`;
    }

    const updatedScenes = [...scenes];
    updatedScenes[regenerateSceneIndex] = updated;
    setScenes(updatedScenes);

    setRegenerateSceneIndex(null);
    setRegenerateInstruction('');
    onShowToast(`Cena ${regenerateSceneIndex + 1} regenerada com sucesso!`);
  };

  // Delete Scene
  const handleDeleteScene = (idx: number) => {
    if (scenes.length <= 1) {
      onShowToast('O vídeo deve ter pelo menos uma cena.');
      return;
    }
    const updated = scenes.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i + 1 }));
    setScenes(updated);
    onShowToast(`Cena ${idx + 1} removida.`);
  };

  // Add New Scene
  const handleAddScene = () => {
    const newIdx = scenes.length + 1;
    const newScene: AutoSceneDraft = {
      id: `draft-scene-custom-${Date.now()}`,
      order: newIdx,
      title: `Cena ${newIdx}: Novo Plano`,
      description: `Cena adicional inserida no storyboard.`,
      narrationText: `Texto narrativo para a nova cena ${newIdx}.`,
      duration: 5,
      visualPrompt: `Plano cinematográfico adicional no estilo ${visualStyle}, com iluminação volumétrica e lentes de alta definição.`,
      visualMediaUrl: getSampleMediaForStyle(visualStyle, newIdx),
      visualMediaType: 'image',
      voiceId: selectedVoice.id,
      voiceStyle: selectedVoice.archetype,
      sfxCategory: 'whoosh',
      sfxPrompt: 'Transição suave com whoosh e brilho',
      status: 'ready',
    };
    setScenes([...scenes, newScene]);
    onShowToast('Nova cena adicionada ao storyboard!');
  };

  // Launch Batch Project Generation (Step 4)
  const handleStartBatchGeneration = () => {
    setCurrentStep(4);
    setGenerationProgress(5);
    setIsGenerationComplete(false);
    setGenerationStepStatus('Compilando roteiro e prompts neurais...');

    let progress = 10;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 8) + 6;

      if (progress < 25) {
        setGenerationStepStatus('Sintetizando vozes e cadência de áudio...');
      } else if (progress < 60) {
        const sceneNum = Math.min(scenes.length, Math.ceil((progress / 60) * scenes.length));
        setCurrentGeneratingScene(sceneNum);
        setGenerationStepStatus(`Gerando imagens com continuidade visual (Cena ${sceneNum} de ${scenes.length})...`);
      } else if (progress < 80) {
        setGenerationStepStatus('Gerando trilha sonora e posicionando efeitos SFX...');
      } else if (progress < 95) {
        setGenerationStepStatus('Executando AI Auto Mix e sincronizando legendas na timeline...');
      } else if (progress >= 100) {
        clearInterval(interval);
        setGenerationProgress(100);
        setGenerationStepStatus('Projeto estruturado com sucesso! Pronto para edição.');
        setIsGenerationComplete(true);

        // Compile final project
        const project = compileAutoVideoProject({
          projectTitle: title || 'Vídeo Automático IA',
          scenes,
          aspectRatio,
          visualStyle,
          primaryVoice: selectedVoice,
          subtitleStyle,
          characters,
          locations,
          insights: insights || {
            pacingScore: 95,
            continuityScore: 97,
            audioBalance: 'Normalizado',
            directorNotes: [],
            suggestedEnhancements: [],
            lastUpdated: Date.now(),
          },
          automationLevel,
          generateMusic: generateBGM,
          generateSFX,
          audioNarrationUrl: audioUrl || undefined,
        });

        setCompiledProject(project);
      }
      setGenerationProgress(Math.min(100, progress));
    }, 280);
  };

  // Complete and load project
  const handleOpenCreatedProject = () => {
    if (!compiledProject) return;
    onProjectCreated(compiledProject);
    onClose();
    onShowToast(`Projeto "${compiledProject.title}" pronto e aberto para edição!`);
  };

  return (
    <div
      id="ai-auto-video-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto"
    >
      <div
        id="ai-auto-video-modal-dialog"
        className="w-full max-w-5xl bg-[#0e1017] border border-white/15 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-neutral-100"
      >
        {/* Modal Top Header with Stepper */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#13151f] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#d4ff32] flex items-center justify-center text-black shadow-[0_0_20px_rgba(212,255,50,0.35)]">
              <Sparkles className="w-5 h-5 fill-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                  <span>AI AUTO VIDEO</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#d4ff32]/20 border border-[#d4ff32]/40 text-[#d4ff32] text-[10px] font-mono font-bold uppercase tracking-wider">
                    DIRETOR IA
                  </span>
                </h2>
              </div>
              <p className="text-xs text-neutral-400">
                Transforme seu roteiro, áudio ou ideia em um vídeo completo e 100% editável
              </p>
            </div>
          </div>

          {/* Stepper indicator */}
          <div className="hidden md:flex items-center gap-2 text-xs">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${
                currentStep === 1
                  ? 'bg-[#d4ff32] text-black font-bold'
                  : currentStep > 1
                  ? 'bg-white/10 text-neutral-200'
                  : 'text-neutral-500'
              }`}
            >
              <span>1. Entrada</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${
                currentStep === 2
                  ? 'bg-[#d4ff32] text-black font-bold'
                  : currentStep > 2
                  ? 'bg-white/10 text-neutral-200'
                  : 'text-neutral-500'
              }`}
            >
              <span>2. Análise &amp; Continuidade</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${
                currentStep === 3
                  ? 'bg-[#d4ff32] text-black font-bold'
                  : currentStep > 3
                  ? 'bg-white/10 text-neutral-200'
                  : 'text-neutral-500'
              }`}
            >
              <span>3. Storyboard</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${
                currentStep === 4 ? 'bg-[#d4ff32] text-black font-bold' : 'text-neutral-500'
              }`}
            >
              <span>4. Geração</span>
            </div>
          </div>

          <button
            type="button"
            id="close-auto-video-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* ========================================================= */}
          {/* STEP 1: ENTRADA (Roteiro, Narração, Ideia & Configurações) */}
          {/* ========================================================= */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fadeIn">
              {/* Input Mode Selector Tabs */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                  Escolha como deseja iniciar seu vídeo:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setInputMode('script')}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      inputMode === 'script'
                        ? 'bg-[#d4ff32]/10 border-[#d4ff32] text-white shadow-[0_0_20px_rgba(212,255,50,0.15)]'
                        : 'bg-[#151722] border-white/10 hover:border-white/20 text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <FileText className={`w-5 h-5 ${inputMode === 'script' ? 'text-[#d4ff32]' : 'text-neutral-400'}`} />
                      <span className="font-bold text-sm">Criar a partir de roteiro</span>
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Cole seu texto, falas ou script detalhado com divisão natural de cenas.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInputMode('narration')}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      inputMode === 'narration'
                        ? 'bg-[#d4ff32]/10 border-[#d4ff32] text-white shadow-[0_0_20px_rgba(212,255,50,0.15)]'
                        : 'bg-[#151722] border-white/10 hover:border-white/20 text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Volume2 className={`w-5 h-5 ${inputMode === 'narration' ? 'text-[#d4ff32]' : 'text-neutral-400'}`} />
                      <span className="font-bold text-sm">Criar a partir de narração</span>
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Importe um áudio (MP3/WAV) para transcrever, detectar pausas e sincronizar imagens.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInputMode('idea')}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      inputMode === 'idea'
                        ? 'bg-[#d4ff32]/10 border-[#d4ff32] text-white shadow-[0_0_20px_rgba(212,255,50,0.15)]'
                        : 'bg-[#151722] border-white/10 hover:border-white/20 text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Wand2 className={`w-5 h-5 ${inputMode === 'idea' ? 'text-[#d4ff32]' : 'text-neutral-400'}`} />
                      <span className="font-bold text-sm">Criar a partir de uma ideia</span>
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Descreva uma ideia resumida e a IA criará o roteiro cinematográfico completo.
                    </p>
                  </button>
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Título do Projeto:
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Cidades de 2050 — O Futuro da Humanidade"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#151722] border border-white/15 text-white placeholder-neutral-500 text-sm focus:outline-hidden focus:border-[#d4ff32]"
                />
              </div>

              {/* Mode: Narration File Dropzone */}
              {inputMode === 'narration' && (
                <div className="p-5 rounded-xl border border-dashed border-white/20 bg-[#141620] space-y-3">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#d4ff32]/10 text-[#d4ff32] flex items-center justify-center shrink-0">
                        <AudioWaveform className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-white">Importar Arquivo de Narração</h4>
                        <p className="text-xs text-neutral-400">
                          Formatos aceitos: MP3, WAV, M4A, AAC, OGG
                        </p>
                      </div>
                    </div>

                    <input
                      ref={audioInputRef}
                      type="file"
                      accept="audio/*"
                      onChange={handleAudioUpload}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => audioInputRef.current?.click()}
                      disabled={isTranscribing}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors shrink-0"
                    >
                      <Upload className="w-4 h-4" />
                      <span>{audioFile ? 'Substituir Áudio' : 'Selecionar Áudio'}</span>
                    </button>
                  </div>

                  {audioFile && (
                    <div className="p-3 rounded-lg bg-black/40 border border-white/10 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <Volume2 className="w-4 h-4 text-[#d4ff32]" />
                        <span className="font-medium text-white truncate">{audioFile.name}</span>
                        <span className="text-neutral-500">({(audioFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                      {audioUrl && (
                        <audio controls src={audioUrl} className="h-7 w-48 shrink-0 ml-2" />
                      )}
                    </div>
                  )}

                  {isTranscribing && (
                    <div className="flex items-center gap-2 text-xs text-[#d4ff32]">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Transcrevendo áudio com IA e detectando quebras de cenas...</span>
                    </div>
                  )}
                </div>
              )}

              {/* Mode: Idea Box */}
              {inputMode === 'idea' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-neutral-300">
                      Descreva sua ideia para a IA criar o roteiro:
                    </label>
                    <button
                      type="button"
                      onClick={handleExpandIdea}
                      className="text-xs text-[#d4ff32] hover:underline font-medium flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Expandir em Roteiro Completo</span>
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={ideaText}
                    onChange={(e) => setIdeaText(e.target.value)}
                    placeholder="Ex: Um comercial moderno para uma nova marca de café gourmet de alta altitude, mostrando a colheita artesanal e a degustação em uma manhã ensolarada."
                    className="w-full p-3 rounded-xl bg-[#151722] border border-white/15 text-white placeholder-neutral-500 text-sm focus:outline-hidden focus:border-[#d4ff32] font-sans resize-y"
                  />
                </div>
              )}

              {/* Mode: Script Editor / Review */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-neutral-300">
                    {inputMode === 'narration'
                      ? 'Transcrição da Narração (detectada automaticamente):'
                      : 'Roteiro & Narração do Vídeo:'}
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-neutral-500">
                      ~{scriptText.split(/\s+/).filter(Boolean).length} palavras
                    </span>
                  </div>
                </div>
                <textarea
                  rows={7}
                  value={scriptText}
                  onChange={(e) => setScriptText(e.target.value)}
                  placeholder="Cole seu roteiro aqui..."
                  className="w-full p-3.5 rounded-xl bg-[#151722] border border-white/15 text-white placeholder-neutral-500 text-sm focus:outline-hidden focus:border-[#d4ff32] font-mono leading-relaxed resize-y"
                />
              </div>

              {/* Target Settings: Duration, Ratio, Style */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-white/10">
                {/* Duration */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#d4ff32]" />
                    <span>Duração desejada:</span>
                  </label>
                  <select
                    value={targetDuration}
                    onChange={(e) => setTargetDuration(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-xl bg-[#151722] border border-white/15 text-white text-xs focus:outline-hidden focus:border-[#d4ff32]"
                  >
                    <option value={15}>15 segundos (Stories / Reels Rápido)</option>
                    <option value={30}>30 segundos (Comercial Padrão)</option>
                    <option value={60}>60 segundos (Vídeo Completo)</option>
                    <option value={90}>90 segundos (Documentário Curto)</option>
                    <option value={0}>Automática (conforme ritmo do texto)</option>
                  </select>
                </div>

                {/* Aspect Ratio */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5 flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-[#d4ff32]" />
                    <span>Formato do Vídeo:</span>
                  </label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as ProjectAspectRatio)}
                    className="w-full px-3 py-2 rounded-xl bg-[#151722] border border-white/15 text-white text-xs focus:outline-hidden focus:border-[#d4ff32]"
                  >
                    <option value="16:9">16:9 (Horizontal / YouTube / TV)</option>
                    <option value="9:16">9:16 (Vertical / TikTok / Reels / Shorts)</option>
                    <option value="1:1">1:1 (Quadrado / Feed Instagram)</option>
                    <option value="4:5">4:5 (Retrato Social)</option>
                  </select>
                </div>

                {/* Visual Style */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#d4ff32]" />
                    <span>Estilo Visual (Visual Continuity):</span>
                  </label>
                  <select
                    value={visualStyle}
                    onChange={(e) => setVisualStyle(e.target.value as VisualContinuityStyle)}
                    className="w-full px-3 py-2 rounded-xl bg-[#151722] border border-white/15 text-white text-xs focus:outline-hidden focus:border-[#d4ff32]"
                  >
                    <option value="cinematic">Cinematográfico (Filme 35mm)</option>
                    <option value="realistic">Realista (Ultra Alta Resolução)</option>
                    <option value="photographic">Fotográfico (Studio / Profissional)</option>
                    <option value="scifi">Sci-Fi (Futurista / Tecnológico)</option>
                    <option value="cyberpunk">Cyberpunk (Neon / Noturno)</option>
                    <option value="commercial">Comercial (Publicidade / Clean)</option>
                    <option value="documentary">Documentário (Autêntico / Natureza)</option>
                    <option value="anime">Anime (Estilo Japonês Vibrante)</option>
                    <option value="3d">Render 3D (CGI Stylized)</option>
                    <option value="fantasy">Fantasia Épica</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 2: ANÁLISE DA IA & CONTINUIDADE (Personagens, Locais, Voz) */}
          {/* ========================================================= */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fadeIn">
              {/* Summary Banner */}
              <div className="p-4 rounded-xl bg-[#d4ff32]/10 border border-[#d4ff32]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#d4ff32] text-black flex items-center justify-center font-bold">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Análise Inteligente Concluída</h4>
                    <p className="text-xs text-neutral-300">
                      Roteiro dividido em <strong>{scenes.length} cenas narrativas</strong>. Duração estimada:{' '}
                      <strong>{Math.round(scenes.reduce((acc, s) => acc + s.duration, 0))}s</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-black/40 text-[#d4ff32] text-[11px] font-mono border border-white/10">
                    Estilo: {visualStyle.toUpperCase()}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-black/40 text-neutral-300 text-[11px] font-mono border border-white/10">
                    Formato: {aspectRatio}
                  </span>
                </div>
              </div>

              {/* Characters & Continuity Profiles */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#d4ff32]" />
                    <span>Personagens &amp; Continuidade Visual (Character Profiles)</span>
                  </label>
                  <span className="text-[11px] text-neutral-400">
                    Garante aparência e roupas consistentes em todas as cenas
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {characters.map((char, idx) => (
                    <div
                      key={char.id}
                      className="p-3.5 rounded-xl bg-[#151722] border border-white/10 flex items-start gap-3"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                        {char.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-bold text-white truncate">{char.name}</h5>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-neutral-300">
                            {char.role === 'protagonist' ? 'Protagonista' : 'Suporte'}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-1 line-clamp-2">
                          {char.visualFeatures}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Locations / Environments Profiles */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#d4ff32]" />
                    <span>Locais &amp; Ambientes Detectados (Location Profiles)</span>
                  </label>
                  <span className="text-[11px] text-neutral-400">
                    Iluminação e atmosfera mantidas em sincronia
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {locations.map((loc) => (
                    <div key={loc.id} className="p-3 rounded-xl bg-[#151722] border border-white/10 text-xs">
                      <div className="font-semibold text-white">{loc.name}</div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        {loc.environment} • {loc.lighting}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Voice Selector & Global Project Voice */}
              <div id="voice-selector-panel" className="p-4 rounded-xl bg-[#151722] border border-white/10 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Volume2 className="w-4 h-4 text-[#d4ff32]" />
                      <span>Voz Principal do Projeto</span>
                    </h4>
                    <p className="text-[11px] text-neutral-400">
                      Selecione o narrador e o tom vocal para toda a produção
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePlayVoicePreview}
                      disabled={isPlayingVoiceSample}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors"
                    >
                      {isPlayingVoiceSample ? (
                        <>
                          <Pause className="w-3.5 h-3.5 text-[#d4ff32]" />
                          <span>Ouvindo...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 text-[#d4ff32]" />
                          <span>Testar Voz</span>
                        </>
                      )}
                    </button>

                    <label className="flex items-center gap-1.5 text-xs text-neutral-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={applyVoiceToAll}
                        onChange={(e) => setApplyVoiceToAll(e.target.checked)}
                        className="rounded border-white/20 text-[#d4ff32] focus:ring-0"
                      />
                      <span>Aplicar a todas as cenas</span>
                    </label>
                  </div>
                </div>

                {/* Voice Profile Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  {DEFAULT_VOICE_PROFILES.map((vp) => (
                    <button
                      key={vp.id}
                      type="button"
                      onClick={() => handleSelectVoiceProfile(vp)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedVoice.id === vp.id
                          ? 'bg-[#d4ff32]/10 border-[#d4ff32] text-white shadow-xs'
                          : 'bg-[#10121a] border-white/10 hover:border-white/20 text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-white">{vp.name}</span>
                        {selectedVoice.id === vp.id && <Check className="w-3.5 h-3.5 text-[#d4ff32]" />}
                      </div>
                      <div className="text-[10px] text-neutral-400 mt-1 capitalize">
                        {vp.gender} • {vp.age} • {vp.archetype}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Real-Time Acoustic Waveform & Modulation Visualizer Bar */}
                <div className="wave-container pt-2">
                  <VoiceWaveVisualizer
                    pitch={voicePitch}
                    speed={voiceSpeed}
                    modulation={voiceModulation}
                    onModulationChange={setVoiceModulation}
                    voiceProfile={selectedVoice}
                    voiceName={selectedVoice.name}
                    isPlaying={isPlayingVoiceSample}
                  />
                </div>

                {/* Voice Sliders: Speed, Pitch & Modulation */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-white/10 text-xs">
                  <div>
                    <div className="flex items-center justify-between text-neutral-400 mb-1">
                      <span>Velocidade da Narração</span>
                      <span className="font-mono text-white">{voiceSpeed.toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min={0.7}
                      max={1.4}
                      step={0.05}
                      value={voiceSpeed}
                      onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                      className="w-full accent-[#d4ff32] cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-neutral-400 mb-1">
                      <span>Tom da Voz (Pitch)</span>
                      <span className="font-mono text-white">{voicePitch.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min={0.6}
                      max={1.4}
                      step={0.05}
                      value={voicePitch}
                      onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
                      className="w-full accent-[#d4ff32] cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-neutral-400 mb-1">
                      <span>Modulação &amp; Timbre</span>
                      <span className="font-mono text-white">{Math.round(voiceModulation * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0.1}
                      max={1.0}
                      step={0.05}
                      value={voiceModulation}
                      onChange={(e) => setVoiceModulation(parseFloat(e.target.value))}
                      className="w-full accent-[#d4ff32] cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Music, SFX & Subtitle Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Audio Generation Switches */}
                <div className="p-3.5 rounded-xl bg-[#151722] border border-white/10 space-y-2.5">
                  <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-[#d4ff32]" />
                    <span>Áudio &amp; Efeitos</span>
                  </div>

                  <label className="flex items-center justify-between text-xs text-neutral-300 cursor-pointer">
                    <span>Gerar Trilha Sonora (BGM)</span>
                    <input
                      type="checkbox"
                      checked={generateBGM}
                      onChange={(e) => setGenerateBGM(e.target.checked)}
                      className="rounded border-white/20 text-[#d4ff32] focus:ring-0"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs text-neutral-300 cursor-pointer">
                    <span>Gerar SFX Automáticos</span>
                    <input
                      type="checkbox"
                      checked={generateSFX}
                      onChange={(e) => setGenerateSFX(e.target.checked)}
                      className="rounded border-white/20 text-[#d4ff32] focus:ring-0"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs text-neutral-300 cursor-pointer">
                    <span>AI Auto Mix (Ducking)</span>
                    <input
                      type="checkbox"
                      checked={enableAutoMix}
                      onChange={(e) => setEnableAutoMix(e.target.checked)}
                      className="rounded border-white/20 text-[#d4ff32] focus:ring-0"
                    />
                  </label>
                </div>

                {/* Subtitle Style */}
                <div className="p-3.5 rounded-xl bg-[#151722] border border-white/10 space-y-2">
                  <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#d4ff32]" />
                    <span>Legendas Automáticas</span>
                  </div>

                  <select
                    value={subtitleStyle}
                    onChange={(e) => setSubtitleStyle(e.target.value as SubtitleStyle)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#10121a] border border-white/15 text-white text-xs focus:outline-hidden focus:border-[#d4ff32]"
                  >
                    <option value="cinematic">Cinematic (Amarela / Centralizada)</option>
                    <option value="modern">Modern (Branca / Caixa Semi-transparente)</option>
                    <option value="bold">Bold (Tipografia Pesada Impactante)</option>
                    <option value="minimal">Minimal (Sem fundo / Limpa)</option>
                    <option value="karaoke">Karaoke (Destaque palavra a palavra)</option>
                    <option value="social">Social (Pop / Estilo TikTok)</option>
                  </select>

                  <p className="text-[11px] text-neutral-400">
                    As legendas serão sincronizadas na faixa de texto da timeline.
                  </p>
                </div>

                {/* Automation Level */}
                <div className="p-3.5 rounded-xl bg-[#151722] border border-white/10 space-y-2">
                  <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-[#d4ff32]" />
                    <span>Nível de Automação</span>
                  </div>

                  <select
                    value={automationLevel}
                    onChange={(e) => setAutomationLevel(e.target.value as AutomationLevel)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#10121a] border border-white/15 text-white text-xs focus:outline-hidden focus:border-[#d4ff32]"
                  >
                    <option value="manual">Manual (Cria estrutura básica)</option>
                    <option value="assistido">Assistido (Sugestões e auxílio)</option>
                    <option value="automatico">Automático (Geração completa)</option>
                    <option value="diretor">Automático + IA Diretor (Otimização total)</option>
                  </select>

                  <p className="text-[11px] text-neutral-400">
                    Com IA Diretor, cortes, ritmo e transições são ajustados dinamicamente.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 3: STORYBOARD & REVISÃO DE CENAS                      */}
          {/* ========================================================= */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div>
                  <h3 className="text-sm font-bold text-white">Storyboard Inteligente ({scenes.length} Cenas)</h3>
                  <p className="text-xs text-neutral-400">
                    Revise, edite, regenere ou adicione novas cenas antes de compilar a timeline final.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddScene}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Cena</span>
                </button>
              </div>

              {/* Scenes Cards List */}
              <div className="space-y-3">
                {scenes.map((scene, idx) => (
                  <div
                    key={scene.id}
                    className="p-4 rounded-xl bg-[#151722] border border-white/10 hover:border-white/20 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-md bg-[#d4ff32] text-black font-bold text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <h4 className="font-bold text-sm text-white">{scene.title}</h4>
                        <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-neutral-300 font-mono">
                          {scene.duration}s
                        </span>
                      </div>

                      {/* Scene Action Buttons */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Editar com IA */}
                        <button
                          type="button"
                          onClick={() => setAiEditSceneIndex(idx)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#d4ff32]/10 hover:bg-[#d4ff32]/20 border border-[#d4ff32]/30 text-[#d4ff32] text-xs font-semibold transition-colors"
                          title="Fazer alteração específica usando prompt em linguagem natural"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Editar com IA</span>
                        </button>

                        {/* Regenerar */}
                        <button
                          type="button"
                          onClick={() => {
                            setRegenerateSceneIndex(idx);
                            setRegenerateInstruction('');
                          }}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-xs transition-colors"
                          title="Regenerar imagem, voz ou texto desta cena"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Regenerar</span>
                        </button>

                        {/* Editar manual */}
                        <button
                          type="button"
                          onClick={() => setEditingSceneIndex(editingSceneIndex === idx ? null : idx)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-xs transition-colors"
                          title="Editar texto e parâmetros manualmente"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>{editingSceneIndex === idx ? 'Fechar' : 'Editar'}</span>
                        </button>

                        {/* Remover */}
                        <button
                          type="button"
                          onClick={() => handleDeleteScene(idx)}
                          className="p-1 rounded-lg hover:bg-red-500/20 text-neutral-400 hover:text-red-400 text-xs transition-colors"
                          title="Remover cena"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Scene Content Layout: Thumbnail + Narration + Prompts */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                      {/* Thumbnail Preview */}
                      <div className="md:col-span-1 rounded-lg overflow-hidden aspect-video bg-black/60 relative border border-white/10 group">
                        {scene.visualMediaUrl ? (
                          <img
                            src={scene.visualMediaUrl}
                            alt={scene.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-500">
                            Sem visual
                          </div>
                        )}
                        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono text-white">
                          Cena {idx + 1}
                        </div>
                      </div>

                      {/* Narration & Prompts details */}
                      <div className="md:col-span-3 space-y-2">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-neutral-400">Texto Narrado:</span>
                          <p className="text-white text-xs italic bg-black/30 p-2 rounded-lg border border-white/5">
                            "{scene.narrationText}"
                          </p>
                        </div>

                        <div className="text-neutral-400">
                          <span className="text-[10px] uppercase font-bold text-neutral-400">Prompt Visual com Continuidade:</span>
                          <p className="text-neutral-300 text-[11px] line-clamp-2">
                            {scene.visualPrompt}
                          </p>
                        </div>

                        {scene.sfxPrompt && (
                          <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                            <span className="text-[#d4ff32] font-semibold">SFX:</span>
                            <span>{scene.sfxPrompt}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Inline Manual Edit Form */}
                    {editingSceneIndex === idx && (
                      <div className="pt-3 border-t border-white/10 space-y-2.5 animate-fadeIn">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div className="sm:col-span-2">
                            <label className="text-[11px] text-neutral-400">Título da Cena</label>
                            <input
                              type="text"
                              value={scene.title}
                              onChange={(e) => {
                                const copy = [...scenes];
                                copy[idx].title = e.target.value;
                                setScenes(copy);
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-[#0c0e14] border border-white/15 text-white text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-neutral-400">Duração (segundos)</label>
                            <input
                              type="number"
                              min={2}
                              max={30}
                              value={scene.duration}
                              onChange={(e) => {
                                const copy = [...scenes];
                                copy[idx].duration = Math.max(2, parseFloat(e.target.value) || 2);
                                setScenes(copy);
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-[#0c0e14] border border-white/15 text-white text-xs"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] text-neutral-400">Texto da Narração</label>
                          <textarea
                            rows={2}
                            value={scene.narrationText}
                            onChange={(e) => {
                              const copy = [...scenes];
                              copy[idx].narrationText = e.target.value;
                              setScenes(copy);
                            }}
                            className="w-full p-2 rounded-lg bg-[#0c0e14] border border-white/15 text-white text-xs font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] text-neutral-400">Prompt Visual</label>
                          <input
                            type="text"
                            value={scene.visualPrompt}
                            onChange={(e) => {
                              const copy = [...scenes];
                              copy[idx].visualPrompt = e.target.value;
                              setScenes(copy);
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#0c0e14] border border-white/15 text-white text-xs"
                          />
                        </div>
                      </div>
                    )}

                    {/* Inline "Editar com IA" Dialog */}
                    {aiEditSceneIndex === idx && (
                      <div className="p-3 rounded-xl bg-[#d4ff32]/5 border border-[#d4ff32]/30 space-y-2 animate-fadeIn">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#d4ff32] flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Editar Cena {idx + 1} com Linguagem Natural</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setAiEditSceneIndex(null)}
                            className="text-neutral-400 hover:text-white text-xs"
                          >
                            ✕
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={aiEditInstruction}
                            onChange={(e) => setAiEditInstruction(e.target.value)}
                            placeholder="Ex: Deixe mais cinematográfica, adicione chuva, ou troque por mulher..."
                            className="flex-1 px-3 py-1.5 rounded-lg bg-black/60 border border-white/20 text-white text-xs focus:outline-hidden focus:border-[#d4ff32]"
                          />
                          <button
                            type="button"
                            onClick={() => handleApplyAiEdit(idx)}
                            className="px-3 py-1.5 rounded-lg bg-[#d4ff32] text-black font-bold text-xs hover:bg-[#bbf438] transition-colors"
                          >
                            Aplicar
                          </button>
                        </div>

                        {/* Quick Presets */}
                        <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                          <span className="text-neutral-400">Sugestões rápidas:</span>
                          {[
                            'Deixar mais cinematográfica',
                            'Adicionar chuva e reflexos',
                            'Trocar personagem por mulher',
                            'Deixar a narração mais dramática',
                            'Reduzir duração para 4s',
                          ].map((sug) => (
                            <button
                              key={sug}
                              type="button"
                              onClick={() => {
                                setAiEditInstruction(sug);
                              }}
                              className="px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/15 text-neutral-300 hover:text-white transition-colors"
                            >
                              + {sug}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 4: GERAÇÃO EM LOTE COM PROGRESSO (⚡ GERAR PROJETO) */}
          {/* ========================================================= */}
          {currentStep === 4 && (
            <div className="py-8 px-4 max-w-xl mx-auto text-center space-y-6 animate-fadeIn">
              <div className="w-16 h-16 rounded-2xl bg-[#d4ff32]/20 border border-[#d4ff32] flex items-center justify-center text-[#d4ff32] mx-auto shadow-[0_0_30px_rgba(212,255,50,0.3)]">
                {isGenerationComplete ? (
                  <CheckCircle2 className="w-9 h-9 text-[#d4ff32]" />
                ) : (
                  <Sparkles className="w-9 h-9 animate-pulse" />
                )}
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">
                  {isGenerationComplete ? 'Produção Concluída com Sucesso!' : 'AI Auto Video Director em Ação'}
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  {generationStepStatus}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden p-0.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#d4ff32] to-[#80ff00] transition-all duration-300 shadow-[0_0_15px_rgba(212,255,50,0.5)]"
                    style={{ width: `${generationProgress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                  <span>
                    {isGenerationComplete
                      ? '100% Finalizado'
                      : `Cena ${currentGeneratingScene} de ${scenes.length}`}
                  </span>
                  <span>{generationProgress}%</span>
                </div>
              </div>

              {/* Real-time steps checklist */}
              <div className="p-4 rounded-xl bg-[#151722] border border-white/10 text-left text-xs space-y-2">
                <div className="flex items-center gap-2 text-[#d4ff32]">
                  <Check className="w-4 h-4" />
                  <span>Roteiro analisado e estrutura narrativa montada</span>
                </div>
                <div className="flex items-center gap-2 text-[#d4ff32]">
                  <Check className="w-4 h-4" />
                  <span>{scenes.length} cenas criadas com continuidade de personagens e cenários</span>
                </div>
                <div className={`flex items-center gap-2 ${generationProgress >= 30 ? 'text-[#d4ff32]' : 'text-neutral-500'}`}>
                  {generationProgress >= 30 ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4 animate-spin" />}
                  <span>Vozes e narração configuradas ({selectedVoice.name})</span>
                </div>
                <div className={`flex items-center gap-2 ${generationProgress >= 70 ? 'text-[#d4ff32]' : 'text-neutral-500'}`}>
                  {generationProgress >= 70 ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4 animate-spin" />}
                  <span>Imagens geradas e posicionadas no storyboard</span>
                </div>
                <div className={`flex items-center gap-2 ${generationProgress >= 90 ? 'text-[#d4ff32]' : 'text-neutral-500'}`}>
                  {generationProgress >= 90 ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4 animate-spin" />}
                  <span>Trilha sonora e efeitos SFX sincronizados com AI Auto Mix</span>
                </div>
                <div className={`flex items-center gap-2 ${generationProgress >= 100 ? 'text-[#d4ff32]' : 'text-neutral-500'}`}>
                  {generationProgress >= 100 ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4 animate-spin" />}
                  <span>Timeline multitrack 100% editável compilada</span>
                </div>
              </div>

              {isGenerationComplete && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleOpenCreatedProject}
                    className="w-full py-3 px-6 rounded-xl bg-[#d4ff32] hover:bg-[#bbf438] text-black font-bold text-sm shadow-[0_0_25px_rgba(212,255,50,0.4)] transition-all active:scale-98 flex items-center justify-center gap-2"
                  >
                    <span>Abrir Projeto no Estúdio</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-[11px] text-neutral-400 mt-2">
                    Cada cena, clipe, voz e efeito permanecerá separado e 100% editável na timeline.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls (Step Navigation) */}
        {currentStep < 4 && (
          <div className="px-5 py-3.5 border-t border-white/10 bg-[#13151f] flex items-center justify-between shrink-0">
            <div>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep((prev) => (prev - 1) as any)}
                  className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-xs font-semibold transition-colors"
                >
                  ← Voltar
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {currentStep === 1 && (
                <button
                  type="button"
                  onClick={handleProceedToAnalysis}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#d4ff32] hover:bg-[#bbf438] text-black font-bold text-xs shadow-[0_0_15px_rgba(212,255,50,0.3)] transition-all active:scale-95"
                >
                  <span>Continuar para Análise</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              {currentStep === 2 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#d4ff32] hover:bg-[#bbf438] text-black font-bold text-xs shadow-[0_0_15px_rgba(212,255,50,0.3)] transition-all active:scale-95"
                >
                  <span>Revisar Storyboard ({scenes.length} Cenas)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              {currentStep === 3 && (
                <button
                  type="button"
                  onClick={handleStartBatchGeneration}
                  className="flex items-center gap-2 px-6 py-2 rounded-xl bg-[#d4ff32] hover:bg-[#bbf438] text-black font-bold text-xs shadow-[0_0_25px_rgba(212,255,50,0.35)] transition-all active:scale-95"
                >
                  <Sparkles className="w-4 h-4 fill-black" />
                  <span>⚡ GERAR PROJETO COMPLETO</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal: Regenerar Cena Dialog */}
      {regenerateSceneIndex !== null && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md bg-[#13151f] border border-white/20 rounded-2xl p-5 space-y-4 shadow-2xl animate-fadeIn text-neutral-100">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-[#d4ff32]" />
                <span>Regenerar Cena {regenerateSceneIndex + 1}</span>
              </h4>
              <button
                type="button"
                onClick={() => setRegenerateSceneIndex(null)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-2">
                O que deseja alterar nesta cena?
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'image', label: '○ Imagem / Visual' },
                  { id: 'voice', label: '○ Voz / Narração' },
                  { id: 'text', label: '○ Texto / Falas' },
                  { id: 'duration', label: '○ Duração' },
                  { id: 'style', label: '○ Estilo Visual' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setRegenerateAspect(opt.id as any)}
                    className={`p-2.5 rounded-lg border text-left transition-colors ${
                      regenerateAspect === opt.id
                        ? 'bg-[#d4ff32]/20 border-[#d4ff32] text-white font-semibold'
                        : 'bg-white/5 border-white/10 text-neutral-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Descreva a alteração desejada:
              </label>
              <input
                type="text"
                value={regenerateInstruction}
                onChange={(e) => setRegenerateInstruction(e.target.value)}
                placeholder="Ex: Troque a cidade futurista por uma cidade brasileira..."
                className="w-full px-3 py-2 rounded-xl bg-[#0c0e14] border border-white/15 text-white text-xs focus:outline-hidden focus:border-[#d4ff32]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRegenerateSceneIndex(null)}
                className="px-3 py-1.5 rounded-lg bg-white/10 text-neutral-300 text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApplyRegenerate}
                className="px-4 py-1.5 rounded-lg bg-[#d4ff32] text-black font-bold text-xs hover:bg-[#bbf438]"
              >
                Regenerar Agora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import { StoryboardScene, TimelineTrack, TimelineClip } from '../types';

/**
 * Parses Markdown script text and converts it into Storyboard Scenes.
 * Understands headers as scene breaks, blockquotes or brackets as visual prompts,
 * and text as narration dialogue.
 */
export function scriptToScenes(content: string): StoryboardScene[] {
  const lines = content.split('\n');
  const scenes: StoryboardScene[] = [];

  let currentTitle = 'Cena 1: Introdução';
  let currentVisualPrompt = 'Cena de abertura cinematográfica com iluminação dramática e atmosfera envolvente.';
  let currentNarration = '';
  let currentSFX = 'whoosh de transição suave';
  let currentDuration = 5;
  let sceneIndex = 1;

  function commitScene() {
    scenes.push({
      id: `scene-${Date.now()}-${sceneIndex}`,
      order: sceneIndex,
      title: currentTitle,
      duration: Math.max(3, Math.min(20, currentDuration)),
      visualPrompt: currentVisualPrompt,
      visualStyle: 'cinematic',
      visualMediaType: 'image',
      narrationText: currentNarration.trim() || `Narração da cena ${sceneIndex}.`,
      voiceId: 'pt-BR-natural',
      sfxPrompt: currentSFX,
      transition: sceneIndex === 1 ? 'cut' : 'crossfade',
      cameraMotion: sceneIndex % 2 === 0 ? 'zoom-in' : 'pan-right',
    });
    sceneIndex++;
  }

  let hasStarted = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Header indicates new scene
    if (line.startsWith('#')) {
      if (hasStarted) {
        commitScene();
        currentVisualPrompt = 'Plano cinematográfico dinâmico com iluminação de estúdio.';
        currentNarration = '';
        currentDuration = 5;
      }
      currentTitle = line.replace(/^#+\s*/, '') || `Cena ${sceneIndex}`;
      hasStarted = true;
    } else if (line.startsWith('>') || line.startsWith('[Visual:') || line.startsWith('(Visual:')) {
      // Visual prompt indicator
      currentVisualPrompt = line.replace(/^[>[\]()Visual:\s]+/, '').replace(/[\])]$/, '');
      hasStarted = true;
    } else if (line.startsWith('[SFX:') || line.startsWith('(SFX:') || line.startsWith('SFX:')) {
      // SFX prompt indicator
      currentSFX = line.replace(/^[[(]?SFX:\s*/i, '').replace(/[\])]$/, '');
      hasStarted = true;
    } else {
      // Narration text
      if (currentNarration) {
        currentNarration += ' ' + line;
      } else {
        currentNarration = line;
      }
      // Estimate duration: ~130 words per minute => ~2.1 words per second
      const words = currentNarration.split(/\s+/).length;
      currentDuration = Math.max(4, Math.round(words / 2.2) + 1);
      hasStarted = true;
    }
  }

  if (hasStarted) {
    commitScene();
  }

  // If no scenes could be parsed, provide a fallback 2-scene sequence
  if (scenes.length === 0) {
    return [
      {
        id: `scene-${Date.now()}-1`,
        order: 1,
        title: 'Cena 1: Abertura',
        duration: 5,
        visualPrompt: 'Paisagem futurista com luz dourada refletindo em arranha-céus reluzentes.',
        visualStyle: 'cinematic',
        visualMediaType: 'image',
        narrationText: 'Bem-vindo ao novo horizonte da criatividade multimídia potencializada por inteligência artificial.',
        voiceId: 'pt-BR-natural',
        sfxPrompt: 'impacto cinemático com reverb profundo',
        transition: 'cut',
        cameraMotion: 'zoom-in',
      },
      {
        id: `scene-${Date.now()}-2`,
        order: 2,
        title: 'Cena 2: Expansão do Futuro',
        duration: 6,
        visualPrompt: 'Close em estúdio com detalhes holográficos azuis e visual moderno.',
        visualStyle: 'concept-art',
        visualMediaType: 'image',
        narrationText: 'Áudio generativo, narração em tempo real e timeline multitrack trabalhando em perfeita harmonia.',
        voiceId: 'pt-BR-natural',
        sfxPrompt: 'whoosh de transição com brilho',
        transition: 'crossfade',
        cameraMotion: 'pan-right',
      },
    ];
  }

  return scenes;
}

/**
 * Converts Storyboard Scenes into a Markdown formatted script for the Editor.
 */
export function scenesToScript(scenes: StoryboardScene[], projectTitle = 'Roteiro Multimídia'): string {
  let doc = `# ${projectTitle}\n\n`;
  doc += `> Roteiro sincronizado com o Estúdio Multimídia. Total de Cenas: ${scenes.length}\n\n`;

  scenes.forEach((scene, idx) => {
    doc += `## Cena ${idx + 1}: ${scene.title}\n\n`;
    doc += `**Duração estimada:** ${scene.duration}s | **Transição:** ${scene.transition} | **Câmera:** ${scene.cameraMotion || 'static'}\n\n`;
    doc += `> Visual: ${scene.visualPrompt} (${scene.visualStyle})\n\n`;
    if (scene.sfxPrompt) {
      doc += `*SFX: ${scene.sfxPrompt}*\n\n`;
    }
    doc += `**Narração:**\n"${scene.narrationText}"\n\n---\n\n`;
  });

  return doc;
}

/**
 * Builds standard multitrack timeline tracks from an array of scenes.
 */
export function createDefaultTracksFromScenes(scenes: StoryboardScene[]): TimelineTrack[] {
  let currentTime = 0;
  const videoClips: TimelineClip[] = [];
  const captionClips: TimelineClip[] = [];
  const voiceClips: TimelineClip[] = [];
  const sfxClips: TimelineClip[] = [];

  scenes.forEach((scene, index) => {
    const dur = scene.duration || 5;

    // Video 1 Clip
    videoClips.push({
      id: `clip-video-${scene.id}`,
      trackId: 'track-video-main',
      name: scene.title,
      startTime: currentTime,
      duration: dur,
      mediaUrl: scene.visualMediaUrl,
      mediaType: scene.visualMediaType,
      volume: 1,
      color: index % 2 === 0 ? '#3b82f6' : '#2563eb',
    });

    // Caption Clip
    captionClips.push({
      id: `clip-caption-${scene.id}`,
      trackId: 'track-text-caption',
      name: `Legenda ${index + 1}`,
      startTime: currentTime + 0.2,
      duration: Math.max(1, dur - 0.4),
      mediaType: 'text',
      textContent: scene.narrationText,
      volume: 1,
      color: '#eab308',
    });

    // Audio Voice Clip
    voiceClips.push({
      id: `clip-voice-${scene.id}`,
      trackId: 'track-audio-voice',
      name: `Voz: ${scene.title}`,
      startTime: currentTime + 0.3,
      duration: Math.max(1, dur - 0.6),
      mediaType: 'audio',
      mediaUrl: scene.narrationAudioUrl,
      volume: 0.95,
      fadeIn: 0.1,
      fadeOut: 0.2,
      color: '#10b981',
    });

    // SFX Clip (at transition/start of scene)
    sfxClips.push({
      id: `clip-sfx-${scene.id}`,
      trackId: 'track-audio-sfx',
      name: scene.sfxPrompt || `SFX ${index + 1}`,
      startTime: currentTime,
      duration: Math.min(2.0, dur),
      mediaType: 'audio',
      mediaUrl: scene.sfxAudioUrl,
      volume: 0.7,
      fadeIn: 0.05,
      fadeOut: 0.4,
      color: '#f97316',
    });

    currentTime += dur;
  });

  const totalDuration = Math.max(10, currentTime);

  // Background Music Clip (BGM continuous)
  const bgmClips: TimelineClip[] = [
    {
      id: 'clip-bgm-master',
      trackId: 'track-audio-bgm',
      name: 'Trilha Sonora Ambiente IA',
      startTime: 0,
      duration: totalDuration,
      mediaType: 'audio',
      volume: 0.35,
      fadeIn: 0.8,
      fadeOut: 1.5,
      color: '#8b5cf6',
    },
  ];

  return [
    {
      id: 'track-video-main',
      name: 'Vídeo 1 (Cenas)',
      type: 'video-main',
      muted: false,
      solo: false,
      locked: false,
      volume: 1.0,
      clips: videoClips,
    },
    {
      id: 'track-video-overlay',
      name: 'Vídeo 2 (B-Roll / Overlays)',
      type: 'video-overlay',
      muted: false,
      solo: false,
      locked: false,
      volume: 1.0,
      clips: [],
    },
    {
      id: 'track-text-caption',
      name: 'Legendas / Textos',
      type: 'text-caption',
      muted: false,
      solo: false,
      locked: false,
      volume: 1.0,
      clips: captionClips,
    },
    {
      id: 'track-audio-voice',
      name: 'Áudio 1 (Voz / Narração TTS)',
      type: 'audio-voice',
      muted: false,
      solo: false,
      locked: false,
      volume: 0.95,
      clips: voiceClips,
    },
    {
      id: 'track-audio-sfx',
      name: 'Áudio 2 (Efeitos Sonoros SFX)',
      type: 'audio-sfx',
      muted: false,
      solo: false,
      locked: false,
      volume: 0.8,
      clips: sfxClips,
    },
    {
      id: 'track-audio-bgm',
      name: 'Áudio 3 (Música de Fundo BGM)',
      type: 'audio-bgm',
      muted: false,
      solo: false,
      locked: false,
      volume: 0.4,
      clips: bgmClips,
    },
  ];
}

/**
 * Builds standard empty multitrack timeline tracks for starting a clean project.
 */
export function createCleanTracks(): TimelineTrack[] {
  return [
    {
      id: 'track-video-main',
      name: 'Vídeo 1 (Cenas)',
      type: 'video-main',
      muted: false,
      solo: false,
      locked: false,
      volume: 1.0,
      clips: [],
    },
    {
      id: 'track-video-overlay',
      name: 'Vídeo 2 (B-Roll / Overlays)',
      type: 'video-overlay',
      muted: false,
      solo: false,
      locked: false,
      volume: 1.0,
      clips: [],
    },
    {
      id: 'track-text-caption',
      name: 'Legendas / Textos',
      type: 'text-caption',
      muted: false,
      solo: false,
      locked: false,
      volume: 1.0,
      clips: [],
    },
    {
      id: 'track-audio-voice',
      name: 'Áudio 1 (Voz / Narração TTS)',
      type: 'audio-voice',
      muted: false,
      solo: false,
      locked: false,
      volume: 0.95,
      clips: [],
    },
    {
      id: 'track-audio-sfx',
      name: 'Áudio 2 (Efeitos Sonoros SFX)',
      type: 'audio-sfx',
      muted: false,
      solo: false,
      locked: false,
      volume: 0.8,
      clips: [],
    },
    {
      id: 'track-audio-bgm',
      name: 'Áudio 3 (Música de Fundo BGM)',
      type: 'audio-bgm',
      muted: false,
      solo: false,
      locked: false,
      volume: 0.4,
      clips: [],
    },
  ];
}

export type LanguageType = 'markdown' | 'javascript' | 'typescript' | 'html' | 'json' | 'plaintext';

export type EditorViewMode = 'split' | 'edit' | 'preview';

export type EditorTheme = 'dark' | 'light' | 'sepia';

export type FontFamily = 'mono' | 'sans' | 'serif';

export type AppWorkspaceMode = 'editor' | 'studio';

export interface DocumentItem {
  id: string;
  title: string;
  content: string;
  language: LanguageType;
  createdAt: number;
  updatedAt: number;
}

export interface EditorSettings {
  fontSize: number;
  lineNumbers: boolean;
  wordWrap: boolean;
  fontFamily: FontFamily;
  tabSize: number;
  spellCheck: boolean;
}

export interface SearchState {
  isOpen: boolean;
  query: string;
  replaceText: string;
  matchCase: boolean;
  currentIndex: number;
  matchesCount: number;
}

export interface DocumentStats {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  lines: number;
  readingTimeMinutes: number;
}

// ==========================================
// Multimedia Platform & Generative Audio Types
// ==========================================

export type ProjectAspectRatio = '16:9' | '9:16' | '1:1' | '4:5' | '21:9' | '4:3';

export type VideoFilter = 'normal' | 'cinematic' | 'noir' | 'cyberpunk' | 'vivid' | 'vintage' | 'warm';

export type SceneTransition = 'cut' | 'crossfade' | 'fade-black' | 'wipe';

export type CameraMotion = 'static' | 'pan-right' | 'zoom-in' | 'zoom-out' | 'tilt-up' | 'dolly' | 'shake';

export type VisualStyle = 'cinematic' | 'anime' | 'concept-art' | 'photorealistic' | '3d-render';

export interface StoryboardScene {
  id: string;
  order: number;
  title: string;
  duration: number; // in seconds, e.g. 5
  visualPrompt: string;
  visualStyle: VisualStyle;
  visualMediaUrl?: string;
  visualMediaType: 'image' | 'video';
  narrationText: string;
  voiceId: string;
  narrationAudioUrl?: string;
  sfxPrompt?: string;
  sfxAudioUrl?: string;
  transition: SceneTransition;
  cameraMotion?: CameraMotion;
  filter?: VideoFilter;
  textOverlay?: string;
}

export type TrackType =
  | 'video-main'
  | 'video-overlay'
  | 'text-caption'
  | 'audio-voice'
  | 'audio-sfx'
  | 'audio-bgm';

export interface TimelineClip {
  id: string;
  trackId: string;
  name: string;
  startTime: number; // in seconds
  duration: number;  // in seconds
  mediaUrl?: string;
  mediaType: 'video' | 'image' | 'audio' | 'text';
  volume: number;    // 0 to 1
  fadeIn?: number;
  fadeOut?: number;
  textContent?: string;
  color?: string;
}

export interface TimelineTrack {
  id: string;
  name: string;
  type: TrackType;
  muted: boolean;
  solo: boolean;
  locked: boolean;
  volume: number; // 0 to 1
  clips: TimelineClip[];
}

export interface MultimediaProject {
  id: string;
  title: string;
  aspectRatio: ProjectAspectRatio;
  fps: number;
  sampleRate: number; // 44100 | 48000
  duration: number;
  linkedDocId?: string;
  createdAt: number;
  updatedAt: number;
  scenes: StoryboardScene[];
  tracks: TimelineTrack[];
}

// Generative Audio Parameters
export interface BGMGenParams {
  prompt: string;
  genre: 'lo-fi' | 'cinematic' | 'ambient' | 'synthwave' | 'acoustic' | 'orchestral';
  mood: 'epic' | 'calm' | 'suspenseful' | 'uplifting' | 'melancholic' | 'energetic';
  tempo: number; // BPM: 60 - 180
  duration: number; // 5 - 120s
  isLoop: boolean;
}

export interface SFXGenParams {
  prompt: string;
  category: 'whoosh' | 'impact' | 'ambient' | 'riser' | 'ui-blip' | 'magic';
  duration: number;
  reverb: number; // 0 - 1
}

export interface VoiceGenParams {
  text: string;
  voiceId: string;
  speed: number; // 0.5 - 2.0
  pitch: number; // 0.5 - 1.5
  language: string;
}

// Media Vault Assets
export type AssetType =
  | 'audio-bgm'
  | 'audio-sfx'
  | 'audio-voice'
  | 'image'
  | 'video'
  | 'upload';

export interface MediaAsset {
  id: string;
  title: string;
  type: AssetType;
  url: string;
  duration?: number;
  createdAt: number;
  tags: string[];
  sizeBytes?: number;
}

// Authentication & Quotas
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  plan: 'guest' | 'creator' | 'pro';
  avatarUrl?: string;
  audioCredits: number;
  videoCredits: number;
  storageUsedMB: number;
  storageLimitMB: number;
}

// Export Configuration
export type ExportFormat =
  | 'video-mp4'
  | 'video-webm'
  | 'audio-wav'
  | 'audio-mp3'
  | 'stems-zip'
  | 'storyboard-doc';

export type ExportResolution = '720p' | '1080p' | '4k';

// ==========================================
// AI Auto Video & Director Types
// ==========================================

export type AutoVideoInputMode = 'script' | 'narration' | 'idea';

export type VisualContinuityStyle =
  | 'cinematic'
  | 'realistic'
  | 'photographic'
  | 'anime'
  | '3d'
  | 'cyberpunk'
  | 'scifi'
  | 'fantasy'
  | 'documentary'
  | 'commercial';

export interface CharacterProfile {
  id: string;
  name: string;
  description: string;
  visualFeatures: string;
  avatarUrl?: string;
  role?: 'protagonist' | 'supporting' | 'narrator';
}

export interface LocationProfile {
  id: string;
  name: string;
  environment: string;
  atmosphere: string;
  lighting: string;
  weather?: string;
}

export type SubtitleStyle =
  | 'cinematic'
  | 'modern'
  | 'bold'
  | 'minimal'
  | 'karaoke'
  | 'social';

export type VoiceGender = 'masculino' | 'feminino';
export type VoiceAge = 'jovem' | 'adulta' | 'grave' | 'suave';
export type VoiceArchetype =
  | 'narrador'
  | 'comercial'
  | 'cinematografica'
  | 'dramatico'
  | 'documentario'
  | 'jornalistico'
  | 'motivacional'
  | 'futurista'
  | 'natural';

export interface VoiceProfileConfig {
  id: string;
  name: string;
  gender: VoiceGender;
  age: VoiceAge;
  archetype: VoiceArchetype;
  speed: number;
  pitch: number;
  intensity: number;
  samplePhrase: string;
}

export type AutomationLevel = 'manual' | 'assistido' | 'automatico' | 'diretor';

export interface AutoSceneDraft {
  id: string;
  order: number;
  title: string;
  description: string;
  narrationText: string;
  duration: number; // in seconds
  visualPrompt: string;
  visualMediaUrl?: string;
  visualMediaType: 'image' | 'video';
  voiceId: string;
  voiceStyle?: string;
  sfxCategory?: string;
  sfxPrompt?: string;
  charactersInvolved?: string[];
  locationName?: string;
  status: 'pending' | 'generating' | 'ready' | 'error';
}

export interface AIDirectorInsights {
  pacingScore: number; // 0 - 100
  continuityScore: number; // 0 - 100
  audioBalance: string;
  directorNotes: string[];
  suggestedEnhancements: string[];
  lastUpdated: number;
}

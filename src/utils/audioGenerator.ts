/**
 * Web Audio Generative Engine
 * Synthesizes real BGM soundscapes, procedural SFX, and TTS voice audio.
 * Exports playable WAV audio blobs for playback, visualization, and download.
 */

let sharedAudioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    sharedAudioCtx = new AudioCtxClass();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume();
  }
  return sharedAudioCtx;
}

// Convert AudioBuffer to WAV Blob
export function bufferToWaveBlob(abuffer: AudioBuffer): Blob {
  const numOfChan = abuffer.numberOfChannels;
  const length = abuffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels: Float32Array[] = [];
  let sampleRate = abuffer.sampleRate;
  let offset = 0;
  let pos = 0;

  function setUint16(data: number) {
    out.setUint16(pos, data, true);
    pos += 2;
  }
  function setUint32(data: number) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  // RIFF chunk descriptor
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  // FMT sub-chunk
  setUint32(0x20746d66); // "fmt "
  setUint32(16); // subchunk1size (16 for PCM)
  setUint16(1); // audio format (1 = PCM)
  setUint16(numOfChan);
  setUint32(sampleRate);
  setUint32(sampleRate * 2 * numOfChan); // byte rate
  setUint16(numOfChan * 2); // block align
  setUint16(16); // bits per sample

  // data sub-chunk
  setUint32(0x61746164); // "data"
  setUint32(length - pos - 4); // data chunk length

  for (let i = 0; i < abuffer.numberOfChannels; i++) {
    channels.push(abuffer.getChannelData(i));
  }

  while (offset < abuffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out.buffer], { type: 'audio/wav' });
}

// Chords definition for music generation
const SCALES = {
  cinematic: [130.81, 146.83, 155.56, 174.61, 196.0, 207.65, 233.08, 261.63], // C minor
  'lo-fi': [146.83, 164.81, 174.61, 196.0, 220.0, 246.94, 261.63, 293.66], // D dorian
  ambient: [130.81, 164.81, 196.0, 246.94, 261.63, 329.63, 392.0], // C maj7/9
  synthwave: [110.0, 130.81, 146.83, 164.81, 174.61, 220.0, 261.63], // A minor
  acoustic: [146.83, 185.0, 220.0, 277.18, 293.66, 369.99, 440.0], // D major
  orchestral: [130.81, 155.56, 196.0, 233.08, 261.63, 311.13, 392.0], // Eb maj / C min
};

/**
 * Procedural BGM Generator:
 * Generates an ambient harmonic music track with bass, chords, arpeggiated melodic lead and soft rhythm.
 */
export async function generateBGMTrack(params: {
  genre: 'lo-fi' | 'cinematic' | 'ambient' | 'synthwave' | 'acoustic' | 'orchestral';
  mood: string;
  tempo: number;
  duration: number;
}): Promise<{ blob: Blob; url: string; buffer: AudioBuffer }> {
  const sampleRate = 44100;
  const numChannels = 2;
  const totalDuration = Math.max(4, Math.min(60, params.duration));
  const totalFrames = Math.floor(sampleRate * totalDuration);

  // Use OfflineAudioContext for fast offline rendering
  const offlineCtx = new OfflineAudioContext(numChannels, totalFrames, sampleRate);

  const scale = SCALES[params.genre] || SCALES.ambient;
  const beatSec = 60 / Math.max(60, Math.min(180, params.tempo));
  const barSec = beatSec * 4;

  // Master Gain & Reverb Filter
  const masterGain = offlineCtx.createGain();
  masterGain.gain.setValueAtTime(0.7, 0);
  masterGain.gain.setValueAtTime(0.7, totalDuration - 1.5);
  masterGain.gain.linearRampToValueAtTime(0.001, totalDuration); // fade-out
  masterGain.connect(offlineCtx.destination);

  // Lowpass filter for tone color
  const filter = offlineCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = params.genre === 'synthwave' ? 3200 : params.genre === 'lo-fi' ? 1400 : 2200;
  filter.Q.value = 1.8;
  filter.connect(masterGain);

  // 1. Chords / Ambient Pads
  for (let t = 0; t < totalDuration; t += barSec) {
    const chordIndex = Math.floor((t / barSec) % 4);
    const rootFreq = scale[chordIndex % scale.length];
    const thirdFreq = scale[(chordIndex + 2) % scale.length];
    const fifthFreq = scale[(chordIndex + 4) % scale.length];

    [rootFreq, thirdFreq, fifthFreq].forEach((freq) => {
      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();

      osc.type = params.genre === 'synthwave' ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(freq, t);

      // Soft envelope
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.8);
      gain.gain.setValueAtTime(0.1, t + barSec - 0.5);
      gain.gain.linearRampToValueAtTime(0.001, t + barSec);

      osc.connect(gain);
      gain.connect(filter);

      osc.start(t);
      osc.stop(t + barSec);
    });

    // Sub-Bass note
    const subOsc = offlineCtx.createOscillator();
    const subGain = offlineCtx.createGain();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(rootFreq * 0.5, t);

    subGain.gain.setValueAtTime(0.001, t);
    subGain.gain.linearRampToValueAtTime(0.22, t + 0.1);
    subGain.gain.setValueAtTime(0.18, t + barSec - 0.2);
    subGain.gain.linearRampToValueAtTime(0.001, t + barSec);

    subOsc.connect(subGain);
    subGain.connect(masterGain);

    subOsc.start(t);
    subOsc.stop(t + barSec);
  }

  // 2. Arpeggio / Melodic Lead
  for (let t = 0; t < totalDuration; t += beatSec / 2) {
    if (Math.random() > 0.3) {
      const noteOsc = offlineCtx.createOscillator();
      const noteGain = offlineCtx.createGain();

      const note = scale[Math.floor(Math.random() * scale.length)] * 2;
      noteOsc.type = params.genre === 'lo-fi' ? 'triangle' : 'sine';
      noteOsc.frequency.setValueAtTime(note, t);

      noteGain.gain.setValueAtTime(0.001, t);
      noteGain.gain.linearRampToValueAtTime(0.07, t + 0.02);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, t + beatSec * 0.6);

      noteOsc.connect(noteGain);
      noteGain.connect(filter);

      noteOsc.start(t);
      noteOsc.stop(t + beatSec * 0.7);
    }
  }

  // 3. Lo-Fi / Synth Rhythm (Kicks and gentle noise snaps)
  if (params.genre !== 'ambient') {
    for (let t = 0; t < totalDuration; t += beatSec) {
      const isKick = (t / beatSec) % 2 === 0;
      if (isKick) {
        // Kick drum
        const kickOsc = offlineCtx.createOscillator();
        const kickGain = offlineCtx.createGain();

        kickOsc.frequency.setValueAtTime(120, t);
        kickOsc.frequency.exponentialRampToValueAtTime(35, t + 0.12);

        kickGain.gain.setValueAtTime(0.3, t);
        kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

        kickOsc.connect(kickGain);
        kickGain.connect(masterGain);

        kickOsc.start(t);
        kickOsc.stop(t + 0.2);
      }
    }
  }

  // Render to AudioBuffer
  const renderedBuffer = await offlineCtx.startRendering();
  const blob = bufferToWaveBlob(renderedBuffer);
  const url = URL.createObjectURL(blob);

  return { blob, url, buffer: renderedBuffer };
}

/**
 * Procedural SFX Generator:
 * Generates cinematic impacts, whooshes, risers, ambient sounds and UI blips.
 */
export async function generateSFX(params: {
  category: 'whoosh' | 'impact' | 'ambient' | 'riser' | 'ui-blip' | 'magic';
  duration: number;
}): Promise<{ blob: Blob; url: string; buffer: AudioBuffer }> {
  const sampleRate = 44100;
  const numChannels = 2;
  const duration = Math.max(0.3, Math.min(8, params.duration || 1.5));
  const totalFrames = Math.floor(sampleRate * duration);

  const offlineCtx = new OfflineAudioContext(numChannels, totalFrames, sampleRate);
  const master = offlineCtx.createGain();
  master.gain.setValueAtTime(0.8, 0);
  master.connect(offlineCtx.destination);

  if (params.category === 'impact') {
    // Cinematic Boom / Impact: Sub-bass sweep + burst
    const osc = offlineCtx.createOscillator();
    const gain = offlineCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, 0);
    osc.frequency.exponentialRampToValueAtTime(25, duration * 0.8);

    gain.gain.setValueAtTime(0.8, 0);
    gain.gain.exponentialRampToValueAtTime(0.0001, duration);

    osc.connect(gain);
    gain.connect(master);
    osc.start(0);
    osc.stop(duration);

    // Punch Noise
    const noiseBuffer = offlineCtx.createBuffer(1, sampleRate * 0.2, sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleRate * 0.05));
    }
    const noiseSource = offlineCtx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    const noiseFilter = offlineCtx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 600;
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(master);
    noiseSource.start(0);
  } else if (params.category === 'whoosh') {
    // Cinematic Whoosh: bandpass-swept noise
    const noiseBuffer = offlineCtx.createBuffer(1, sampleRate * duration, sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = offlineCtx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = offlineCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 3.0;
    filter.frequency.setValueAtTime(100, 0);
    filter.frequency.exponentialRampToValueAtTime(1600, duration * 0.5);
    filter.frequency.exponentialRampToValueAtTime(200, duration);

    const gain = offlineCtx.createGain();
    gain.gain.setValueAtTime(0.001, 0);
    gain.gain.linearRampToValueAtTime(0.7, duration * 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    noise.start(0);
  } else if (params.category === 'riser') {
    // Pitch & frequency riser
    const osc = offlineCtx.createOscillator();
    const filter = offlineCtx.createBiquadFilter();
    const gain = offlineCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, 0);
    osc.frequency.exponentialRampToValueAtTime(880, duration);

    filter.type = 'lowpass';
    filter.Q.value = 5.0;
    filter.frequency.setValueAtTime(200, 0);
    filter.frequency.exponentialRampToValueAtTime(4000, duration);

    gain.gain.setValueAtTime(0.01, 0);
    gain.gain.linearRampToValueAtTime(0.65, duration * 0.95);
    gain.gain.linearRampToValueAtTime(0.0001, duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    osc.start(0);
    osc.stop(duration);
  } else if (params.category === 'ui-blip' || params.category === 'magic') {
    // Crystal chime / UI blip
    const freqs = params.category === 'magic' ? [523.25, 659.25, 783.99, 1046.5, 1318.51] : [880, 1760];
    const step = duration / (freqs.length + 1);

    freqs.forEach((freq, idx) => {
      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();
      const startT = idx * step;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startT);

      gain.gain.setValueAtTime(0.001, startT);
      gain.gain.linearRampToValueAtTime(0.3, startT + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startT + step * 2);

      osc.connect(gain);
      gain.connect(master);
      osc.start(startT);
      osc.stop(startT + step * 2.5);
    });
  } else {
    // Ambient Drone
    const freqs = [110, 164.81, 220, 330];
    freqs.forEach((f) => {
      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, 0);

      gain.gain.setValueAtTime(0.001, 0);
      gain.gain.linearRampToValueAtTime(0.2, duration * 0.3);
      gain.gain.setValueAtTime(0.18, duration * 0.7);
      gain.gain.linearRampToValueAtTime(0.0001, duration);

      osc.connect(gain);
      gain.connect(master);
      osc.start(0);
      osc.stop(duration);
    });
  }

  const renderedBuffer = await offlineCtx.startRendering();
  const blob = bufferToWaveBlob(renderedBuffer);
  const url = URL.createObjectURL(blob);

  return { blob, url, buffer: renderedBuffer };
}

/**
 * SpeechSynthesis TTS generation with browser playback
 */
export function playNarrationPreview(text: string, options?: { rate?: number; pitch?: number; voiceName?: string }): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      resolve();
      return;
    }
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options?.rate || 1.0;
    utterance.pitch = options?.pitch || 1.0;

    const voices = window.speechSynthesis.getVoices();
    if (options?.voiceName) {
      const chosen = voices.find((v) => v.name.includes(options.voiceName!) || v.lang.includes(options.voiceName!));
      if (chosen) utterance.voice = chosen;
    }

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}

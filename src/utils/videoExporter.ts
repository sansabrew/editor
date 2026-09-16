/**
 * Real-time Canvas Video Exporter
 * Renders the project scenes, transitions, subtitles, and filters into a genuine playable WebM video.
 */
import { MultimediaProject, StoryboardScene, VideoFilter } from '../types';

export async function renderProjectToVideoBlob(
  project: MultimediaProject,
  onProgress: (percent: number, statusText: string) => void
): Promise<Blob> {
  return new Promise(async (resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      let width = 1280;
      let height = 720;

      if (project.aspectRatio === '9:16') {
        width = 720;
        height = 1280;
      } else if (project.aspectRatio === '1:1') {
        width = 720;
        height = 720;
      } else if (project.aspectRatio === '21:9') {
        width = 1680;
        height = 720;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not initialize canvas context');

      onProgress(5, 'Carregando imagens e recursos visuais das cenas...');

      // Preload images for all scenes
      const loadedImages: HTMLImageElement[] = await Promise.all(
        project.scenes.map((scene) => {
          return new Promise<HTMLImageElement>((res) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => res(img);
            img.onerror = () => {
              // Fallback generated pattern if image fails
              const fallbackCanvas = document.createElement('canvas');
              fallbackCanvas.width = width;
              fallbackCanvas.height = height;
              const fctx = fallbackCanvas.getContext('2d')!;
              fctx.fillStyle = '#1e1b4b';
              fctx.fillRect(0, 0, width, height);
              fctx.fillStyle = '#d4ff32';
              fctx.font = 'bold 36px sans-serif';
              fctx.textAlign = 'center';
              fctx.fillText(scene.title, width / 2, height / 2);
              const fallbackImg = new Image();
              fallbackImg.src = fallbackCanvas.toDataURL();
              res(fallbackImg);
            };
            img.src =
              scene.visualMediaUrl ||
              'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80';
          });
        })
      );

      onProgress(25, 'Inicializando MediaRecorder e pipeline de renderização...');

      // Setup Canvas Stream and MediaRecorder
      const fps = project.fps || 30;
      const stream = canvas.captureStream(fps);

      let options: MediaRecorderOptions = { mimeType: 'video/webm;codecs=vp9' };
      if (!MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
        options = { mimeType: 'video/webm' };
      }

      const recorder = new MediaRecorder(stream, options);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const videoBlob = new Blob(chunks, { type: 'video/webm' });
        onProgress(100, 'Vídeo finalizado e pronto para download!');
        resolve(videoBlob);
      };

      recorder.start();

      // Render frames through scenes
      // For fast export, render compressed timeline (e.g. 1.5s per scene preview or full duration)
      const renderDurationPerScene = 2.0; // 2 seconds per scene for swift client export
      const framesPerScene = Math.floor(renderDurationPerScene * fps);
      const totalFrames = project.scenes.length * framesPerScene;
      let currentFrame = 0;

      const renderNextFrame = () => {
        if (currentFrame >= totalFrames) {
          recorder.stop();
          return;
        }

        const sceneIndex = Math.min(
          project.scenes.length - 1,
          Math.floor(currentFrame / framesPerScene)
        );
        const scene = project.scenes[sceneIndex];
        const img = loadedImages[sceneIndex];
        const frameInScene = currentFrame % framesPerScene;
        const progressInScene = frameInScene / framesPerScene;

        // Apply camera zoom/pan
        ctx.save();
        ctx.clearRect(0, 0, width, height);

        let scale = 1.0;
        let translateX = 0;
        let translateY = 0;

        if (scene.cameraMotion === 'zoom-in') {
          scale = 1.0 + progressInScene * 0.12;
        } else if (scene.cameraMotion === 'zoom-out') {
          scale = 1.12 - progressInScene * 0.12;
        } else if (scene.cameraMotion === 'pan-right') {
          translateX = (progressInScene - 0.5) * 40;
        }

        ctx.translate(width / 2, height / 2);
        ctx.scale(scale, scale);
        ctx.translate(-width / 2 + translateX, -height / 2 + translateY);

        // Draw image keeping cover aspect ratio
        drawImageCover(ctx, img, 0, 0, width, height);
        ctx.restore();

        // Apply visual LUT / tone
        applyFilterOverlay(ctx, width, height, scene.filter || 'cinematic');

        // Vignette
        const gradient = ctx.createRadialGradient(
          width / 2,
          height / 2,
          width * 0.25,
          width / 2,
          height / 2,
          width * 0.65
        );
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.55)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Subtitle / Narration
        if (scene.narrationText) {
          drawSubtitle(ctx, scene.narrationText, width, height);
        }

        // Scene Transition fade-in/out at boundary
        if (frameInScene < 6) {
          ctx.fillStyle = `rgba(0,0,0,${(6 - frameInScene) / 6})`;
          ctx.fillRect(0, 0, width, height);
        }

        currentFrame++;
        const pct = Math.floor(25 + (currentFrame / totalFrames) * 70);
        if (currentFrame % 10 === 0) {
          onProgress(pct, `Renderizando cena ${sceneIndex + 1}/${project.scenes.length} (Frame ${currentFrame}/${totalFrames})...`);
        }

        requestAnimationFrame(renderNextFrame);
      };

      renderNextFrame();
    } catch (err) {
      reject(err);
    }
  });
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const imgRatio = img.width / img.height;
  const targetRatio = w / h;
  let sWidth = img.width;
  let sHeight = img.height;
  let sx = 0;
  let sy = 0;

  if (imgRatio > targetRatio) {
    sWidth = img.height * targetRatio;
    sx = (img.width - sWidth) / 2;
  } else {
    sHeight = img.width / targetRatio;
    sy = (img.height - sHeight) / 2;
  }

  ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, w, h);
}

function applyFilterOverlay(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  filter: VideoFilter
) {
  if (filter === 'cyberpunk') {
    ctx.fillStyle = 'rgba(212, 255, 50, 0.08)';
    ctx.fillRect(0, 0, w, h);
  } else if (filter === 'warm') {
    ctx.fillStyle = 'rgba(255, 140, 0, 0.1)';
    ctx.fillRect(0, 0, w, h);
  } else if (filter === 'cinematic') {
    ctx.fillStyle = 'rgba(0, 180, 255, 0.06)';
    ctx.fillRect(0, 0, w, h);
  }
}

function drawSubtitle(
  ctx: CanvasRenderingContext2D,
  text: string,
  w: number,
  h: number
) {
  ctx.save();
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const textWidth = ctx.measureText(text).width;
  const boxWidth = Math.min(w * 0.85, textWidth + 36);
  const boxHeight = 44;
  const boxX = (w - boxWidth) / 2;
  const boxY = h - 90;

  // Background pill
  ctx.fillStyle = 'rgba(10, 12, 16, 0.82)';
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 10);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Text
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, w / 2, boxY + boxHeight / 2);
  ctx.restore();
}

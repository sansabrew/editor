import React, { useState, useRef } from 'react';
import {
  FolderArchive,
  Music,
  Zap,
  Mic,
  Image as ImageIcon,
  Video,
  Upload,
  Play,
  Pause,
  Trash2,
  Plus,
  Search,
  HardDrive,
} from 'lucide-react';
import { MediaAsset, EditorTheme, AssetType } from '../../types';

interface MediaVaultPanelProps {
  assets: MediaAsset[];
  theme: EditorTheme;
  onAddAsset: (asset: MediaAsset) => void;
  onDeleteAsset: (assetId: string) => void;
  onInsertToTimeline: (asset: MediaAsset) => void;
  onShowToast: (msg: string) => void;
}

export const MediaVaultPanel: React.FC<MediaVaultPanelProps> = ({
  assets,
  theme,
  onAddAsset,
  onDeleteAsset,
  onInsertToTimeline,
  onShowToast,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [playingAssetId, setPlayingAssetId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const isDark = theme === 'dark';

  const filteredAssets = assets.filter((asset) => {
    const matchesType = filterType === 'all' || asset.type === filterType;
    const matchesSearch =
      asset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const toggleAudioPlay = (asset: MediaAsset) => {
    if (!asset.url) {
      onShowToast('Este áudio é um recurso sintetizado pelo sistema.');
      return;
    }
    if (playingAssetId === asset.id) {
      audioPlayerRef.current?.pause();
      setPlayingAssetId(null);
    } else {
      if (!audioPlayerRef.current) {
        audioPlayerRef.current = new Audio(asset.url);
        audioPlayerRef.current.onended = () => setPlayingAssetId(null);
      } else {
        audioPlayerRef.current.src = asset.url;
      }
      audioPlayerRef.current.play().catch(() => setPlayingAssetId(null));
      setPlayingAssetId(asset.id);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let detectedType: AssetType = 'upload';
    if (file.type.startsWith('audio')) detectedType = 'audio-sfx';
    else if (file.type.startsWith('image')) detectedType = 'image';
    else if (file.type.startsWith('video')) detectedType = 'video';

    const localUrl = URL.createObjectURL(file);
    const newAsset: MediaAsset = {
      id: `upload-${Date.now()}`,
      title: file.name,
      type: detectedType,
      url: localUrl,
      createdAt: Date.now(),
      tags: ['upload', file.type.split('/')[1] || 'media'],
      sizeBytes: file.size,
    };

    onAddAsset(newAsset);
    onShowToast(`Arquivo ${file.name} adicionado ao Armazenamento!`);
    e.target.value = '';
  };

  return (
    <div
      id="media-vault-panel"
      className={`flex flex-col h-full overflow-hidden text-xs ${
        isDark ? 'bg-neutral-900 text-neutral-200' : 'bg-white text-neutral-800'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-inherit/15 shrink-0">
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-emerald-500" />
          <span className="font-semibold text-sm">Armazenamento &amp; Media Vault</span>
          <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-[10px]">
            {assets.length} itens
          </span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,image/*,video/*"
          className="hidden"
          onChange={handleFileUpload}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-xs transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Importar Mídia</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-3 border-b border-inherit/10 space-y-2 shrink-0">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 opacity-50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome ou tag..."
            className="w-full pl-8 pr-3 py-1.5 rounded-md border border-inherit/15 bg-inherit/5 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-xs"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'audio-bgm', label: 'Músicas' },
            { id: 'audio-sfx', label: 'SFX' },
            { id: 'audio-voice', label: 'Vozes' },
            { id: 'image', label: 'Imagens' },
            { id: 'video', label: 'Vídeos' },
            { id: 'upload', label: 'Uploads' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilterType(item.id)}
              className={`px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${
                filterType === item.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-inherit/10 hover:bg-inherit/20 text-neutral-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Asset Grid / List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-neutral-400">
            <FolderArchive className="w-8 h-8 opacity-40 mb-2" />
            <span className="text-xs">Nenhum asset encontrado.</span>
          </div>
        ) : (
          filteredAssets.map((asset) => {
            const isAudio = asset.type.startsWith('audio');
            const isImage = asset.type === 'image';
            const isVideo = asset.type === 'video';

            return (
              <div
                key={asset.id}
                className="flex items-center justify-between p-2 rounded-lg border border-inherit/15 hover:border-emerald-500/40 bg-inherit/5 transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Thumbnail / Icon */}
                  <div className="w-10 h-10 rounded-md overflow-hidden bg-black/40 flex items-center justify-center shrink-0 border border-inherit/20">
                    {isAudio && (
                      <div className="text-blue-400">
                        {asset.type === 'audio-bgm' ? (
                          <Music className="w-4 h-4" />
                        ) : asset.type === 'audio-voice' ? (
                          <Mic className="w-4 h-4" />
                        ) : (
                          <Zap className="w-4 h-4" />
                        )}
                      </div>
                    )}
                    {isImage && asset.url && (
                      <img
                        src={asset.url}
                        alt={asset.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    {isVideo && <Video className="w-4 h-4 text-purple-400" />}
                  </div>

                  {/* Metadata */}
                  <div className="truncate">
                    <div className="font-semibold truncate max-w-[160px] sm:max-w-xs">
                      {asset.title}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] opacity-60">
                      <span className="capitalize">{asset.type.replace('audio-', '')}</span>
                      {asset.duration && <span>• {Math.round(asset.duration)}s</span>}
                      {asset.sizeBytes && (
                        <span>• {(asset.sizeBytes / 1024 / 1024).toFixed(1)} MB</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {isAudio && asset.url && (
                    <button
                      type="button"
                      onClick={() => toggleAudioPlay(asset)}
                      className="p-1.5 rounded-md hover:bg-inherit/20 text-blue-400"
                      title={playingAssetId === asset.id ? 'Pausar' : 'Ouvir'}
                    >
                      {playingAssetId === asset.id ? (
                        <Pause className="w-3.5 h-3.5" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      onInsertToTimeline(asset);
                      onShowToast(`"${asset.title}" adicionado à Timeline!`);
                    }}
                    className="p-1.5 rounded-md hover:bg-emerald-500/10 text-emerald-400"
                    title="Adicionar à Timeline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteAsset(asset.id)}
                    className="p-1.5 rounded-md hover:bg-red-500/10 text-red-400"
                    title="Remover Asset"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

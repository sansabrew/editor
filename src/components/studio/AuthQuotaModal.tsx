import React, { useState } from 'react';
import {
  UserProfile,
  EditorTheme,
} from '../../types';
import {
  User,
  ShieldCheck,
  Zap,
  HardDrive,
  Music,
  Video,
  X,
  LogOut,
  CheckCircle,
  Sparkles,
} from 'lucide-react';

interface AuthQuotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdateUser: (updates: Partial<UserProfile>) => void;
  theme: EditorTheme;
  onShowToast: (msg: string) => void;
}

export const AuthQuotaModal: React.FC<AuthQuotaModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUser,
  theme,
  onShowToast,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);

  if (!isOpen) return null;

  const isDark = theme === 'dark';

  const handleSaveProfile = () => {
    onUpdateUser({ name, email });
    setIsEditing(false);
    onShowToast('Perfil de criador atualizado!');
  };

  const handleResetCredits = () => {
    onUpdateUser({
      audioCredits: 150,
      videoCredits: 60,
    });
    onShowToast('Créditos de IA recarregados com sucesso!');
  };

  const storagePercentage = Math.min(
    100,
    Math.round((user.storageUsedMB / user.storageLimitMB) * 100)
  );

  return (
    <div
      id="auth-quota-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        id="auth-quota-modal-card"
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md rounded-xl border shadow-2xl overflow-hidden text-xs ${
          isDark ? 'bg-neutral-900 border-neutral-700 text-neutral-100' : 'bg-white border-neutral-200 text-neutral-800'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-inherit/15">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-blue-500" />
            <span className="font-semibold text-sm">Autenticação &amp; Cotas de IA</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md hover:bg-inherit/20 text-neutral-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* User Profile Card */}
          <div className="flex items-center gap-3 p-3 rounded-lg border border-inherit/15 bg-inherit/5">
            <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm truncate">{user.name}</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-semibold text-[10px] uppercase">
                  Plano {user.plan}
                </span>
              </div>
              <div className="text-neutral-400 truncate text-[11px]">{user.email}</div>
            </div>
          </div>

          {/* Quotas & Resource Usage */}
          <div className="space-y-3">
            <div className="font-semibold text-xs opacity-75">Uso de Recursos &amp; Créditos IA:</div>

            {/* Audio Generation Credits */}
            <div className="p-3 rounded-lg border border-inherit/15 bg-inherit/5 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Music className="w-3.5 h-3.5 text-blue-400" />
                  <span className="font-medium">Créditos de Áudio Generativo</span>
                </div>
                <span className="font-mono font-bold text-blue-400">
                  {user.audioCredits} min restantes
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: '80%' }} />
              </div>
              <div className="text-[10px] opacity-60">
                Geração de BGM ilimitada local e síntese de efeitos procedural
              </div>
            </div>

            {/* Video Generation Credits */}
            <div className="p-3 rounded-lg border border-inherit/15 bg-inherit/5 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Video className="w-3.5 h-3.5 text-purple-400" />
                  <span className="font-medium">Créditos de Render de Vídeo</span>
                </div>
                <span className="font-mono font-bold text-purple-400">
                  {user.videoCredits} / 60
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                <div className="h-full bg-purple-500" style={{ width: '75%' }} />
              </div>
              <div className="text-[10px] opacity-60">
                Text-to-Video, animações de câmera e interpolação de quadros
              </div>
            </div>

            {/* Storage Meter */}
            <div className="p-3 rounded-lg border border-inherit/15 bg-inherit/5 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-medium">Armazenamento em Nuvem &amp; Vault</span>
                </div>
                <span className="font-mono text-emerald-400 font-semibold">
                  {user.storageUsedMB} MB / {(user.storageLimitMB / 1024).toFixed(0)} GB ({storagePercentage}%)
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${storagePercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-inherit/15 bg-inherit/10">
          <button
            type="button"
            onClick={handleResetCredits}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-inherit/20 text-amber-400 text-xs font-medium"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Recarregar Cotas</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium"
          >
            Concluído
          </button>
        </div>
      </div>
    </div>
  );
};

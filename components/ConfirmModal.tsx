import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'confirm' | 'alert';
  isDestructive?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "확인",
  cancelText = "취소",
  isDestructive = false,
  type = 'confirm'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={type === 'alert' ? onClose : undefined} // Click outside closes Alert, but maybe strict for confirm?
      />
      <div className="relative bg-[#1a1a1a] border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${isDestructive ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
            }`}>
            <AlertTriangle className="w-8 h-8" />
          </div>

          <h3 className="text-xl font-bold text-white">{title}</h3>

          <p className="text-sm text-gray-400 whitespace-pre-wrap leading-relaxed">
            {message}
          </p>

          <div className={`grid ${type === 'alert' ? 'grid-cols-1' : 'grid-cols-2'} gap-3 w-full pt-4`}>
            {type === 'confirm' && (
              <button
                onClick={onClose}
                className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-sm transition-colors"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={() => {
                if (type === 'confirm') onConfirm();
                onClose();
              }}
              className={`px-4 py-3 rounded-xl font-bold text-sm transition-colors shadow-lg ${isDestructive
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20'
                  : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-500/20'
                }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

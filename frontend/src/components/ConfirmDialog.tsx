import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
  disabled?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'danger',
  disabled = false
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <AlertTriangle className="h-6 w-6 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
      case 'info':
        return <AlertTriangle className="h-6 w-6 text-blue-600" />;
      default:
        return <AlertTriangle className="h-6 w-6 text-red-600" />;
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500';
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
      default:
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-strong animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-2xl mr-4">
              {getIcon()}
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {title}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <p className="text-gray-700 mb-8 leading-relaxed">
          {message}
        </p>
        
        <div className="flex space-x-4">
          <button
            onClick={onCancel}
            disabled={disabled}
            className="btn btn-secondary flex-1 text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={disabled}
            className={`btn text-white flex-1 text-lg py-4 ${getButtonColor()} focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;

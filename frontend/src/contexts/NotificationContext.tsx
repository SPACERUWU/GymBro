import React, { createContext, useContext, useState, ReactNode } from 'react';
import Notification, { NotificationType } from '../components/Notification';

interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
}

interface NotificationContextType {
  showNotification: (notification: Omit<NotificationData, 'id'>) => void;
  showSuccess: (title: string, message: string, duration?: number) => void;
  showError: (title: string, message: string, duration?: number) => void;
  showWarning: (title: string, message: string, duration?: number) => void;
  showInfo: (title: string, message: string, duration?: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const showNotification = (notification: Omit<NotificationData, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification: NotificationData = {
      id,
      ...notification,
    };
    
    setNotifications(prev => [...prev, newNotification]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const showSuccess = (title: string, message: string, duration?: number) => {
    showNotification({ type: 'success', title, message, duration });
  };

  const showError = (title: string, message: string, duration?: number) => {
    showNotification({ type: 'error', title, message, duration });
  };

  const showWarning = (title: string, message: string, duration?: number) => {
    showNotification({ type: 'warning', title, message, duration });
  };

  const showInfo = (title: string, message: string, duration?: number) => {
    showNotification({ type: 'info', title, message, duration });
  };

  return (
    <NotificationContext.Provider
      value={{
        showNotification,
        showSuccess,
        showError,
        showWarning,
        showInfo,
      }}
    >
      {children}
      
      {/* Notification Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            id={notification.id}
            type={notification.type}
            title={notification.title}
            message={notification.message}
            duration={notification.duration}
            onClose={removeNotification}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

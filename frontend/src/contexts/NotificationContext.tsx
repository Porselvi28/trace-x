import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
}

interface NotificationContextType {
  notify: (type: NotificationType, title: string, message?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notify = (type: NotificationType, title: string, message?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications((prev) => [...prev, { id, type, title, message }]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4500);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`pointer-events-auto p-3.5 rounded-lg border shadow-lg flex items-start gap-3 transition-all ${
              n.type === 'success'
                ? 'bg-[#EAF2EC] border-[#47765B] text-[#47765B]'
                : n.type === 'error'
                ? 'bg-[#F8EBEA] border-[#A64B43] text-[#A64B43]'
                : n.type === 'warning'
                ? 'bg-[#FBF5EA] border-[#B78035] text-[#B78035]'
                : 'bg-[#EFF4F8] border-[#647D91] text-[#647D91]'
            }`}
          >
            {n.type === 'success' && <CheckCircle2 className="w-5 h-5 text-[#47765B] shrink-0 mt-0.5" />}
            {n.type === 'error' && <AlertCircle className="w-5 h-5 text-[#A64B43] shrink-0 mt-0.5" />}
            {n.type === 'warning' && <AlertTriangle className="w-5 h-5 text-[#B78035] shrink-0 mt-0.5" />}
            {n.type === 'info' && <Info className="w-5 h-5 text-[#647D91] shrink-0 mt-0.5" />}

            <div className="flex-1 text-sm">
              <div className="font-bold text-[#342A23]">{n.title}</div>
              {n.message && <div className="text-xs text-[#796C60] mt-0.5">{n.message}</div>}
            </div>

            <button
              onClick={() => removeNotification(n.id)}
              className="text-[#796C60] hover:text-[#342A23] p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

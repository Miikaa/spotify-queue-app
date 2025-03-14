import { NotificationType } from '@/hooks/useNotification';

interface NotificationProps {
  id: number;
  message: string;
  type: NotificationType;
  onClose: (id: number) => void;
}

const bgColors = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
};

export function Notification({ id, message, type, onClose }: NotificationProps) {
  return (
    <div
      className={`${bgColors[type]} text-white px-4 py-2 rounded-lg shadow-lg flex justify-between items-center`}
      role="alert"
    >
      <p>{message}</p>
      <button
        onClick={() => onClose(id)}
        className="ml-4 text-white hover:text-gray-200 focus:outline-none"
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
}

export function NotificationContainer({ notifications, onClose }: {
  notifications: { id: number; message: string; type: NotificationType }[];
  onClose: (id: number) => void;
}) {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50">
      {notifications.map(notification => (
        <Notification key={notification.id} {...notification} onClose={onClose} />
      ))}
    </div>
  );
} 
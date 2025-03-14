type NotificationType = 'error' | 'success' | 'info';

interface ErrorHandlerOptions {
  addNotification: (message: string, type: NotificationType) => void;
  defaultMessage?: string;
  silent?: boolean;
}

export const handleSpotifyError = (
  error: unknown,
  options: ErrorHandlerOptions
) => {
  const { addNotification, defaultMessage = 'An error occurred', silent = false } = options;

  if (!silent) {
    console.error('Spotify API Error:', error);
  }

  let message = defaultMessage;

  if (error instanceof Error) {
    // Handle specific Spotify API errors
    if (error.message.includes('No active device found')) {
      message = 'Please open Spotify and start playing on any device';
    } else if (error.message.includes('The access token expired')) {
      message = 'Your session has expired. Please sign in again';
    } else {
      message = error.message;
    }
  }

  addNotification(message, 'error');
  return message;
}; 
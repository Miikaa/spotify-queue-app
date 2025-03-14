import { useEffect } from 'react';

interface ShortcutHandlers {
  onSearch?: () => void;
  onSkip?: () => void;
  onClearQueue?: () => void;
  onSwitchTab?: () => void;
}

export function useKeyboardShortcuts({
  onSearch,
  onSkip,
  onClearQueue,
  onSwitchTab,
}: ShortcutHandlers) {
  useEffect(() => {
    function handleKeyPress(event: KeyboardEvent) {
      // Only handle shortcuts if not in an input field
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Ctrl/Cmd + K for search
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        onSearch?.();
      }

      // Ctrl/Cmd + Right Arrow for skip
      if ((event.ctrlKey || event.metaKey) && event.key === 'ArrowRight') {
        event.preventDefault();
        onSkip?.();
      }

      // Ctrl/Cmd + Backspace for clear queue
      if ((event.ctrlKey || event.metaKey) && event.key === 'Backspace') {
        event.preventDefault();
        onClearQueue?.();
      }

      // Tab for switching tabs
      if (event.key === 'Tab') {
        event.preventDefault();
        onSwitchTab?.();
      }
    }

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onSearch, onSkip, onClearQueue, onSwitchTab]);
} 
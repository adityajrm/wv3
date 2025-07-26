import { useEffect, useCallback } from 'react';

interface KeyboardNavigationOptions {
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onEnter?: () => void;
  onEscape?: () => void;
  disabled?: boolean;
}

export const useKeyboardNavigation = (options: KeyboardNavigationOptions) => {
  const {
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onEnter,
    onEscape,
    disabled = false
  } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (disabled) return;

      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          onArrowUp?.();
          break;
        case 'ArrowDown':
          event.preventDefault();
          onArrowDown?.();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          onArrowLeft?.();
          break;
        case 'ArrowRight':
          event.preventDefault();
          onArrowRight?.();
          break;
        case 'Enter':
          event.preventDefault();
          onEnter?.();
          break;
        case 'Escape':
          event.preventDefault();
          onEscape?.();
          break;
      }
    },
    [onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onEnter, onEscape, disabled]
  );

  useEffect(() => {
    if (!disabled) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, disabled]);
};

// Focus management utilities
export const focusElement = (selector: string) => {
  const element = document.querySelector(selector) as HTMLElement;
  if (element) {
    element.focus();
  }
};

export const getFocusableElements = (container: HTMLElement) => {
  const focusableSelectors = [
    'button',
    '[href]',
    'input',
    'select',
    'textarea',
    '[tabindex]:not([tabindex="-1"])'
  ].join(', ');
  
  return Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
};
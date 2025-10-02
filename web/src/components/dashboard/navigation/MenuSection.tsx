import React, { ReactNode, useState } from 'react';

/**
 * MenuSection - Collapsible menu section component
 * 
 * Features:
 * - Section title
 * - Collapsible content
 * - Collapsed sidebar support
 * - Smooth animations
 */

interface MenuSectionProps {
  title: string;
  children: ReactNode;
  isCollapsed: boolean;
  defaultOpen?: boolean;
}

export default function MenuSection({
  title,
  children,
  isCollapsed,
  defaultOpen = true
}: MenuSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (isCollapsed) {
    // In collapsed mode, show a divider instead of section title
    return (
      <>
        <div className="my-2 border-t border-gray-200 dark:border-gray-700"></div>
        {children}
      </>
    );
  }

  return (
    <div className="mb-2">
      {/* Section Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        <span>{title}</span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-0' : '-rotate-90'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Section Content */}
      <div
        className={`space-y-1 overflow-hidden transition-all duration-200 ${
          isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        {children}
      </div>
    </div>
  );
}

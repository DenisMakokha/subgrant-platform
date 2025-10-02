import React, { ReactNode } from 'react';

interface SplitLayoutProps {
  master: ReactNode;
  detail: ReactNode;
  masterWidth?: 'narrow' | 'medium' | 'wide';
  className?: string;
}

export default function SplitLayout({ master, detail, masterWidth = 'medium', className = '' }: SplitLayoutProps) {
  const widthClasses = {
    narrow: 'lg:w-1/4',
    medium: 'lg:w-1/3',
    wide: 'lg:w-2/5'
  };

  return (
    <div className={`flex flex-col lg:flex-row gap-6 ${className}`}>
      <div className={`${widthClasses[masterWidth]} flex-shrink-0`}>
        {master}
      </div>
      <div className="flex-1 min-w-0">
        {detail}
      </div>
    </div>
  );
}

import React from 'react';
import { cn } from '../utils/cn.js';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const Container: React.FC<ContainerProps> = ({ size = 'xl', className, children, ...props }) => {
  const sizes = {
    sm: 'max-w-3xl',
    md: 'max-w-5xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-full',
  };

  return (
    <div className={cn('w-full mx-auto px-4 sm:px-6 lg:px-8', sizes[size], className)} {...props}>
      {children}
    </div>
  );
};

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  spacing?: 'none' | 'sm' | 'md' | 'lg';
}

export const Section: React.FC<SectionProps> = ({ spacing = 'md', className, children, ...props }) => {
  const spacings = {
    none: 'py-0',
    sm: 'py-4 sm:py-6',
    md: 'py-8 sm:py-12',
    lg: 'py-12 sm:py-16',
  };

  return (
    <section className={cn(spacings[spacing], className)} {...props}>
      {children}
    </section>
  );
};

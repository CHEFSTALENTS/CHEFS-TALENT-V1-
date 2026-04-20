'use client';

import React from 'react';
import { motion } from 'framer-motion';

// --- VISUAL PRIMITIVES ---

// 1. Marker — filet éditorial discret champagne
export const Marker = ({ className = '' }: { className?: string }) => (
  <div className={`w-6 h-px bg-champagne mb-8 ${className}`} />
);

// 2. Label — uppercase, wide tracking, small
export const Label = ({ children, className = '' }: { children?: React.ReactNode, className?: string }) => (
  <label className={`block text-[10px] md:text-xs font-medium uppercase tracking-[0.2em] text-stone-400 mb-3 ${className}`}>
    {children}
  </label>
);

// 3. Reveal — motion gesture éditoriale
export const Reveal: React.FC<{ children?: React.ReactNode; className?: string; delay?: number }> = ({ children, className = '', delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-10%" }}
    transition={{ duration: 0.9, delay, ease: [0.2, 0.8, 0.2, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

// --- COMPONENT LIBRARY ---

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', ...props }, ref) => {

    const baseStyles =
      "group inline-flex items-center justify-center gap-2 rounded-full text-[13px] font-medium tracking-[0.02em] transition-all duration-300 ease-editorial focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:opacity-50 disabled:pointer-events-none";

    const variants = {
      default:
        "bg-ink text-paper hover:bg-stone-800 border border-ink shadow-card hover:shadow-floating",
      outline:
        "border border-stone-300 bg-transparent text-stone-900 hover:border-ink hover:bg-stone-50",
      ghost:
        "bg-transparent text-stone-600 hover:bg-stone-100 hover:text-ink",
      link:
        "text-ink underline-kinetic rounded-none px-0 tracking-normal",
    };

    const sizes = {
      default: "h-[52px] px-7",
      sm: "h-11 px-5 text-[12px]",
      lg: "h-[60px] px-9 text-sm",
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => {
    return (
      <input
        className={`flex h-14 w-full rounded-field border border-stone-200 bg-white px-4 py-2 text-base text-stone-900 placeholder:text-stone-400 focus-visible:outline-none focus-visible:border-ink focus-visible:ring-2 focus-visible:ring-ink/5 transition-colors duration-300 ease-editorial disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className = '', ...props }, ref) => {
    return (
      <textarea
        className={`flex min-h-[140px] w-full rounded-field border border-stone-200 bg-white px-4 py-4 text-base text-stone-900 placeholder:text-stone-400 focus-visible:outline-none focus-visible:border-ink focus-visible:ring-2 focus-visible:ring-ink/5 disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-colors duration-300 ease-editorial ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export const Card = ({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`bg-white border border-stone-100 rounded-field shadow-editorial transition-shadow duration-500 ease-editorial hover:shadow-card ${className}`}
    {...props}
  />
);

export const CardHeader = ({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`p-8 md:p-10 pb-4 space-y-2 ${className}`} {...props} />
);

export const CardTitle = ({ className = '', ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={`font-display text-2xl font-normal text-ink ${className}`} {...props} />
);

export const CardContent = ({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`p-8 md:p-10 pt-0 ${className}`} {...props} />
);

export const Badge = ({ className = '', variant = 'default', children, ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'secondary' | 'outline' }) => {
  const variants = {
    default: "bg-ink text-paper border-transparent",
    secondary: "bg-stone-100 text-stone-600 border-transparent",
    outline: "text-stone-500 border-stone-200 border",
  };
  return (
    <div className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-[10px] uppercase tracking-editorial font-medium border ${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
}

export const Section = ({ className = '', children, id }: { className?: string, children?: React.ReactNode, id?: string }) => (
  <section id={id} className={`py-24 md:py-36 px-6 md:px-10 lg:px-14 max-w-[88rem] mx-auto ${className}`}>
    {children}
  </section>
);

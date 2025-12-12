'use client';

import React from 'react';
import { motion } from 'framer-motion';

// --- VISUAL PRIMITIVES ---

// 1. The Marker: Visual anchor for rhythm
export const Marker = ({ className = '' }: { className?: string }) => (
  <div className={`w-[1px] h-12 bg-stone-300 mb-8 ${className}`} />
);

// 2. The Label: Uppercase, wide tracking, small
export const Label = ({ children, className = '' }: { children?: React.ReactNode, className?: string }) => (
  <label className={`block text-[10px] md:text-xs font-medium uppercase tracking-[0.2em] text-stone-400 mb-3 ${className}`}>
    {children}
  </label>
);

// 3. Motion Gesture: Vertical Reveal
export const Reveal: React.FC<{ children?: React.ReactNode; className?: string; delay?: number }> = ({ children, className = '', delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-10%" }} // Trigger slightly later for drama
    transition={{ duration: 0.9, delay, ease: [0.2, 0.8, 0.2, 1] }} // Heavy editorial ease
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
    
    const baseStyles = "inline-flex items-center justify-center rounded-none text-xs font-medium uppercase tracking-[0.15em] transition-all duration-500 focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none";
    
    const variants = {
      default: "bg-stone-900 text-stone-50 hover:bg-stone-800 border border-stone-900", 
      outline: "border border-stone-200 bg-transparent hover:border-stone-900 hover:text-stone-900 text-stone-500",
      ghost: "hover:bg-stone-100 text-stone-600 hover:text-stone-900",
      link: "text-stone-900 underline-offset-8 hover:underline decoration-stone-300 normal-case tracking-normal", 
    };

    const sizes = {
      default: "h-14 px-8", 
      sm: "h-10 px-6",
      lg: "h-16 px-12",
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
        className={`flex h-12 w-full rounded-none border-b border-stone-200 bg-transparent px-0 py-2 text-base md:text-lg text-stone-900 placeholder:text-stone-300 focus-visible:outline-none focus-visible:border-stone-900 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
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
        className={`flex min-h-[120px] w-full rounded-none border border-stone-200 bg-transparent px-4 py-4 text-base text-stone-900 placeholder:text-stone-300 focus-visible:outline-none focus-visible:border-stone-900 disabled:cursor-not-allowed disabled:opacity-50 resize-none ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export const Card = ({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`bg-white border border-stone-100 ${className}`} {...props} />
);

export const CardHeader = ({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`p-8 md:p-10 pb-4 space-y-2 ${className}`} {...props} />
);

export const CardTitle = ({ className = '', ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={`font-serif text-2xl font-normal text-stone-900 ${className}`} {...props} />
);

export const CardContent = ({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`p-8 md:p-10 pt-0 ${className}`} {...props} />
);

export const Badge = ({ className = '', variant = 'default', children, ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'secondary' | 'outline' }) => {
  const variants = {
    default: "bg-stone-900 text-white border-transparent",
    secondary: "bg-stone-100 text-stone-600 border-transparent",
    outline: "text-stone-500 border-stone-200 border",
  };
  return (
    <div className={`inline-flex items-center justify-center px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium border ${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
}

export const Section = ({ className = '', children, id }: { className?: string, children?: React.ReactNode, id?: string }) => (
  <section id={id} className={`py-32 md:py-48 px-6 md:px-12 max-w-[100rem] mx-auto ${className}`}>
    {children}
  </section>
);
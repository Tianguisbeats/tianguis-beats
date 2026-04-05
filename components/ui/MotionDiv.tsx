"use client";

import React, { useState, useEffect, useRef } from 'react';

// ═══════════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════════

export function useInView(ref: React.RefObject<HTMLElement | null>, threshold = 0.1) {
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, threshold]);

  return isInView;
}

// ═══════════════════════════════════════════════════════════════════
// MOTION DIV
// ═══════════════════════════════════════════════════════════════════

interface MotionProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  initial?: { opacity?: number; transform?: string; scale?: number };
  animate?: { opacity?: number | number[]; transform?: string | string[]; scale?: number };
  transition?: { duration?: number; delay?: number; ease?: string; repeat?: number | typeof Infinity };
  whileInView?: { opacity?: number; transform?: string; scale?: number };
  viewport?: { once?: boolean; margin?: string };
  ref?: React.RefObject<HTMLDivElement | null>;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function MotionDiv({ children, className = '', style = {}, initial, animate, transition = {}, whileInView, viewport, ref, onMouseEnter, onMouseLeave }: MotionProps) {
  const [isMounted, setIsMounted] = useState(false);
  const internalRef = useRef<HTMLDivElement>(null);
  const elementRef = ref || internalRef;
  const isVisible = useInView(elementRef as React.RefObject<HTMLElement | null>);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const defaultEase = 'cubic-bezier(0.22, 1, 0.36, 1)';

  let targetStyle = { ...style };

  const applyStyles = (source: any) => {
    if (!source) return;
    if (source.opacity !== undefined) {
      if (!Array.isArray(source.opacity)) {
        targetStyle.opacity = source.opacity;
      }
    }
    if (source.transform !== undefined) {
      if (!Array.isArray(source.transform)) {
        targetStyle.transform = source.transform;
      }
    }
    if (source.scale !== undefined) {
      const existingTransform = targetStyle.transform || '';
      targetStyle.transform = `${existingTransform} scale(${source.scale})`.trim();
    }
  };

  if (whileInView && isVisible) {
    applyStyles(whileInView);
  } else if (isMounted && animate) {
    applyStyles(animate);
  } else if (initial) {
    applyStyles(initial);
  }

  const isAnimatedOpacity = animate && Array.isArray(animate.opacity);
  const isAnimatedTransform = animate && Array.isArray(animate.transform);
  const hasCustomAnimation = isAnimatedOpacity || isAnimatedTransform;

  // Casting helpers for style-jsx
  const opArray = isAnimatedOpacity ? (animate?.opacity as number[]) : [];
  const trArray = isAnimatedTransform ? (animate?.transform as string[]) : [];

  return (
    <div
      ref={elementRef}
      className={`${className} ${hasCustomAnimation ? 'animate-custom' : ''}`}
      style={{
        ...targetStyle,
        transition: !hasCustomAnimation ? `all ${transition.duration ?? 0.5}s ${transition.ease ?? defaultEase} ${transition.delay ?? 0}s` : 'none',
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
      {hasCustomAnimation && (
        <style jsx>{`
          @keyframes custom-anim {
            0% { 
              ${isAnimatedOpacity ? `opacity: ${opArray[0]};` : ''} 
              ${isAnimatedTransform ? `transform: ${trArray[0]};` : ''}
            }
            50% { 
              ${isAnimatedOpacity ? `opacity: ${opArray[1]};` : ''} 
              ${isAnimatedTransform ? `transform: ${trArray[1]};` : ''}
            }
            100% { 
              ${isAnimatedOpacity ? `opacity: ${opArray[2] ?? opArray[0]};` : ''} 
              ${isAnimatedTransform ? `transform: ${trArray[2] ?? trArray[0]};` : ''}
            }
          }
          .animate-custom {
            animation: custom-anim ${transition.duration ?? 3}s ${transition.ease ?? 'ease-in-out'} ${transition.delay ?? 0}s ${transition.repeat === Infinity ? 'infinite' : transition.repeat ?? 1};
          }
        `}</style>
      )}
    </div>
  );
}

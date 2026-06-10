"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════════

export function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollTop = window.scrollY;
      const newProgress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      setProgress(newProgress);
      setScrollY(scrollTop);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return { progress, scrollY };
}

// ═══════════════════════════════════════════════════════════════════
// SCROLL REVEAL HOOK - ctrl.xyz style
// ═══════════════════════════════════════════════════════════════════

export function useScrollReveal(ref: React.RefObject<HTMLElement | null>, threshold = 0.1) {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold }
    );

    // Track scroll progress within element
    const handleScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const elementTop = rect.top;
      const elementHeight = rect.height;

      // Calculate progress from when element enters viewport to when it leaves
      const start = windowHeight;
      const end = -elementHeight;
      const progress = Math.max(0, Math.min(1, (start - elementTop) / (start - end)));
      setScrollProgress(progress);
    };

    observer.observe(ref.current);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [ref, threshold]);

  return { isVisible, scrollProgress };
}

// ═══════════════════════════════════════════════════════════════════
// NOISE OVERLAY (Cosmos Aesthetic)
// ═══════════════════════════════════════════════════════════════════

export function NoiseOverlay() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.015] dark:opacity-[0.03]">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PARALLAX BACKGROUND - Optimized for 60fps
// ═══════════════════════════════════════════════════════════════════

export function ParallaxBackground({ scrollY: _unused }: { scrollY: number }) {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 5000], [0, 1000]);
  const y2 = useTransform(scrollY, [0, 5000], [0, -750]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-20 bg-[#ffffff] dark:bg-[#000000]">
      {/* Revolut-style soft blue/cyan accent blobs */}
      <motion.div
        className="absolute w-[120vw] h-[120vw] rounded-full blur-[160px] opacity-10 dark:opacity-20 translate-z-0"
        style={{
          background: 'radial-gradient(circle, rgba(0,117,255,0.12) 0%, transparent 70%)',
          top: '-40%',
          right: '-30%',
          y: y1,
        }}
        animate={{ opacity: [0.08, 0.12, 0.08] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      
      <motion.div
        className="absolute w-[100vw] h-[100vw] rounded-full blur-[140px] opacity-10 dark:opacity-15 translate-z-0"
        style={{
          background: 'radial-gradient(circle, rgba(0,209,255,0.08) 0%, transparent 70%)',
          bottom: '-30%',
          left: '-40%',
          y: y2,
        }}
      />

      {/* Very subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// FLOATING PARTICLES - Enhanced
// ═══════════════════════════════════════════════════════════════════

export function FloatingParticles({ theme = 'blue' }: { theme?: 'blue' | 'green' }) {
  const [montado, setMontado] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    setMontado(true);
  }, []);

  const particlesCount = isMobile ? 8 : 40;

  // Memoizado: las posiciones aleatorias se calculan una sola vez por
  // (cantidad, dispositivo), no en cada render.
  const particles = useMemo(() => Array.from({ length: particlesCount }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 6 + (isMobile ? 1 : 2),
    duration: Math.random() * 20 + 20,
    delay: Math.random() * 10,
    opacity: Math.random() * 0.3 + 0.1,
    blur: Math.random() > 0.8 && !isMobile ? 'blur-sm' : '',
  })), [particlesCount, isMobile]);

  const themes = {
    blue: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 50%, #06b6d4 100%)',
    green: 'linear-gradient(135deg, #10b981 0%, #34d399 50%, #059669 100%)'
  };

  // No renderizar en el servidor: las posiciones aleatorias diferían entre
  // servidor y cliente y causaban errores de hidratación (React botaba el HTML
  // del servidor y re-renderizaba). Al pintarlas solo tras montar en el cliente,
  // eliminamos el mismatch. Es decoración de fondo (-z-10), así que no hay salto.
  if (!montado) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      {particles.map((p) => (
        <div
          key={p.id}
          className={`absolute rounded-full animate-particle ${p.blur}`}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: themes[theme],
            opacity: p.opacity,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
      <style jsx global>{`
        @keyframes particle-float {
          0%, 100% { transform: translateY(0) translateX(0) scale(1); }
          25% { transform: translateY(-30px) translateX(15px) scale(1.1); }
          50% { transform: translateY(-15px) translateX(-15px) scale(0.9); }
          75% { transform: translateY(-40px) translateX(10px) scale(1.05); }
        }
        .animate-particle {
          animation: particle-float 25s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SCROLL REVEAL COMPONENT - ctrl.xyz style reveal on scroll
// ═══════════════════════════════════════════════════════════════════

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right' | 'scale';
  delay?: number;
  duration?: number;
  threshold?: number;
  distance?: number;
}

export function ScrollReveal({
  children,
  className = '',
  direction = 'up',
  delay = 0,
  duration = 0.8,
  threshold = 0.1,
  distance = 60
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { isVisible, scrollProgress } = useScrollReveal(ref as React.RefObject<HTMLElement | null>, threshold);

  const getInitialTransform = () => {
    switch (direction) {
      case 'up': return `translateY(${distance}px)`;
      case 'down': return `translateY(-${distance}px)`;
      case 'left': return `translateX(${distance}px)`;
      case 'right': return `translateX(-${distance}px)`;
      case 'scale': return 'scale(0.8)';
      default: return `translateY(${distance}px)`;
    }
  };

  const getActiveTransform = () => {
    switch (direction) {
      case 'up':
      case 'down':
      case 'left':
      case 'right':
        return 'translateY(0) translateX(0)';
      case 'scale': return 'scale(1)';
      default: return 'translateY(0)';
    }
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? getActiveTransform() : getInitialTransform(),
        transition: `opacity ${duration}s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s, transform ${duration}s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PARALLAX SECTION - Full section with parallax effect
// ═══════════════════════════════════════════════════════════════════

interface ParallaxSectionProps {
  children: React.ReactNode;
  className?: string;
  speed?: number;
  backgroundImage?: string;
}

export function ParallaxSection({
  children,
  className = '',
  speed = 0.5,
  backgroundImage
}: ParallaxSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const scrollTop = window.scrollY;
      const elementTop = rect.top + scrollTop;
      const relativeScroll = scrollTop - elementTop;
      setOffset(relativeScroll * speed);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      {backgroundImage && (
        <div
          className="absolute inset-0 w-full h-[120%] -top-[10%]"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transform: `translateY(${offset}px)`,
          }}
        />
      )}
      <div className="relative z-10 h-full w-full flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// STAGGERED REVEAL - For lists of items
// ═══════════════════════════════════════════════════════════════════

interface StaggeredRevealProps {
  children: React.ReactNode[];
  className?: string;
  staggerDelay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'scale';
}

export function StaggeredReveal({
  children,
  className = '',
  staggerDelay = 0.1,
  direction = 'up'
}: StaggeredRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Reveal items with stagger
            children.forEach((_, index) => {
              setTimeout(() => {
                setVisibleItems(prev => new Set([...prev, index]));
              }, index * staggerDelay * 1000);
            });
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [children.length, staggerDelay]);

  const getTransform = (index: number, isVisible: boolean) => {
    const distance = 40;
    let transform = '';
    switch (direction) {
      case 'up': transform = `translateY(${isVisible ? 0 : distance}px)`; break;
      case 'down': transform = `translateY(${isVisible ? 0 : -distance}px)`; break;
      case 'left': transform = `translateX(${isVisible ? 0 : distance}px)`; break;
      case 'right': transform = `translateX(${isVisible ? 0 : -distance}px)`; break;
      case 'scale': transform = `scale(${isVisible ? 1 : 0.8})`; break;
    }
    return transform;
  };

  return (
    <div ref={containerRef} className={className}>
      {React.Children.map(children, (child, index) => (
        <div
          key={index}
          style={{
            opacity: visibleItems.has(index) ? 1 : 0,
            transform: getTransform(index, visibleItems.has(index)),
            transition: `opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1), transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)`,
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// GLOWING CARD EFFECT
// ═══════════════════════════════════════════════════════════════════

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}

export function GlowCard({ children, className = '', glowColor = '#3b82f6' }: GlowCardProps) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for the glow position
  const springX = useSpring(mouseX, { stiffness: 500, damping: 50 });
  const springY = useSpring(mouseY, { stiffness: 500, damping: 50 });

  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  return (
    <div
      ref={cardRef}
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Glowing gradient on hover using motion.div for hardware acceleration */}
      <motion.div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          background: useTransform(
            [springX, springY],
            ([x, y]) => `radial-gradient(600px circle at ${x}px ${y}px, ${glowColor}, transparent 40%)`
          ),
          opacity: isHovered ? 0.15 : 0,
        }}
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// KINETIC SECTION - Revolut-style scale/fade out on scroll
// ═══════════════════════════════════════════════════════════════════

interface KineticSectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function KineticSection({ children, className = '', id }: KineticSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  // Fades out and scales down as it scrolls out of view
  const opacity = useTransform(scrollYProgress, [0, 0.8, 1], [1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.8, 1], [1, 1, 0.95]);

  return (
    <motion.div 
      ref={ref} 
      id={id}
      className={`relative will-change-transform ${className}`}
      style={{
        opacity,
        scale,
      }}
    >
      {children}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ABSTRACT PUZZLE BACKGROUND COMPONENT
// ═══════════════════════════════════════════════════════════════════

export function AbstractPuzzleBack({ theme, opacity = 1 }: { theme: 'blue' | 'purple' | 'green' | 'orange' | 'pink', opacity?: any }) {
  const colors = {
    blue: ['#EFF6FF', '#DBEAFE', '#BFDBFE', '#93C5FD', '#60A5FA'],
    green: ['#F0FDF4', '#DCFCE7', '#BBF7D0', '#86EFAC', '#4ADE80'],
    orange: ['#FFF7ED', '#FFEDD5', '#FED7AA', '#FDBA74', '#FB923C'],
    purple: ['#FAF5FF', '#F3E8FF', '#E9D5FF', '#D8B4FE', '#C084FC'],
    pink: ['#FDF2F8', '#FCE7F3', '#FBCFE8', '#F9A8D4', '#F472B6']
  };

  return (
    <motion.div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30 dark:opacity-10">
      <div className="w-full h-full transition-opacity duration-700 opacity-100 dark:opacity-80">
        <style>{`
          .puzzle-piece {
            position: absolute;
            z-index: 0;
            pointer-events: none;
            transition: transform 0.8s cubic-bezier(0.19, 1, 0.22, 1);
          }
          .joining-line {
            position: absolute;
            background: rgba(255, 255, 255, 0.15);
            z-index: 1;
            pointer-events: none;
          }
          .diagonal-ray {
            position: absolute;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.4), transparent);
            width: 200%;
            transform: rotate(-35deg);
            pointer-events: none;
            z-index: 1;
            animation: ray-slide 10s linear infinite;
          }
          @keyframes ray-slide {
            0% { transform: rotate(-35deg) translateX(-20%); }
            100% { transform: rotate(-35deg) translateX(20%); }
          }
        `}</style>
        {/* Piece 1 - Large Base */}
        <motion.div 
          initial={{ x: -100, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.19, 1, 0.22, 1] }}
          className="puzzle-piece w-[70%] h-[80%] top-[-15%] left-[-15%]" 
          style={{ 
            background: colors[theme][1],
            clipPath: 'polygon(0 0, 100% 0, 92% 100%, 0 88%)' 
          }} 
        />
        {/* Piece 2 - Right Fragment */}
        <motion.div 
          initial={{ x: 100, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.2, ease: [0.19, 1, 0.22, 1] }}
          className="puzzle-piece w-[55%] h-[65%] top-[10%] right-[-10%]" 
          style={{ 
            background: colors[theme][2],
            clipPath: 'polygon(8% 0, 100% 20%, 100% 100%, 0 75%)' 
          }} 
        />
        {/* Piece 3 - Bottom Fragment */}
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.4, ease: [0.19, 1, 0.22, 1] }}
          className="puzzle-piece w-[60%] h-[55%] bottom-[-15%] left-[10%]" 
          style={{ 
            background: colors[theme][3],
            clipPath: 'polygon(0 25%, 95% 0, 100% 100%, 5% 100%)' 
          }} 
        />
        {/* Piece 4 - Central Detail */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 0.4 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, delay: 0.6, ease: [0.19, 1, 0.22, 1] }}
          className="puzzle-piece w-[45%] h-[40%] top-[30%] left-[25%]" 
          style={{ 
            background: colors[theme][4],
            clipPath: 'polygon(10% 10%, 90% 0%, 100% 70%, 20% 100%)',
          }} 
        />

        {/* Abstract Joining Lines - The "Puzzle" seams */}
        <div className="joining-line w-px h-full top-0 left-[20%] rotate-[25deg] opacity-30 shadow-[0_0_10px_rgba(255,255,255,0.2)] dark:bg-black/10 dark:shadow-[0_0_10px_rgba(0,0,0,0.2)]" />
        <div className="joining-line w-px h-full top-0 left-[45%] rotate-[-15deg] opacity-20 dark:bg-black/5" />
        <div className="joining-line w-px h-full top-0 left-[75%] rotate-[10deg] opacity-25 dark:bg-black/10" />
        <div className="joining-line w-full h-px top-[35%] left-0 rotate-[8deg] opacity-30 shadow-[0_0_10px_rgba(255,255,255,0.2)] dark:bg-black/10 dark:shadow-[0_0_10px_rgba(0,0,0,0.2)]" />
        <div className="joining-line w-full h-px top-[65%] left-0 rotate-[-15deg] opacity-20 dark:bg-black/5" />
        
        {/* Dynamic Floating Ray */}
        <div className="diagonal-ray top-[50%] left-[-10%] opacity-40 dark:opacity-10" style={{ width: '120%', transform: 'rotate(-25deg)' }} />
        <div className="diagonal-ray top-[20%] left-[20%] opacity-20 dark:opacity-5" style={{ width: '100%', transform: 'rotate(15deg)' }} />
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ABSTRACT HOME BACKGROUND COMPONENT (Specific for Home page)
// ═══════════════════════════════════════════════════════════════════

export function AbstractHomeBack({ theme, opacity = 1 }: { theme: 'blue' | 'purple' | 'green' | 'orange' | 'pink', opacity?: any }) {
  const colors = {
    blue: ['#EFF6FF', '#DBEAFE', '#BFDBFE', '#93C5FD'],
    green: ['#F0FDF4', '#DCFCE7', '#BBF7D0', '#86EFAC'],
    orange: ['#FFF7ED', '#FFEDD5', '#FED7AA', '#FDBA74'],
    purple: ['#FAF5FF', '#F3E8FF', '#E9D5FF', '#D8B4FE'],
    pink: ['#FDF2F8', '#FCE7F3', '#FBCFE8', '#F9A8D4']
  };

  return (
    <motion.div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-40 dark:opacity-15">
      <div className="w-full h-full transition-opacity duration-700">
        <style>{`
          .home-shape {
          position: absolute;
          z-index: 0;
          pointer-events: none;
        }
        .home-line {
          position: absolute;
          background: rgba(255, 255, 255, 0.15);
          z-index: 1;
          pointer-events: none;
        }
      `}</style>

      {/* Center Diamond */}
      <motion.div 
        animate={{ rotate: 360, scale: [1, 1.05, 1] }}
        transition={{ rotate: { duration: 60, repeat: Infinity, ease: 'linear' }, scale: { duration: 10, repeat: Infinity, ease: 'easeInOut' } }}
        className="home-shape w-[70vw] h-[70vw] md:w-[50vw] md:h-[50vw] top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 rounded-[15%]" 
        style={{ 
          background: `radial-gradient(circle at center, ${colors[theme][1]} 0%, transparent 70%)`,
        }} 
      />

      {/* Massive Left Triangle */}
      <motion.div 
        initial={{ x: -100, y: -50, opacity: 0 }}
        whileInView={{ x: 0, y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.5, ease: [0.19, 1, 0.22, 1] }}
        className="home-shape w-[60%] h-[80%] top-[10%] left-[-15%]" 
        style={{ 
          background: colors[theme][2],
          clipPath: 'polygon(0% 0%, 100% 30%, 30% 100%, 0% 100%)',
          opacity: 0.8
        }} 
      />

      {/* Floating Right Rhombus */}
      <motion.div 
        initial={{ x: 100, rotate: 15, opacity: 0 }}
        whileInView={{ x: 0, rotate: -10, opacity: 1 }}
        animate={{ y: [0, -30, 0] }}
        viewport={{ once: true }}
        transition={{ duration: 1.5, ease: [0.19, 1, 0.22, 1], y: { duration: 15, repeat: Infinity, ease: "easeInOut" } }}
        className="home-shape w-[40%] h-[60%] top-[20%] right-[-5%]" 
        style={{ 
          background: colors[theme][3],
          clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
          opacity: 0.6
        }} 
      />

      {/* Abstract Orbiting Squares */}
      <motion.div 
        animate={{ rotate: -360 }}
        transition={{ duration: 100, repeat: Infinity, ease: 'linear' }}
        className="absolute w-[80%] h-[80%] top-[10%] left-[10%] pointer-events-none"
      >
        <div className="absolute top-[10%] left-[10%] w-[10%] h-[10%] rounded-xl opacity-40 rotate-45" style={{ background: colors[theme][3] }} />
        <div className="absolute bottom-[20%] right-[10%] w-[15%] h-[15%] rounded-[20%] opacity-30 rotate-[30deg]" style={{ background: colors[theme][2] }} />
      </motion.div>

      {/* Cross intersect lines for blueprint/architectural feel */}
      <div className="home-line w-full h-[1px] top-[30%] left-0 opacity-20 dark:bg-black/10 shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
      <div className="home-line w-full h-[1px] bottom-[20%] left-0 opacity-10 dark:bg-black/5" />
      <div className="home-line w-[1px] h-full top-0 left-[25%] opacity-15 dark:bg-black/10" />
      <div className="home-line w-[1px] h-full top-0 right-[35%] opacity-25 shadow-[0_0_15px_rgba(255,255,255,0.3)] dark:bg-black/10" />
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SOUNDWAVE / VIBRATING SPEAKER COMPONENT
// ═══════════════════════════════════════════════════════════════════

export function AnimacionDeInicio({ theme = 'blue' }: { theme?: 'blue' | 'purple' | 'green' | 'orange' | 'pink' }) {
  const bgClasses = {
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    pink: 'bg-pink-500'
  };

  const borderClasses = {
    blue: 'border-blue-500',
    purple: 'border-purple-500',
    green: 'border-green-500',
    orange: 'border-orange-500',
    pink: 'border-pink-500'
  };

  const bgColor = bgClasses[theme];
  const borderColor = borderClasses[theme];

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none flex items-center justify-center z-[-1]">
      <div className={`absolute w-[30vh] md:w-[40vh] h-[30vh] md:h-[40vh] ${bgColor}/10 rounded-full blur-[40px] animate-pulse`} style={{ animationDuration: '2s' }} />
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full border ${borderColor}/30 dark:${borderColor}/20`}
          initial={{ width: '10vh', height: '10vh', opacity: 1 }}
          animate={{ 
            width: ['10vh', '50vh', '100vh'], 
            height: ['10vh', '50vh', '100vh'], 
            opacity: [0.8, 0.3, 0] 
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 1,
            ease: 'easeOut',
          }}
        />
      ))}
      <motion.div
         className={`absolute w-[15vh] h-[15vh] rounded-full ${bgColor}/5 backdrop-blur-[2px] border ${borderColor}/10`}
         animate={{ scale: [1, 1.05, 1] }}
         transition={{ duration: 0.5, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ABSTRACT BEATS BACKGROUND COMPONENT (Specific for Beats page)
// ═══════════════════════════════════════════════════════════════════

export function AbstractBeatsBack({ theme, opacity = 1 }: { theme: 'blue' | 'purple' | 'green' | 'orange' | 'pink', opacity?: any }) {
  const colors = {
    blue: ['#EFF6FF', '#DBEAFE', '#BFDBFE', '#93C5FD', '#60A5FA'],
    green: ['#F0FDF4', '#DCFCE7', '#BBF7D0', '#86EFAC', '#4ADE80'],
    orange: ['#FFF7ED', '#FFEDD5', '#FED7AA', '#FDBA74', '#FB923C'],
    purple: ['#FAF5FF', '#F3E8FF', '#E9D5FF', '#D8B4FE', '#C084FC'],
    pink: ['#FDF2F8', '#FCE7F3', '#FBCFE8', '#F9A8D4', '#F472B6']
  };

  return (
    <motion.div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-40 dark:opacity-5">
      <div className="w-full h-full transition-opacity duration-700" style={{ opacity: opacity }}>
        <style>{`
          .beats-shape {
            position: absolute;
            z-index: 0;
            pointer-events: none;
          }
        `}</style>

        {/* Pulsing Concentric Circles - Left */}
        <motion.div 
          initial={{ x: -100, y: 100, scale: 0.5, opacity: 0 }}
          whileInView={{ x: 0, y: 0, scale: 1, opacity: 1 }}
          animate={{ scale: [1, 1.1, 1], rotate: 180 }}
          viewport={{ once: true }}
          transition={{ duration: 2, ease: "easeOut", scale: { duration: 15, repeat: Infinity, ease: "easeInOut" }, rotate: { duration: 40, repeat: Infinity, ease: "linear" } }}
          className="beats-shape w-[60vw] h-[60vw] md:w-[40vw] md:h-[40vw] bottom-[-20%] left-[-15%] rounded-full border border-dashed border-opacity-30" 
          style={{ 
            borderColor: colors[theme][3],
            background: `radial-gradient(circle at center, ${colors[theme][1]} 0%, transparent 60%)`,
          }} 
        >
          <div className="absolute inset-4 rounded-full border border-opacity-20" style={{ borderColor: colors[theme][3] }} />
          <div className="absolute inset-10 rounded-full border border-opacity-10" style={{ borderColor: colors[theme][3] }} />
        </motion.div>

        {/* Complex Glass Puzzle Pieces - Optimized */}
        <motion.div 
          initial={{ y: -50, x: -50, opacity: 0 }}
          whileInView={{ y: 0, x: 0, opacity: 0.6 }}
          animate={{ rotate: 15, y: [0, -20, 0] }}
          viewport={{ once: true }}
          transition={{ duration: 2, rotate: { duration: 20, repeat: Infinity, ease: "linear" }, y: { duration: 10, repeat: Infinity, ease: "easeInOut" } }}
          className="beats-shape w-[35%] h-[35%] top-[-5%] left-[25%] drop-shadow-2xl md:backdrop-blur-md" 
          style={{ 
            background: `${colors[theme][2]}90`,
            clipPath: 'polygon(10% 0%, 90% 10%, 100% 80%, 20% 100%)',
          }} 
        />

        <motion.div 
          initial={{ y: 50, x: 50, opacity: 0 }}
          whileInView={{ y: 0, x: 0, opacity: 0.5 }}
          animate={{ rotate: -15, x: [0, 20, 0] }}
          viewport={{ once: true }}
          transition={{ duration: 2.5, delay: 0.5, rotate: { duration: 25, repeat: Infinity, ease: "linear" }, x: { duration: 12, repeat: Infinity, ease: "easeInOut" } }}
          className="beats-shape w-[40%] h-[40%] bottom-[5%] right-[-5%] drop-shadow-xl md:backdrop-blur-sm" 
          style={{ 
            background: `${colors[theme][3]}80`,
            clipPath: 'polygon(0% 20%, 70% 0%, 100% 100%, 15% 90%)',
          }} 
        />

        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 0.4 }}
          animate={{ scale: [1, 1.05, 1], rotate: [0, 5, 0] }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, delay: 0.2, scale: { duration: 8, repeat: Infinity, ease: "easeInOut" } }}
          className="beats-shape w-[45%] h-[40%] top-[40%] left-[30%] md:backdrop-blur-lg" 
          style={{ 
            background: `${colors[theme][4]}40`,
            clipPath: 'polygon(10% 10%, 90% 0%, 100% 70%, 20% 100%)',
          }} 
        />

        {/* Tiny Floating Geometry Dust */}
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            animate={{ 
              y: [0, -100 - (i * 20), 0],
              x: [0, 30 * (i % 2 === 0 ? 1 : -1), 0],
              opacity: [0.1, 0.6, 0.1]
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{
              width: `${10 + i * 4}px`,
              height: `${10 + i * 4}px`,
              background: colors[theme][3],
              left: `${15 + i * 12}%`,
              top: `${85 - i * 8}%`,
            }}
          />
        ))}

        {/* NEW SURPRISE: Scattered Mini Speakers (AnimacionDeInicio) */}
        <motion.div 
          className="absolute top-[10%] left-[5%] w-[100px] h-[100px] scale-[0.3] opacity-60"
          animate={{ opacity: [0, 0.8, 0], scale: [0.2, 0.4, 0.2] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <AnimacionDeInicio theme={theme} />
        </motion.div>

        <motion.div 
          className="absolute bottom-[20%] right-[5%] w-[100px] h-[100px] scale-[0.4] opacity-50"
          animate={{ opacity: [0, 0.6, 0], scale: [0.3, 0.5, 0.3] }}
          transition={{ duration: 7, delay: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <AnimacionDeInicio theme={theme} />
        </motion.div>

        <motion.div 
          className="absolute top-[35%] right-[10%] w-[100px] h-[100px] scale-[0.25] opacity-40 blur-[1px]"
          animate={{ opacity: [0, 0.5, 0], scale: [0.2, 0.35, 0.2] }}
          transition={{ duration: 4.5, delay: 1, repeat: Infinity, ease: 'easeInOut' }}
        >
          <AnimacionDeInicio theme={theme} />
        </motion.div>

        <motion.div 
          className="absolute bottom-[10%] left-[25%] w-[100px] h-[100px] scale-[0.35] opacity-50 blur-[2px]"
          animate={{ opacity: [0, 0.7, 0], scale: [0.25, 0.45, 0.25] }}
          transition={{ duration: 6.5, delay: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <AnimacionDeInicio theme={theme} />
        </motion.div>

      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// NEW: ABSTRACT ELEGANT POLYGONS (For Tianguis Engine)
// ═══════════════════════════════════════════════════════════════════
export function AbstractRaysBack({ theme, opacity = 1 }: { theme: 'blue' | 'purple' | 'green' | 'orange' | 'pink', opacity?: any }) {
  const colors = {
    blue: ['#EFF6FF', '#DBEAFE', '#BFDBFE', '#93C5FD'],
    green: ['#F0FDF4', '#DCFCE7', '#BBF7D0', '#86EFAC'],
    orange: ['#FFF7ED', '#FFEDD5', '#FED7AA', '#FDBA74'],
    purple: ['#FAF5FF', '#F3E8FF', '#E9D5FF', '#D8B4FE'],
    pink: ['#FDF2F8', '#FCE7F3', '#FBCFE8', '#F9A8D4']
  };

  return (
    <motion.div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-40 dark:opacity-5">
      <div className="w-full h-full transition-opacity duration-700" style={{ opacity: opacity }}>
        
        {/* Soft Ambient Glow */}
        <motion.div 
          className="absolute w-[100vw] h-[100vw] top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px]"
          style={{ background: `radial-gradient(circle at center, ${colors[theme][1]}40 0%, transparent 60%)` }}
        />

        {/* Elegant Abstract Hexagon 1 */}
        <motion.div 
          className="absolute w-[40vw] h-[45vw] top-[10%] right-[10%] backdrop-blur-3xl drop-shadow-xl"
          style={{ 
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            background: `linear-gradient(145deg, ${colors[theme][2]}60, ${colors[theme][3]}40)`,
          }}
          animate={{ rotate: 360, scale: [1, 1.05, 1], y: [0, -30, 0] }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear', scale: { duration: 15, repeat: Infinity, ease: 'easeInOut' }, y: { duration: 10, repeat: Infinity, ease: 'easeInOut' } }}
        />

        {/* Elegant Abstract Hexagon 2 */}
        <motion.div 
          className="absolute w-[30vw] h-[35vw] bottom-[-5%] left-[5%] backdrop-blur-2xl drop-shadow-lg"
          style={{ 
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            background: `linear-gradient(145deg, ${colors[theme][3]}50, ${colors[theme][1]}30)`,
          }}
          animate={{ rotate: -360, x: [0, 40, 0] }}
          transition={{ duration: 45, repeat: Infinity, ease: 'linear', x: { duration: 20, repeat: Infinity, ease: 'easeInOut' } }}
        />

        {/* Elegant Diagonal Soft Lines */}
        {[...Array(3)].map((_, i) => (
          <motion.div 
            key={i}
            className="absolute h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-60 dark:opacity-40"
            style={{ width: '200%', top: `${30 + i * 20}%`, left: '-50%', transform: `rotate(${-20 + i * 5}deg)` }}
            animate={{ x: ['10%', '-10%', '10%'] }}
            transition={{ duration: 15 + i * 5, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}

      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ABSTRACT CIRCLES BACKGROUND (Soundwaves / Bubbles)
// ═══════════════════════════════════════════════════════════════════
export function AbstractCirclesBack({ theme, opacity = 1 }: { theme: 'blue' | 'purple' | 'green' | 'orange' | 'pink', opacity?: any }) {
  const colors = {
    blue: ['#EFF6FF', '#DBEAFE', '#BFDBFE', '#93C5FD'],
    green: ['#F0FDF4', '#DCFCE7', '#BBF7D0', '#86EFAC'],
    orange: ['#FFF7ED', '#FFEDD5', '#FED7AA', '#FDBA74'],
    purple: ['#FAF5FF', '#F3E8FF', '#E9D5FF', '#D8B4FE'],
    pink: ['#FDF2F8', '#FCE7F3', '#FBCFE8', '#F9A8D4']
  };

  return (
    <motion.div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-40 dark:opacity-15">
      <div className="w-full h-full transition-opacity duration-700">

        {/* Massive Background Circle */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1.5, scale: { duration: 12, repeat: Infinity, ease: 'easeInOut' } }}
          className="absolute w-[70vw] h-[70vw] bottom-[-20%] right-[-10%] rounded-full"
          style={{ background: `radial-gradient(circle at center, ${colors[theme][1]} 0%, transparent 60%)` }}
        />

        {/* Orbiting Ring 1 */}
        <motion.div 
          className="absolute w-[50vh] h-[50vh] rounded-full border-[20px] top-[-10%] left-[10%] drop-shadow-2xl"
          style={{ borderColor: `${colors[theme][3]}40` }}
          animate={{ y: [0, -30, 0], rotate: [0, 180, 360] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        />

        {/* Orbiting Ring 2 */}
        <motion.div 
          className="absolute w-[30vh] h-[30vh] rounded-full border-4 bottom-[20%] left-[30%] backdrop-blur-sm"
          style={{ borderColor: `${colors[theme][2]}60`, background: `${colors[theme][1]}30` }}
          animate={{ scale: [1, 1.2, 1], rotate: [360, 180, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Little Floating Bubbles */}
        {[1, 2, 3, 4, 5].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{ 
              background: colors[theme][Math.min(i, 3)],
              left: `${15 * i}%`,
              width: `${15 + i * 10}px`,
              height: `${15 + i * 10}px`,
            }}
            animate={{ 
              y: ['120vh', '-20vh'],
              opacity: [0, 0.8, 0]
            }}
            transition={{
              duration: 10 + i * 3,
              repeat: Infinity,
              ease: "linear",
              delay: i * 2
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// NEW: ABSTRACT FLUID ORBS (For App Showcase)
// ═══════════════════════════════════════════════════════════════════
export function AbstractTrianglesBack({ theme, opacity = 1 }: { theme: 'blue' | 'purple' | 'green' | 'orange' | 'pink', opacity?: any }) {
  const colors = {
    blue: ['#EFF6FF', '#DBEAFE', '#BFDBFE', '#93C5FD'],
    green: ['#F0FDF4', '#DCFCE7', '#BBF7D0', '#86EFAC'],
    orange: ['#FFF7ED', '#FFEDD5', '#FED7AA', '#FDBA74'],
    purple: ['#FAF5FF', '#F3E8FF', '#E9D5FF', '#D8B4FE'],
    pink: ['#FDF2F8', '#FCE7F3', '#FBCFE8', '#F9A8D4']
  };

  const [montado, setMontado] = useState(false);
  useEffect(() => { setMontado(true); }, []);
  // Posiciones aleatorias calculadas una sola vez para las estrellas flotantes.
  const estrellas = useMemo(() => Array.from({ length: 8 }, () => ({
    width: Math.random() * 4 + 2,
    height: Math.random() * 4 + 2,
    top: Math.random() * 100,
    left: Math.random() * 100,
    duration: Math.random() * 3 + 2,
  })), []);

  return (
    <motion.div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-50 dark:opacity-20">
      <div className="w-full h-full transition-opacity duration-700">

        {/* Ambient Glow */}
        <motion.div 
          className="absolute w-[80vw] h-[50vw] top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
          style={{ background: `linear-gradient(to right, ${colors[theme][1]}, transparent)` }}
        />

        {/* Fluid Orb 1 */}
        <motion.div 
          className="absolute w-[40vw] h-[40vw] top-[-10%] right-[-10%] rounded-[40%_60%_70%_30%/_40%_50%_60%_50%] backdrop-blur-3xl drop-shadow-2xl mix-blend-multiply dark:mix-blend-screen"
          style={{ 
            background: `linear-gradient(135deg, ${colors[theme][3]}80, ${colors[theme][2]}40)`,
          }}
          animate={{ 
            rotate: [0, 90, 0], 
            borderRadius: ['40% 60% 70% 30% / 40% 50% 60% 50%', '60% 40% 30% 70% / 50% 60% 40% 60%', '40% 60% 70% 30% / 40% 50% 60% 50%'],
            y: [0, 30, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Fluid Orb 2 */}
        <motion.div 
          className="absolute w-[50vw] h-[50vw] bottom-[-20%] left-[-10%] rounded-[60%_40%_30%_70%/_50%_60%_40%_60%] backdrop-blur-2xl drop-shadow-xl mix-blend-multiply dark:mix-blend-screen opacity-60"
          style={{ 
            background: `linear-gradient(135deg, ${colors[theme][2]}80, ${colors[theme][4]}40)`,
          }}
          animate={{ 
            rotate: [360, 270, 360], 
            borderRadius: ['60% 40% 30% 70% / 50% 60% 40% 60%', '40% 60% 70% 30% / 40% 50% 60% 50%', '60% 40% 30% 70% / 50% 60% 40% 60%'],
            x: [0, 40, 0]
          }}
          transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        {/* Estrellas flotantes — solo en cliente (sus posiciones aleatorias
            causaban mismatch de hidratación si se renderizaban en el servidor). */}
        {montado && estrellas.map((e, i) => (
           <motion.div
             key={`star-${i}`}
             className="absolute rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"
             style={{
               width: `${e.width}px`,
               height: `${e.height}px`,
               top: `${e.top}%`,
               left: `${e.left}%`
             }}
             animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
             transition={{ duration: e.duration, repeat: Infinity, ease: 'easeInOut' }}
           />
        ))}

      </div>
    </motion.div>
  );
}
// ═══════════════════════════════════════════════════════════════════
// SONIC WAVE BACKGROUND - Circular ripples and speaker vibes
// ═══════════════════════════════════════════════════════════════════

export function SonicWaveBack({ theme = 'blue', opacity = 1 }: { theme?: 'blue' | 'purple' | 'green' | 'orange' | 'pink', opacity?: number }) {
  const colors = {
    blue: ['#EFF6FF', '#DBEAFE', '#BFDBFE', '#3b82f6'],
    green: ['#F0FDF4', '#DCFCE7', '#BBF7D0', '#22c55e'],
    orange: ['#FFF7ED', '#FFEDD5', '#FED7AA', '#f97316'],
    purple: ['#FAF5FF', '#F3E8FF', '#E9D5FF', '#a855f7'],
    pink: ['#FDF2F8', '#FCE7F3', '#FBCFE8', '#ec4899']
  };

  const activeColor = colors[theme][3];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" style={{ opacity }}>
      {/* Background soft glow */}
      <div 
        className="absolute top-1/2 left-[30%] -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] rounded-full blur-[140px] opacity-20 dark:opacity-10"
        style={{ background: `radial-gradient(circle, ${activeColor}50 0%, transparent 70%)` }}
      />

      <div className="absolute top-1/2 left-[20%] -translate-y-1/2 flex items-center justify-center">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-current"
            style={{ color: `${activeColor}${Math.max(10, 40 - i * 8)}` }}
            initial={{ width: '20vh', height: '20vh', opacity: 0 }}
            animate={{ 
              width: ['20vh', '140vh'], 
              height: ['20vh', '140vh'], 
              opacity: [0, 0.4, 0],
              borderWidth: ['1px', '4px', '1px']
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              delay: i * 1.5,
              ease: [0.19, 1, 0.22, 1],
            }}
          />
        ))}

        {/* Small floating triangles for extra texture but NOT as main design */}
        <motion.div 
          animate={{ x: [-20, 20, -20], y: [-30, 30, -30], rotate: 360 }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute w-24 h-24 border border-current opacity-10 dark:opacity-20"
          style={{ 
            color: activeColor,
            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
            left: '40vw',
            top: '-20vh'
          }}
        />
        
        <motion.div 
          animate={{ x: [30, -30, 30], y: [20, -20, 20], rotate: -360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          className="absolute w-32 h-32 border border-current opacity-5 dark:opacity-15"
          style={{ 
            color: activeColor,
            left: '60vw',
            bottom: '-10vh',
            borderRadius: '20%'
          }}
        />
      </div>

      {/* Far right accent */}
      <div 
        className="absolute top-[20%] right-[-10%] w-[50vw] h-[50vw] rounded-full blur-[120px] opacity-10"
        style={{ background: `radial-gradient(circle, ${activeColor}30 0%, transparent 70%)` }}
      />
    </div>
  );
}

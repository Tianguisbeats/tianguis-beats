"use client";

import React from 'react';

interface SwitchProps {
    active: boolean;
    onChange: (active: boolean) => void;
    disabled?: boolean;
    activeColor?: string;
    size?: 'sm' | 'md' | 'lg';
}

/**
 * Reusable Switch component with premium aesthetics and smooth transitions.
 */
const Switch: React.FC<SwitchProps> = ({
    active,
    onChange,
    disabled = false,
    activeColor = 'bg-accent',
    size = 'md'
}) => {


    // Adjusted size classes with exact Tailwind utility combinations for perfect roundness and spacing
    const exactSizes = {
        sm: { track: 'w-9 h-5', thumb: 'w-[14px] h-[14px]', activeTranslate: 'translate-x-4' },
        md: { track: 'w-11 h-6', thumb: 'w-[18px] h-[18px]', activeTranslate: 'translate-x-5' },
        lg: { track: 'w-14 h-7', thumb: 'w-[22px] h-[22px]', activeTranslate: 'translate-x-7' }
    };

    const currentSize = exactSizes[size];

    return (
        <button
            type="button"
            onClick={() => !disabled && onChange(!active)}
            disabled={disabled}
            className={`
                relative ${currentSize.track} rounded-full transition-colors duration-300 ease-in-out
                ${disabled ? 'opacity-40 cursor-not-allowed grayscale' : 'cursor-pointer'}
                ${active ? activeColor : 'bg-slate-200 dark:bg-white/10'}
                border-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent
            `}
        >
            <div
                className={`
                    absolute top-1/2 left-[3px] -translate-y-1/2
                    ${currentSize.thumb} bg-white rounded-full
                    shadow-[0_2px_4px_rgba(0,0,0,0.2)]
                    transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                    ${active ? currentSize.activeTranslate : 'translate-x-0'}
                    group-hover:scale-110
                `}
            />
        </button>
    );
};

export default Switch;

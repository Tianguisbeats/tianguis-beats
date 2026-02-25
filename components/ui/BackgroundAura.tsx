"use client";

import React from 'react';

export default function BackgroundAura() {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
            {/* Upper Right Blob */}
            <div
                className="absolute top-[-10%] right-[-5%] w-[50vw] h-[50vw] rounded-full opacity-20 dark:opacity-30 mix-blend-multiply dark:mix-blend-screen animate-pulse"
                style={{
                    background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)',
                    filter: 'blur(120px)',
                    animationDuration: '8s'
                }}
            />

            {/* Lower Left Blob */}
            <div
                className="absolute bottom-[-10%] left-[-5%] w-[45vw] h-[45vw] rounded-full opacity-10 dark:opacity-20 mix-blend-multiply dark:mix-blend-screen animate-pulse"
                style={{
                    background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)',
                    filter: 'blur(100px)',
                    animationDuration: '10s',
                    animationDelay: '2s'
                }}
            />
        </div>
    );
}

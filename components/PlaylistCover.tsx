"use client";

import React from 'react';
import Image from 'next/image';
import { ListMusic } from 'lucide-react';

interface PlaylistCoverProps {
    beats: any[];
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export default function PlaylistCover({ beats = [], size = 'md', className = '' }: PlaylistCoverProps) {
    const covers = beats?.map(b => b.portada_url || b.beat?.portada_url).filter(Boolean) || [];

    const sizeClasses = {
        sm: 'w-10 h-10 rounded-lg',
        md: 'w-24 h-24 rounded-2xl',
        lg: 'w-full h-full',
    };

    const emptyIconSize = size === 'lg' ? 48 : size === 'md' ? 24 : 16;
    const containerBase = `${sizeClasses[size]} overflow-hidden bg-foreground/5 relative flex-shrink-0 ${className}`;

    if (covers.length === 0) {
        return (
            <div className={`${containerBase} flex items-center justify-center border border-dashed border-foreground/10`}>
                <ListMusic size={emptyIconSize} className="text-foreground/10" strokeWidth={1} />
            </div>
        );
    }

    if (covers.length === 1) {
        return (
            <div className={containerBase}>
                <Image src={covers[0]} alt="Playlist" fill className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" />
            </div>
        );
    }

    if (covers.length === 2) {
        return (
            <div className={`${containerBase} grid grid-cols-2 gap-[1px]`}>
                {covers.slice(0, 2).map((url, i) => (
                    <div key={i} className="relative w-full h-full">
                        <Image src={url} alt="" fill className="object-cover" sizes="(max-width: 640px) 50vw, 16vw" />
                    </div>
                ))}
            </div>
        );
    }

    if (covers.length === 3) {
        return (
            <div className={`${containerBase} grid grid-cols-2 grid-rows-2 gap-[1px]`}>
                <div className="relative row-span-2">
                    <Image src={covers[0]} alt="" fill className="object-cover" sizes="(max-width: 640px) 50vw, 16vw" />
                </div>
                <div className="relative">
                    <Image src={covers[1]} alt="" fill className="object-cover" sizes="(max-width: 640px) 50vw, 16vw" />
                </div>
                <div className="relative">
                    <Image src={covers[2]} alt="" fill className="object-cover" sizes="(max-width: 640px) 50vw, 16vw" />
                </div>
            </div>
        );
    }

    // 4 or more
    return (
        <div className={`${containerBase} grid grid-cols-2 grid-rows-2 gap-[1px]`}>
            {covers.slice(0, 4).map((url, i) => (
                <div key={i} className="relative">
                    <Image src={url} alt="" fill className="object-cover" sizes="(max-width: 640px) 50vw, 16vw" />
                </div>
            ))}
        </div>
    );
}

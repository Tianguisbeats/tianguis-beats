"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Package, Play, Pause, ShoppingBag, Heart } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import LikeSoundKitButton from '@/components/LikeSoundKitButton';

interface SoundKitHorizontalCardProps {
    kit: any;
    producerName: string;
}

export default function SoundKitHorizontalCard({ kit, producerName }: SoundKitHorizontalCardProps) {
    const { playBeat, currentBeat, isPlaying } = usePlayer();
    const { addItem, setIsCartOpen } = useCart();
    const { formatPrice } = useCurrency();

    const isCurrentKit = currentBeat?.id === kit.id && (currentBeat as any)?.product_type === 'sound_kit';

    const handlePlay = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const url = kit.archivo_muestra_url || '';
        if (!url) return;

        playBeat({
            id: kit.id,
            titulo: kit.titulo,
            product_type: 'sound_kit',
            tipo: 'kit',
            archivo_muestra_url: url,
            archivo_mp3_url: url,
            portada_url: kit.url_portada || kit.portada_url,
            productor_id: kit.productor_id,
            productor_nombre_artistico: producerName,
            precio_base: kit.precio,
        } as any);
    };

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        addItem({
            id: kit.id,
            type: 'sound_kit',
            name: kit.titulo,
            price: kit.precio,
            image: kit.url_portada,
            subtitle: `Prod. by ${producerName}`,
            metadata: { kitId: kit.id, productor_id: kit.productor_id }
        });
        setIsCartOpen(true);
    };

    return (
        <div className="group relative flex items-center gap-4 p-4 rounded-[2rem] border border-orange-500/10 bg-orange-500/[0.02] hover:bg-orange-500/[0.05] hover:border-orange-500/30 transition-all">
            {/* Thumbnail with centered play button */}
            <div className="relative w-24 h-24 md:w-28 md:h-28 shrink-0 rounded-[1.8rem] overflow-hidden shadow-lg shadow-orange-500/10 border border-orange-500/20">
                {kit.url_portada ? (
                    <Image
                        src={kit.url_portada}
                        alt={kit.titulo}
                        fill
                        sizes="(max-width: 768px) 96px, 112px"
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-orange-500/10">
                        <Package size={32} className="text-orange-500/40" />
                    </div>
                )}

                <div onClick={handlePlay} className={`absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px] cursor-pointer transition-opacity duration-300 ${isCurrentKit ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <div className="w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-glow shadow-orange-500/40 scale-90 group-hover:scale-100 transition-transform">
                        {isCurrentKit && isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-w-0 py-1">
                <Link href={`/sound-kits/${kit.id}`} className="block">
                    <h4 className="font-black text-sm md:text-base uppercase tracking-tight truncate group-hover:text-orange-500 transition-colors leading-tight">
                        {kit.titulo}
                    </h4>
                    <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-[0.2em] mt-1">Sound Kit Profesional</p>
                </Link>

                <div className="flex items-center justify-between gap-4 mt-4">
                    <div className="flex items-center gap-3">
                        <span className="font-black text-xl text-orange-500 tracking-tighter">
                            {formatPrice(kit.precio)}
                        </span>
                        <div className="w-px h-3 bg-foreground/10" />
                        <button
                            onClick={handleAddToCart}
                            className="bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white border border-orange-500/20 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2"
                        >
                            <ShoppingBag size={12} /> Añadir
                        </button>
                    </div>

                    <div className="scale-90">
                        <LikeSoundKitButton kitId={kit.id} />
                    </div>
                </div>
            </div>

            {/* Status indicators */}
            <div className="absolute top-4 right-4 flex gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            </div>
        </div>
    );
}

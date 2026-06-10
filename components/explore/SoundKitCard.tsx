/* eslint-disable @next/next/no-img-element */
"use client";

import { memo } from 'react';
import { Package, Music, ShoppingCart, Heart, Crown, Star, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePlayer } from '@/context/PlayerContext';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import Link from 'next/link';
import LikeSoundKitButton from '@/components/LikeSoundKitButton';

interface SoundKitCardProps {
    kit: any;
    featured?: boolean;
}

function SoundKitCard({ kit, featured = false }: SoundKitCardProps) {
    const { playBeat, currentBeat, isPlaying, togglePlay } = usePlayer();
    const { addItem, setIsCartOpen } = useCart();
    const { formatPrice } = useCurrency();

    const isCurrentPlaying = currentBeat?.id === kit.id && isPlaying;
    const isPremium = kit.producer?.nivel_suscripcion?.toLowerCase() === 'premium';
    const isPro = kit.producer?.nivel_suscripcion?.toLowerCase() === 'pro';

    const handlePlayPreview = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!kit.archivo_muestra_url) return;
        if (currentBeat?.id === kit.id) {
            togglePlay();
        } else {
            playBeat({
                id: kit.id,
                titulo: kit.titulo,
                product_type: 'sound_kit',
                archivo_muestra_url: kit.archivo_muestra_url,
                portada_url: kit.url_portada,
                productor_id: kit.producer?.id || kit.productor_id || '',
                productor_nombre_artistico: kit.producer?.nombre_artistico || 'Productor',
                productor_esta_verificado: kit.producer?.esta_verificado,
                productor_es_fundador: kit.producer?.es_fundador,
                precio_base: kit.precio,
                tipo: 'kit',
                user: kit.producer
            } as any);
        }
    };

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const success = addItem({
            id: kit.id,
            type: 'sound_kit',
            name: kit.titulo,
            price: kit.precio,
            image: kit.url_portada,
            subtitle: kit.producer?.nombre_artistico || 'Productor',
            metadata: {
                productor_id: kit.productor_id,
                producer_name: kit.producer?.nombre_artistico,
                kitId: kit.id
            }
        });
        if (success) setIsCartOpen(true);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -8 }}
            className={`group relative flex flex-col h-full bg-white dark:bg-white/5 backdrop-blur-xl rounded-[2.5rem] border overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-orange-500/10 ${
                featured
                    ? 'border-orange-500/30 shadow-2xl shadow-orange-500/10'
                    : 'border-slate-200 dark:border-white/10'
            }`}
        >
            <div className="md:hidden absolute inset-0 pointer-events-none opacity-80">
                <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />
                <div className="absolute -right-10 top-10 w-24 h-24 rounded-full bg-orange-500/10 blur-2xl" />
            </div>

            {/* Image Section */}
            <div className="relative aspect-[4/5] overflow-hidden m-2 rounded-[2rem]">
                <img
                    src={kit.url_portada || "https://images.unsplash.com/photo-1516062423079-7c157a58ff62?q=80&w=600&auto=format&fit=crop"}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    alt={kit.titulo}
                />
                
                {/* Play Overlay */}
                <div className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-all duration-500 backdrop-blur-[2px] ${isCurrentPlaying ? 'opacity-100' : 'sm:opacity-0 sm:group-hover:opacity-100'}`}>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handlePlayPreview}
                        className={`w-14 h-14 rounded-full ${isCurrentPlaying ? 'bg-white text-orange-600' : 'bg-orange-600 text-white'} flex items-center justify-center shadow-2xl border border-white/20`}
                    >
                        {isCurrentPlaying ? (
                             <div className="flex gap-1 items-end h-4">
                                <div className="w-1 bg-orange-600 h-2 animate-pulse" />
                                <div className="w-1 bg-orange-600 h-4 animate-pulse delay-75" />
                                <div className="w-1 bg-orange-600 h-3 animate-pulse delay-150" />
                            </div>
                        ) : <Music size={20} fill="currentColor" />}
                    </motion.button>
                </div>

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {featured && (
                        <div className="px-3 py-1.5 rounded-full bg-orange-500/25 backdrop-blur-xl border border-orange-500/30 flex items-center gap-1.5">
                            <Star size={10} className="text-orange-300 fill-orange-300" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-orange-100">Destacado</span>
                        </div>
                    )}
                    {isPremium && (
                        <div className="px-3 py-1.5 rounded-full bg-blue-500/20 backdrop-blur-xl border border-blue-500/30 flex items-center gap-1.5">
                            <Crown size={10} className="text-blue-500" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-blue-400">Premium</span>
                        </div>
                    )}
                </div>

                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                    <span className="px-3 py-1.5 bg-black/40 backdrop-blur-md border border-white/10 text-white rounded-full text-[8px] font-black uppercase tracking-widest">
                        {kit.productor_id ? 'Original Kit' : 'Sound Kit'}
                    </span>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-5 flex flex-col flex-1 gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[8px] font-black uppercase tracking-widest text-orange-500/80 dark:text-orange-400/60">Professional Audio</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-white/10" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-muted/40">24-bit WAV</span>
                    </div>
                    
                    <Link href={`/sound-kits/${kit.id}`}>
                        <h4 className="text-base font-black uppercase tracking-tighter text-black dark:text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-orange-500 group-hover:to-amber-500 transition-all truncate leading-tight">
                            {kit.titulo}
                        </h4>
                    </Link>

                    <Link href={`/${kit.producer?.nombre_usuario || '#'}`} className="flex items-center gap-1.5 group/prod">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-muted uppercase tracking-widest opacity-60">
                            Por <span className="text-black dark:text-white group-hover:text-orange-500 transition-colors">{kit.producer?.nombre_artistico || 'Productor'}</span>
                        </span>
                        {kit.producer?.esta_verificado && <Zap size={10} className="text-orange-500" />}
                    </Link>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-200 dark:border-white/5 flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted/30 mb-0.5">Precio</span>
                        <span className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">
                            {formatPrice(kit.precio)}
                        </span>
                    </div>
                    
                    <div className="flex gap-2">
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <LikeSoundKitButton kitId={kit.id} showCount={false} />
                        </motion.div>
                        <motion.button 
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleAddToCart}
                            className="px-5 h-10 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-500/20"
                        >
                            <ShoppingCart size={16} />
                            <span>Obtener</span>
                        </motion.button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// Memoizado: en listados grandes evita re-renders cuando el padre se actualiza
// por motivos ajenos a esta tarjeta (p.ej. cambios del reproductor global).
export default memo(SoundKitCard);

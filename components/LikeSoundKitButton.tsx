"use client";

import React, { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { usePlayer } from "@/context/PlayerContext";
import { useToast } from "@/context/ToastContext";

interface LikeSoundKitButtonProps {
    kitId: string;
    showCount?: boolean;
}

export default function LikeSoundKitButton({ kitId, showCount = false }: LikeSoundKitButtonProps) {
    const { showToast } = useToast();
    const { likedKitIds, toggleLike, likesCounts } = usePlayer();
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || null));
    }, []);

    const isLiked = likedKitIds.has(kitId);
    const displayCount = likesCounts[kitId] ?? 0;

    const handleLike = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!userId) {
            showToast("Inicia sesión para guardar sound kits", "error");
            return;
        }

        await toggleLike(kitId, 'sound_kit');
        if (!isLiked) {
            showToast("Sound Kit guardado", "success");
        } else {
            showToast("Sound Kit removido", "success");
        }
    };

    return (
        <div className="flex items-center gap-2">
            {showCount && (
                <span className="text-[10px] font-black text-muted uppercase tracking-widest">
                    {displayCount}
                </span>
            )}
            <button
                onClick={handleLike}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all border shadow-sm active:scale-90 shrink-0 group/heart touch-manipulation ${isLiked
                    ? 'text-red-500 border-red-500/50 bg-red-50 dark:bg-red-500/10'
                    : 'text-red-400 border-border hover:border-red-500/50 hover:bg-red-500/5'
                    }`}
                title={isLiked ? "Quitar de favoritos" : "Añadir a favoritos"}>
                <Heart size={14} className={`transition-all duration-300 ${isLiked ? 'fill-red-500 scale-110' : 'group-hover/heart:scale-110'}`} />
            </button>
        </div>
    );
}

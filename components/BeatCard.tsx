/**
 * Componente BeatCard: Tarjeta para mostrar información individual de un beat.
 * @param beat Datos del beat provenientes de la base de datos o dummy data.
 */
import { Music, Play, Pause, ShoppingCart } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';
import Link from 'next/link';

export interface Beat {
    id: string | number;
    title: string | null;
    producer: string | null;
    price_mxn: number | null;
    bpm: number | null;
    genre: string | null;
    mp3_url?: string | null;
    tag?: string | null;
    tagEmoji?: string | null;
    tagColor?: string;
    coverColor?: string;
    musical_key?: string | null;
    mood?: string | null;
    reference_artist?: string | null;
    play_count?: number;
    sale_count?: number;
    is_exclusive?: boolean;
    tier_visibility?: number;
    mp3_tag_url?: string | null;
}

interface BeatCardProps {
    beat: Beat;
}

function formatPriceMXN(value?: number | null) {
    if (value === null || value === undefined) return "$—";
    return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
        maximumFractionDigits: 0,
    }).format(value);
}

export default function BeatCard({ beat }: BeatCardProps) {
    const { currentBeat, isPlaying, playBeat } = usePlayer();
    const isThisPlaying = currentBeat?.id === beat.id && isPlaying;

    const coverColor = beat.coverColor || "bg-slate-50";
    const tagColor = beat.tagColor || "bg-blue-600";

    const handlePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        // Use tagged URL for public listening if available
        const playbackUrl = beat.mp3_tag_url || beat.mp3_url;
        playBeat({ ...beat, mp3_url: playbackUrl });
    };

    return (
        <div className="group bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-blue-900/10 transition-all transform hover:-translate-y-2">
            <div className={`aspect-square ${coverColor} relative flex items-center justify-center overflow-hidden`}>
                {beat.tag && (
                    <div className={`absolute top-4 left-4 ${tagColor} text-white text-[9px] font-black px-3 py-1.5 rounded-full shadow-lg z-10 flex items-center gap-1.5 uppercase tracking-tighter`}>
                        <span>{beat.tagEmoji || "🔥"}</span>
                        {beat.tag}
                    </div>
                )}

                <Music className="text-slate-200 w-20 h-20 group-hover:scale-110 group-hover:text-blue-500/20 transition-all duration-700 ease-out" />

                <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 backdrop-blur-[2px]">
                    <button
                        onClick={handlePlay}
                        className="bg-white text-blue-600 p-5 rounded-full shadow-2xl transform hover:scale-110 transition-transform active:scale-90"
                    >
                        {isThisPlaying ? (
                            <Pause fill="currentColor" size={28} />
                        ) : (
                            <Play fill="currentColor" size={28} className="ml-1" />
                        )}
                    </button>
                </div>
            </div>

            <div className="p-6">
                <Link href={`/beats/${beat.id}`} className="block">
                    <h3 className="font-black text-slate-900 text-sm truncate mb-1 group-hover:text-blue-600 transition-colors leading-tight uppercase tracking-tight">
                        {beat.title || "Sin título"}
                    </h3>
                </Link>
                <div className="flex items-center justify-between mb-5">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest truncate max-w-[100px]">prod. {beat.producer || "—"}</p>
                    <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">{beat.bpm || "—"} BPM</span>
                </div>

                <div className="flex items-center justify-between pt-5 border-t border-slate-50">
                    <div className="flex flex-col">
                        <span className="text-blue-600 font-black text-xl leading-none">{formatPriceMXN(beat.price_mxn)}</span>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1.5 italic">
                            {beat.musical_key ? `Key: ${beat.musical_key}` : "Licencia Digital"}
                        </span>
                    </div>
                    <button className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95">
                        <ShoppingCart size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}

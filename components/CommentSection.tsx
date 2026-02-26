import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Send, User, Trash2, Crown, MessageCircle } from 'lucide-react';

interface Comment {
    id: string;
    contenido: string;
    fecha_creacion: string;
    usuario_id: string;
    user: {
        nombre_usuario: string;
        nombre_artistico: string;
        foto_perfil: string | null;
        esta_verificado?: boolean;
        es_fundador?: boolean;
        nivel_suscripcion?: string;
    }
}

export default function CommentSection({ beatId }: { beatId: string }) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentText, setCommentText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState<string | null>(null);

    useEffect(() => {
        const fetchComments = async () => {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user ? user.id : null);

            // Fetch comments with user profile (username, artistic_name, avatar, badges, tier)
            const { data, error } = await supabase
                .from('comentarios')
                .select(`
                    id,
                    contenido,
                    fecha_creacion,
                    usuario_id,
                    user:usuario_id (
                        nombre_usuario,
                        nombre_artistico,
                        foto_perfil,
                        esta_verificado,
                        es_fundador,
                        nivel_suscripcion
                    )
                `)
                .eq('beat_id', beatId)
                .order('fecha_creacion', { ascending: false });

            if (data) {
                const formatted = await Promise.all(data.map(async (c: any) => {
                    let finalFoto = c.user?.foto_perfil;
                    if (finalFoto && !finalFoto.startsWith('http')) {
                        const { data: { publicUrl } } = supabase.storage.from('fotos_perfil').getPublicUrl(finalFoto);
                        finalFoto = publicUrl;
                    }
                    return {
                        ...c,
                        user: {
                            ...(c.user || { nombre_usuario: 'Usuario', nombre_artistico: 'Usuario' }),
                            foto_perfil: finalFoto
                        }
                    };
                }));
                setComments(formatted);
            }
        };

        fetchComments();

        // Subscribe to real-time changes
        const channel = supabase
            .channel('public:comentarios')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comentarios', filter: `beat_id=eq.${beatId}` }, (payload) => {
                const fetchNewComment = async () => {
                    const { data } = await supabase
                        .from('comentarios')
                        .select(`id, contenido, fecha_creacion, usuario_id, user:usuario_id (nombre_usuario, nombre_artistico, foto_perfil, esta_verificado, es_fundador, nivel_suscripcion)`)
                        .eq('id', (payload.new as any).id)
                        .single();
                    if (data) {
                        setComments(prev => {
                            if (prev.some(c => c.id === data.id)) return prev;
                            return [{ ...data, user: (data as any).user || { nombre_usuario: 'Usuario', nombre_artistico: 'Usuario', foto_perfil: null } } as Comment, ...prev];
                        });
                    }
                };
                fetchNewComment();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [beatId]);

    const handlePostComment = async () => {
        if (!commentText.trim()) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert('Inicia sesión para comentar');
            return;
        }

        setIsLoading(true);
        const { data, error } = await supabase.from('comentarios').insert({
            contenido: commentText.trim(),
            beat_id: beatId,
            usuario_id: user.id
        }).select(`id, contenido, fecha_creacion, usuario_id, user:usuario_id (nombre_usuario, nombre_artistico, foto_perfil, esta_verificado, es_fundador, nivel_suscripcion)`).single();

        if (error) {
            console.error('Error posting comment:', error);
        } else if (data) {
            setCommentText('');
            // Optimistic update
            setComments(prev => {
                if (prev.some(c => c.id === data.id)) return prev;
                return [{ ...data, user: (data as any).user || { nombre_usuario: 'Usuario', nombre_artistico: 'Usuario', foto_perfil: null } } as Comment, ...prev];
            });
        }
        setIsLoading(false);
    };

    const handleDelete = async (commentId: string) => {
        const { error } = await supabase.from('comentarios').delete().eq('id', commentId);
        if (!error) {
            setComments(prev => prev.filter(c => c.id !== commentId));
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Input area rendered within the parent's container */}
            {/* Input area */}
            <div className="flex gap-4 mb-10">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center shrink-0">
                    <User size={24} className="text-muted" />
                </div>
                <div className="flex-1 relative group">
                    {!currentUser ? (
                        <div className="w-full bg-slate-50 dark:bg-white/5 rounded-[1.5rem] p-5 h-28 flex flex-col items-center justify-center border border-dashed border-border group-hover:border-accent transition-all">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-3">Inicia sesión para comentar</p>
                            <div className="flex gap-3">
                                <a href="/login" className="text-[9px] font-black uppercase px-4 py-2 bg-accent text-white rounded-lg hover:scale-105 transition-all">Login</a>
                                <a href="/signup" className="text-[9px] font-black uppercase px-4 py-2 border border-border text-foreground rounded-lg hover:scale-105 transition-all">Crear Cuenta</a>
                            </div>
                        </div>
                    ) : (
                        <>
                            <textarea
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="Deja un comentario..."
                                className="w-full bg-slate-50 dark:bg-white/5 rounded-[1.5rem] p-5 pr-14 text-sm font-medium border border-transparent focus:border-accent outline-none transition-all resize-none h-28"
                            />
                            <button
                                onClick={handlePostComment}
                                disabled={isLoading || !commentText.trim()}
                                className="absolute bottom-4 right-4 w-10 h-10 bg-accent text-white rounded-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent/20"
                            >
                                <Send size={16} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* List */}
            <div className="space-y-8 flex-1">
                {comments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <MessageCircle size={40} className="text-muted/20 mb-4" />
                        <p className="text-muted text-[10px] font-black uppercase tracking-[0.2em]">Sé el primero en comentar</p>
                    </div>
                ) : (
                    comments.map(comment => (
                        <div key={comment.id} className="flex gap-4 group">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden border-2 transition-all ${comment.user.nivel_suscripcion === 'premium' ? 'border-blue-600 shadow-sm' :
                                comment.user.nivel_suscripcion === 'pro' ? 'border-amber-500' :
                                    'border-border'
                                }`}>
                                {comment.user.foto_perfil ? (
                                    <img src={comment.user.foto_perfil} alt={comment.user.nombre_usuario} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-slate-50 dark:bg-white/10 flex items-center justify-center text-muted italic font-black text-xs">
                                        {(comment.user.nombre_artistico || comment.user.nombre_usuario || 'U').charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <a href={`/${comment.user.nombre_usuario}`} className="text-xs font-black text-foreground uppercase tracking-tight hover:text-accent transition-colors truncate max-w-[150px]">
                                            {comment.user.nombre_artistico || comment.user.nombre_usuario}
                                        </a>
                                        {comment.user.esta_verificado && (
                                            <img src="/verified-badge.png" className="w-4 h-4 object-contain" alt="Verificado" />
                                        )}
                                        {comment.user.es_fundador && (
                                            <Crown size={14} className="text-amber-500" fill="currentColor" />
                                        )}
                                    </div>
                                    <span className="text-[9px] font-black text-muted uppercase tracking-widest shrink-0">
                                        {new Date(comment.fecha_creacion).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-muted text-sm leading-relaxed break-words font-medium">{comment.contenido}</p>
                            </div>
                            {currentUser === comment.usuario_id && (
                                <button
                                    onClick={() => {
                                        if (confirm('¿Eliminar comentario?')) {
                                            handleDelete(comment.id);
                                        }
                                    }}
                                    className="opacity-0 group-hover:opacity-100 text-muted hover:text-red-500 transition-all p-1"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

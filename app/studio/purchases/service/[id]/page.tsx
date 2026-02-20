"use client";

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import {
    CheckCircle2,
    Clock,
    Send,
    Upload,
    FileText,
    ChevronLeft,
    MessageSquare,
    FileArchive,
    AlertCircle,
    User,
    Check,
    X,
    Shield,
    Download,
    Paperclip,
    Zap,
    DollarSign,
    Cpu,
    ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';
import { useParams, useRouter } from 'next/navigation';

type Status = 'paid' | 'requirements_sent' | 'in_production' | 'review' | 'delivered' | 'completed';

type File = {
    id: string;
    file_url: string;
    file_name: string;
    file_type: 'reference' | 'final';
    created_at: string;
    uploader_id: string;
};

type Message = {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
};

type Project = {
    id: string;
    status: Status;
    order_item: {
        name: string;
        price: number;
    };
    buyer_id: string;
    producer_id: string;
    producer_name: string;
    buyer_name: string;
};

export default function ServiceProjectPage() {
    const { id } = useParams();
    const router = useRouter();
    const { showToast } = useToast();
    const [project, setProject] = useState<Project | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [files, setFiles] = useState<File[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [uploading, setUploading] = useState(false);

    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchProjectData();
        // Set up real-time subscription for messages
        const channel = supabase
            .channel(`project-${id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'project_messages',
                filter: `project_id=eq.${id}`
            }, (payload) => {
                setMessages(prev => [...prev, payload.new as Message]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchProjectData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setCurrentUserId(user.id);

        try {
            // Fetch project details
            const { data: projectData, error: projectError } = await supabase
                .from('service_projects')
                .select(`
                    id,
                    status,
                    buyer_id,
                    producer_id,
                    order_items (
                        name,
                        price
                    )
                `)
                .eq('id', id)
                .single();

            if (projectError) throw projectError;

            // Get profiles to show names
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, artistic_name')
                .in('id', [projectData.buyer_id, projectData.producer_id]);

            setProject({
                ...projectData,
                order_item: Array.isArray(projectData.order_items) ? projectData.order_items[0] : projectData.order_items,
                producer_name: profiles?.find(p => p.id === projectData.producer_id)?.artistic_name || "Productor",
                buyer_name: profiles?.find(p => p.id === projectData.buyer_id)?.artistic_name || "Cliente"
            });

            // Fetch messages
            const { data: messagesData } = await supabase
                .from('project_messages')
                .select('*')
                .eq('project_id', id)
                .order('created_at', { ascending: true });

            setMessages(messagesData || []);

            // Fetch files
            const { data: filesData } = await supabase
                .from('project_files')
                .select('*')
                .eq('project_id', id)
                .order('created_at', { ascending: false });

            setFiles(filesData || []);

        } catch (err) {
            console.error("Error fetching project data:", err);
            // Fallback for UI visualization
            // setProject({ ...mockData });
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || sendingMessage) return;
        setSendingMessage(true);

        try {
            const { error } = await supabase
                .from('project_messages')
                .insert({
                    project_id: id,
                    sender_id: currentUserId,
                    content: newMessage.trim()
                });

            if (error) throw error;
            setNewMessage("");
        } catch (err) {
            console.error("Error sending message:", err);
            showToast("Error al enviar mensaje", "error");
        } finally {
            setSendingMessage(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'reference' | 'final') => {
        const file = e.target.files?.[0];
        if (!file || uploading) return;
        setUploading(true);

        try {
            const path = `projects/${id}/${Date.now()}-${file.name}`;
            const { data, error: uploadError } = await supabase.storage
                .from('project-files')
                .upload(path, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('project-files')
                .getPublicUrl(path);

            const { error: dbError } = await supabase
                .from('project_files')
                .insert({
                    project_id: id,
                    uploader_id: currentUserId,
                    file_url: publicUrl,
                    file_name: file.name,
                    file_type: type
                });

            if (dbError) throw dbError;

            showToast("Archivo subido exitosamente", "success");
            fetchProjectData();
        } catch (err) {
            console.error("Error uploading file:", err);
            showToast("Error al subir archivo", "error");
        } finally {
            setUploading(false);
        }
    };

    const updateStatus = async (newStatus: Status) => {
        try {
            const { error } = await supabase
                .from('service_projects')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;
            setProject(prev => prev ? { ...prev, status: newStatus } : null);
            showToast("Estatus actualizado", "success");
        } catch (err) {
            console.error("Error updating status:", err);
            showToast("Error al actualizar estatus", "error");
        }
    };

    const isProducer = currentUserId === project?.producer_id;
    const isBuyer = currentUserId === project?.buyer_id;

    const timelineSteps = [
        { key: 'paid', label: 'Pago', icon: <DollarSign size={14} /> },
        { key: 'requirements_sent', label: 'Requerimientos', icon: <FileText size={14} /> },
        { key: 'in_production', label: 'Producción', icon: <Cpu size={14} /> },
        { key: 'review', label: 'Revisión', icon: <AlertCircle size={14} /> },
        { key: 'delivered', label: 'Entregado', icon: <CheckCircle2 size={14} /> },
    ];

    const getStepIndex = (status: string) => timelineSteps.findIndex(s => s.key === status);
    const currentStepIndex = getStepIndex(project?.status || 'paid');

    if (loading) return <div className="p-20 text-center animate-pulse">Cargando gestión de proyecto...</div>;
    if (!project) return <div className="p-20 text-center text-red-500">No se encontró el proyecto.</div>;

    return (
        <div className="space-y-8 pb-20">
            {/* Header / Nav */}
            <div className="flex items-center gap-4">
                <Link href="/studio/purchases" className="w-10 h-10 bg-white/5 border border-border/50 rounded-xl flex items-center justify-center hover:bg-accent hover:text-white transition-all">
                    <ChevronLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">{project.order_item.name}</h1>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted">Gestión de Servicio Pro</p>
                </div>
            </div>

            {/* Timeline */}
            <div className="bg-white/40 dark:bg-white/5 backdrop-blur-3xl border border-border/40 rounded-[2.5rem] p-8 lg:p-10">
                <div className="flex items-center justify-between gap-2 overflow-x-auto pb-4 scrollbar-hide">
                    {timelineSteps.map((step, idx) => (
                        <React.Fragment key={step.key}>
                            <div className="flex flex-col items-center min-w-[80px] group">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 mb-3 ${idx <= currentStepIndex
                                    ? 'bg-accent border-accent text-white shadow-lg shadow-accent/20'
                                    : 'bg-background border-border text-muted opacity-40'
                                    }`}>
                                    {idx < currentStepIndex ? <Check size={18} strokeWidth={3} /> : step.icon}
                                </div>
                                <span className={`text-[9px] font-black uppercase tracking-widest text-center whitespace-nowrap transition-colors ${idx <= currentStepIndex ? 'text-foreground' : 'text-muted opacity-40'
                                    }`}>
                                    {step.label}
                                </span>
                            </div>
                            {idx < timelineSteps.length - 1 && (
                                <div className={`flex-1 min-w-[20px] h-0.5 mt-[-18px] transition-colors duration-1000 ${idx < currentStepIndex ? 'bg-accent' : 'bg-border/20'
                                    }`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 h-full">
                {/* Chat Column */}
                <div className="lg:col-span-2 flex flex-col bg-white/40 dark:bg-white/5 backdrop-blur-3xl border border-border/40 rounded-[2.5rem] overflow-hidden h-[650px]">
                    <div className="px-8 py-5 border-b border-border/30 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center">
                                <MessageSquare size={16} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest">Chat del Proyecto</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted">Online</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-6">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                                <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-4">
                                    <MessageSquare size={24} />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-widest">Inicia la conversación</p>
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <div key={msg.id} className={`flex flex-col ${msg.sender_id === currentUserId ? 'items-end' : 'items-start'}`}>
                                    <div className={`max-w-[80%] px-5 py-4 rounded-3xl text-sm font-medium leading-relaxed ${msg.sender_id === currentUserId
                                        ? 'bg-accent text-white rounded-tr-none shadow-lg shadow-accent/10'
                                        : 'bg-background border border-border/50 text-foreground rounded-tl-none shadow-sm'
                                        }`}>
                                        {msg.content}
                                    </div>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-muted mt-2 px-1">
                                        {msg.sender_id === currentUserId ? 'Tú' : (msg.sender_id === project.producer_id ? project.producer_name : project.buyer_name)} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    <form onSubmit={sendMessage} className="p-6 bg-background/50 border-t border-border/30">
                        <div className="relative flex items-center">
                            <input
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Escribe un mensaje..."
                                className="w-full bg-background border-2 border-border/30 rounded-2xl pl-6 pr-14 py-4 text-sm font-medium focus:outline-none focus:border-accent transition-all"
                            />
                            <button
                                type="submit"
                                disabled={sendingMessage || !newMessage.trim()}
                                className="absolute right-2 w-11 h-11 bg-accent text-white rounded-[1rem] flex items-center justify-center shadow-lg shadow-accent/20 hover:scale-105 active:scale-95 transition-all text-background disabled:opacity-50 disabled:scale-100"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </form>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-8">
                    {/* Action Panel */}
                    <div className="bg-white/40 dark:bg-white/5 backdrop-blur-3xl border border-border/40 rounded-[2.5rem] p-8 shadow-xl shadow-black/5">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 bg-accent/10 text-accent rounded-xl flex items-center justify-center">
                                <Zap size={16} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest">Acciones Rápidas</span>
                        </div>

                        {/* Producer Actions */}
                        {isProducer && (
                            <div className="space-y-3">
                                <button
                                    onClick={() => updateStatus('in_production')}
                                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-background border border-border/50 hover:border-blue-500 hover:bg-blue-500/5 transition-all group"
                                >
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted group-hover:text-blue-500">Iniciar Producción</span>
                                    <ChevronRight size={14} className="text-muted group-hover:text-blue-500" />
                                </button>
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="final-file"
                                        onChange={(e) => handleFileUpload(e, 'final')}
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="final-file"
                                        className="w-full flex items-center justify-between p-4 rounded-2xl bg-foreground text-background dark:bg-white dark:text-slate-900 cursor-pointer hover:scale-[1.02] transition-all font-black"
                                    >
                                        <span className="text-[10px] uppercase tracking-widest">Entregar Trabajo Final</span>
                                        <Upload size={14} />
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Buyer Actions */}
                        {isBuyer && (
                            <div className="space-y-4">
                                {project.status === 'paid' && (
                                    <button className="w-full p-4 bg-accent text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] transition-all shadow-lg shadow-accent/20">
                                        Enviar Requerimientos
                                    </button>
                                )}
                                {project.status === 'delivered' && (
                                    <div className="space-y-3">
                                        <button
                                            onClick={() => updateStatus('completed')}
                                            className="w-full p-4 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] transition-all shadow-lg shadow-emerald-500/20"
                                        >
                                            Aceptar y Finalizar
                                        </button>
                                        <button
                                            onClick={() => updateStatus('review')}
                                            className="w-full p-4 border border-red-500/50 text-red-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500/5 transition-all"
                                        >
                                            Solicitar Revisión
                                        </button>
                                    </div>
                                )}

                                <div className="relative">
                                    <input
                                        type="file"
                                        id="ref-file"
                                        onChange={(e) => handleFileUpload(e, 'reference')}
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="ref-file"
                                        className="w-full flex items-center justify-center gap-3 p-4 bg-background border border-border/50 text-muted rounded-2xl cursor-pointer hover:border-accent hover:text-accent transition-all font-bold group"
                                    >
                                        <Paperclip size={14} />
                                        <span className="text-[10px] uppercase tracking-widest">Adjuntar Referencias</span>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Files Section */}
                    <div className="bg-white/40 dark:bg-white/5 backdrop-blur-3xl border border-border/40 rounded-[2.5rem] p-8 max-h-[400px] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center">
                                    <FileArchive size={16} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest">Zona de Archivos</span>
                            </div>
                            <span className="text-[9px] font-black text-muted opacity-40">{files.length}</span>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                            {files.length === 0 ? (
                                <p className="text-[10px] text-muted font-bold text-center py-10 opacity-40 uppercase tracking-widest italic">No hay archivos aún</p>
                            ) : (
                                files.map((file) => (
                                    <a
                                        key={file.id}
                                        href={file.file_url}
                                        target="_blank"
                                        className="flex items-center justify-between p-4 rounded-2xl bg-background border border-border/30 hover:border-accent/50 group transition-all"
                                    >
                                        <div className="flex items-center gap-3 truncate">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${file.file_type === 'final' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                                <FileText size={16} />
                                            </div>
                                            <div className="truncate">
                                                <p className="text-[11px] font-black text-foreground truncate group-hover:text-accent transition-colors">{file.file_name}</p>
                                                <p className={`text-[8px] font-black uppercase tracking-widest ${file.file_type === 'final' ? 'text-emerald-500' : 'text-blue-500'}`}>
                                                    {file.file_type === 'final' ? 'Entrega Final' : 'Referencia'}
                                                </p>
                                            </div>
                                        </div>
                                        <Download size={14} className="text-muted group-hover:text-accent transition-colors" />
                                    </a>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Info Card */}
                    <div className="bg-gradient-to-br from-blue-600/10 to-transparent border border-blue-500/20 rounded-[2rem] p-6">
                        <div className="flex items-start gap-4">
                            <Shield className="text-blue-500 shrink-0" size={24} />
                            <div>
                                <h5 className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-1">Protección Tianguis</h5>
                                <p className="text-[9px] text-muted font-bold leading-relaxed">
                                    El pago se liberará al productor 72h después de la entrega final si no hay solicitudes de revisión. Tu dinero está seguro.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

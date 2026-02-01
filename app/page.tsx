"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  Loader2,
  Music,
  Play,
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe,
  Plus
} from 'lucide-react';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BeatCard from '@/components/BeatCard';
import { Beat } from '@/lib/types';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [newBeats, setNewBeats] = useState<Beat[]>([]);
  const [trendingBeats, setTrendingBeats] = useState<Beat[]>([]);
  const [topSellers, setTopSellers] = useState<Beat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const transformBeatData = async (data: any[]) => {
    return Promise.all(data.map(async (b: any) => {
      const path = b.mp3_tag_url || b.mp3_url || '';
      const encodedPath = path.split('/').map((s: string) => encodeURIComponent(s)).join('/');
      let bucket = 'beats-muestras';
      if (path.includes('-hq-')) bucket = 'beats-mp3-alta-calidad';
      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(encodedPath);

      let finalCoverUrl = b.portadabeat_url;
      if (finalCoverUrl && !finalCoverUrl.startsWith('http')) {
        const { data: { publicUrl: cpUrl } } = supabase.storage.from('portadas-beats').getPublicUrl(finalCoverUrl);
        finalCoverUrl = cpUrl;
      }

      return {
        id: b.id,
        title: b.title,
        producer: b.producer?.artistic_name || 'Productor Anónimo',
        producer_username: b.producer?.username || b.producer?.artistic_name,
        producer_is_verified: b.producer?.is_verified,
        producer_is_founder: b.producer?.is_founder,
        producer_avatar_url: b.producer?.avatar_url,
        producer_tier: b.producer?.subscription_tier,
        price_mxn: b.price_mxn,
        bpm: b.bpm,
        genre: b.genre,
        portadabeat_url: finalCoverUrl,
        mp3_url: publicUrl,
        musical_key: b.musical_key,
        mood: b.mood,
        tag: "🔥",
        tagEmoji: "NEW",
        tagColor: "bg-blue-600",
        coverColor: 'bg-slate-100',
        created_at: b.created_at
      };
    }));
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const columns = 'id,title,price_mxn,bpm,genre,mp3_url,mp3_tag_url,musical_key,mood,created_at,portadabeat_url,producer:producer_id(artistic_name,username,is_verified,is_founder,avatar_url,subscription_tier)';

      const { data: newData } = await supabase.from('beats').select(columns).eq('is_public', true).order('created_at', { ascending: false }).limit(6);
      const { data: trendData } = await supabase.from('beats').select(columns).eq('is_public', true).limit(6);
      const { data: salesData } = await supabase.from('beats').select(columns).eq('is_public', true).limit(6);

      if (newData) setNewBeats(await transformBeatData(newData));
      if (trendData) setTrendingBeats(await transformBeatData(trendData));
      if (salesData) setTopSellers(await transformBeatData(salesData));

      setLoading(false);
    };
    fetchData();
  }, []);

  const Section = ({ title, beats, color }: { title: string, beats: Beat[], color: string }) => (
    <div className="mb-32">
      <div className="flex items-center justify-between mb-12">
        <h2 className="text-4xl font-black tracking-tight uppercase text-slate-900">
          {title}
        </h2>
        <Link href="/beats" className="group flex items-center gap-3 text-xs font-black uppercase tracking-widest text-blue-600 hover:text-slate-900 transition-all">
          Ver Catálogo Completo
          <div className="w-8 h-[1px] bg-blue-600 group-hover:w-12 transition-all"></div>
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
        {beats.map((beat) => (
          <BeatCard key={beat.id} beat={beat} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-600 selection:text-white overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-[95vh] flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/home-hero.png"
            alt="Tianguis Beats Studio"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/80 to-slate-900"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white text-[10px] font-black uppercase tracking-[0.6em] mb-12 animate-fade-in">
            <Zap size={14} className="text-blue-400" />
            La Plataforma #1 de México
          </div>

          <h1 className="text-7xl md:text-[10rem] font-black text-white leading-[0.8] tracking-[-0.06em] uppercase mb-12">
            Eleva tu <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-200 to-white">Sonido.</span>
          </h1>

          <div className="max-w-2xl mx-auto mb-16 px-4">
            <div className="bg-white rounded-[3rem] p-2 flex shadow-2xl shadow-blue-900/40">
              <input
                type="text"
                placeholder="Busca el beat que definirá tu próximo hit..."
                className="flex-1 bg-transparent border-none pl-8 pr-4 outline-none font-bold text-slate-900"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (window.location.href = `/beats?q=${searchQuery}`)}
              />
              <button
                onClick={() => window.location.href = `/beats?q=${searchQuery}`}
                className="bg-blue-600 text-white px-10 py-5 rounded-[2.5rem] font-black uppercase text-[11px] tracking-[0.2em] hover:bg-slate-900 transition-all active:scale-95"
              >
                Explorar
              </button>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-8 mb-20">
            <div className="flex items-center gap-3 text-white/60 font-bold uppercase tracking-widest text-[9px]">
              <ShieldCheck size={16} className="text-blue-500" /> Compra Segura
            </div>
            <div className="flex items-center gap-3 text-white/60 font-bold uppercase tracking-widest text-[9px]">
              <Globe size={16} className="text-blue-500" /> Comunidad Global
            </div>
            <div className="flex items-center gap-3 text-white/60 font-bold uppercase tracking-widest text-[9px]">
              <ArrowRight size={16} className="text-blue-500" /> 0% Comisión
            </div>
          </div>
        </div>

        {/* Floating Shapes for polish */}
        <div className="absolute bottom-10 left-10 w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full"></div>
        <div className="absolute top-20 right-10 w-96 h-96 bg-blue-400/10 blur-[120px] rounded-full"></div>
      </section>

      {/* Main Content */}
      <section className="relative -mt-20 bg-white rounded-t-[5rem] pt-32 pb-40 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {loading ? (
            <div className="flex flex-col items-center justify-center py-40 gap-6">
              <Loader2 className="animate-spin text-blue-600" size={50} />
              <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400">Calibrando el sistema...</p>
            </div>
          ) : (
            <>
              <Section title="🔥 Recién Horneado" beats={newBeats} color="blue" />
              <Section title="📈 Tendencias" beats={trendingBeats} color="blue" />
              <Section title="💰 Lo más Vendido" beats={topSellers} color="blue" />
            </>
          )}

          {/* Value Prop Section */}
          <div className="mt-40 grid md:grid-cols-3 gap-12">
            <div className="p-12 rounded-[4rem] bg-slate-50 border border-slate-100 group hover:bg-blue-600 transition-all duration-500">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-3xl flex items-center justify-center mb-8 group-hover:bg-white group-hover:text-blue-600 transition-all">
                <Zap size={32} />
              </div>
              <h4 className="text-2xl font-black uppercase tracking-tight mb-4 group-hover:text-white transition-all">Velocidad Pura</h4>
              <p className="text-slate-500 font-medium group-hover:text-blue-100 transition-all">Descarga tus archivos instantáneamente después del pago. Sin esperas, sin complicaciones.</p>
            </div>
            <div className="p-12 rounded-[4rem] bg-slate-50 border border-slate-100 group hover:bg-blue-600 transition-all duration-500">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-3xl flex items-center justify-center mb-8 group-hover:bg-white group-hover:text-blue-600 transition-all">
                <Music size={32} />
              </div>
              <h4 className="text-2xl font-black uppercase tracking-tight mb-4 group-hover:text-white transition-all">Calidad de Estudio</h4>
              <p className="text-slate-500 font-medium group-hover:text-blue-100 transition-all">Acceso a archivos WAV de alta fidelidad y Stems para un control total de tu mezcla.</p>
            </div>
            <div className="p-12 rounded-[4rem] bg-slate-50 border border-slate-100 group hover:bg-blue-600 transition-all duration-500">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-3xl flex items-center justify-center mb-8 group-hover:bg-white group-hover:text-blue-600 transition-all">
                <ShieldCheck size={32} />
              </div>
              <h4 className="text-2xl font-black uppercase tracking-tight mb-4 group-hover:text-white transition-all">Tratos Directos</h4>
              <p className="text-slate-500 font-medium group-hover:text-blue-100 transition-all">Fomenta relaciones directas con productores. Licencias claras y transparentes.</p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-40 relative rounded-[5rem] overflow-hidden bg-slate-900 p-20 text-center text-white">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(37,99,235,0.4),transparent)]"></div>
            </div>
            <div className="relative z-10">
              <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-8 italic">¿Eres Productor?</h2>
              <p className="text-blue-300 font-black uppercase tracking-[0.3em] text-[11px] mb-12">Únete a la mayor red de beatmakers de latinoamérica</p>
              <div className="flex flex-wrap justify-center gap-6">
                <Link href="/signup" className="px-12 py-5 bg-blue-600 text-white rounded-full font-black uppercase text-[12px] tracking-widest hover:bg-white hover:text-blue-600 transition-all">Empezar a Vender</Link>
                <Link href="/pricing" className="px-12 py-5 bg-transparent border-2 border-white text-white rounded-full font-black uppercase text-[12px] tracking-widest hover:bg-white hover:text-slate-900 transition-all">Ver Planes</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 1s ease-out forwards; }
      `}</style>
    </div>
  );
}

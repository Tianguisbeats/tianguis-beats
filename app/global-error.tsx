"use client";

import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <html lang="es">
            <body style={{ background: '#0a0a0c', color: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '1.5rem', fontFamily: 'system-ui, sans-serif' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 900, textTransform: 'uppercase' }}>Algo salió mal</h1>
                <p style={{ marginTop: '0.75rem', maxWidth: 420, fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>
                    Ocurrió un error crítico. Intenta recargar la página.
                </p>
                <button
                    onClick={reset}
                    style={{ marginTop: '2rem', borderRadius: 999, background: '#0071e3', color: '#fff', padding: '0.75rem 1.5rem', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', border: 'none', cursor: 'pointer' }}
                >
                    Reintentar
                </button>
            </body>
        </html>
    );
}

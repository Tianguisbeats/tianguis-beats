import { supabase } from './supabase';

export interface GlobalConfig {
    bloqueo_exclusivos: boolean;
    modo_mantenimiento: boolean;
    subidas_habilitadas: boolean;
    ventas_habilitadas: boolean;
    banner_noticia_activa: boolean;
    banner_texto: string;
}

export async function getGlobalConfig(): Promise<GlobalConfig> {
    try {
        const { data, error } = await supabase
            .from('configuracion_global')
            .select('clave, valor');
        
        if (error) throw error;

        const config: any = {
            bloqueo_exclusivos: true,
            modo_mantenimiento: false,
            subidas_habilitadas: true,
            ventas_habilitadas: true,
            banner_noticia_activa: false,
            banner_texto: ''
        };

        data?.forEach((item: any) => {
            config[item.clave] = item.valor;
        });

        return config as GlobalConfig;
    } catch (err) {
        console.error('Error fetching global config:', err);
        return {
            bloqueo_exclusivos: true,
            modo_mantenimiento: false,
            subidas_habilitadas: true,
            ventas_habilitadas: true,
            banner_noticia_activa: false,
            banner_texto: ''
        };
    }
}

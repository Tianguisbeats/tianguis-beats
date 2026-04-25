# Tianguis Beats

Tianguis Beats is a professional marketplace for beats, sound kits, and creative services, tailored for the Mexican music scene.

## Key Features
- **Beat Marketplace**: Professional catalog with advanced filtering (Genre, BPM, Key, Mood).
- **Service Hub**: Marketplace for Mixing, Mastering, and Mentoring.
- **Sound Kits**: Selling Sample Packs, Drum Kits, and Presets.
- **Dynamic Profiles**: Customizable themes (Dark, Neon, Gold) for producers.
- **Subscription Tiers**: Managed access levels (Free, Pro, Premium).

## Documentación
La documentación histórica y técnica se ha organizado en la carpeta `docs/`:
- [Resumen de Arquitectura](docs/ARCHITECTURE.md)
- [Historial de Implementación (ES)](docs/HISTORY_ES.md)
- [Plantillas de correo Supabase](docs/email/README.md)
- [OpenAPI](docs/api/openapi.json)

## Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS, Lucide React.
- **Backend**: Supabase (Auth, DB, Storage).
- **Payments**: Stripe + Stripe Connect.
- **UI**: Base UI/shadcn-style components.

## Getting Started

First, install dependencies:
```bash
npm install
```

Then, run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Learn More
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

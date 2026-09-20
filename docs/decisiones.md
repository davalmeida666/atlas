# Decisiones de ATLAS

- Fase 0: arquitectura web (Next.js + TypeScript + Supabase). La app funcionará como PWA, instalable en móvil y escritorio.
- Fase 0: la página principal actual es un marcador temporal, que se reemplaza en la Fase 1.
- Fase 1: autenticación con correo y contraseña gestionada por Supabase.
- Fase 1: la sesión se comprueba en dos lugares: proxy.ts y cada página del servidor.
- PENDIENTE DE SEGURIDAD: la confirmación de correo está desactivada en desarrollo. Activarla y crear la ruta de confirmación antes de usar ATLAS con datos reales.
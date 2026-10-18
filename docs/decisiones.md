# Decisiones de ATLAS

- Fase 0: arquitectura web (Next.js + TypeScript + Supabase). La app funcionará como PWA, instalable en móvil y escritorio.
- Fase 0: la página principal actual es un marcador temporal, que se reemplaza en la Fase 1.
- Fase 1: autenticación con correo y contraseña gestionada por Supabase.
- Fase 1: la sesión se comprueba en dos lugares: proxy.ts y cada página del servidor.
- PENDIENTE DE SEGURIDAD: la confirmación de correo está desactivada en desarrollo. Activarla y crear la ruta de confirmación antes de usar ATLAS con datos reales.- Fase 2: tablas projects y tasks con RLS. user_id se rellena solo (auth.uid()) y cada usuario solo accede a sus filas.
- Fase 2: subtareas en la misma tabla tasks mediante parent_id.
- PENDIENTE DE SEGURIDAD: verificar que project_id y parent_id pertenezcan al mismo usuario (hoy solo se valida user_id).
- El SQL de cada cambio se guarda en docs/sql/ con número de orden.- Fase 2: pantalla provisional en la página principal para crear y listar proyectos y tareas.
- TEMPORAL: las fechas límite se guardan a las 23:59 con desfase -05:00 (Colombia). Pendiente: zona horaria por usuario.
- Fase 2: completar/reabrir y borrar tareas y proyectos. Borrar pide confirmación previa.
- Fase 2: RLS verificado con un segundo usuario: cada cuenta solo ve sus propios datos.
- Fase 3: se corrigio la vulnerabilidad critica de Next.js (subido a 16.4.2) y las de sharp y source-map-js.
- PENDIENTE: vulnerabilidad de "braces" via eslint-config-next. Es solo del linter (no afecta a usuarios ni esta en produccion). Revisar cuando eslint-config-next tenga una version compatible con Next 16.
- Fase 3 parte B: interprete de lenguaje natural con Gemini (gemini-flash-latest). Responde JSON validado por el codigo; el codigo nunca confia ciegamente en el modelo.
- TEMPORAL: pantalla /interprete-test solo para pruebas, se elimina en la parte C.
# ReciclaPoint · Cesta Inteligente de Reciclaje

Plataforma web educativa que convierte el plástico depositado en una cesta inteligente en puntos y cupones QR de descuento para comercios del barrio.

La interfaz principal es un **panel Bento que cabe en una sola pantalla** (100dvh en escritorio), con simulador de galga, impacto ecológico y tendencia de la comunidad.

## Stack

- React 18 + Vite 6 + Tailwind CSS 3.
- TypeScript en el panel, lógica de descuento, cupones y hooks nuevos.
- Radix UI para el slider accesible; `qrcode.react` para el QR dinámico.
- SVG nativo para la galga y el gráfico de tendencia.

## Panel unificado

- **Simulador de cesta**: galga de 0 a 5 kg, presets y lectura de prueba.
- **Descuento proporcional**: 6% por kg, redondeo entero y tope estricto de 30%.
- **Estados visuales**: esperando material, pesando, descuento calculado y QR generado.
- **Cupón QR** con código, peso, porcentaje y validez de 7 días.
- **Impacto ecológico**: KPIs animados de plástico, árboles estimados y comercios aliados.
- **Tendencia comunitaria**: gráfico SVG interactivo con tabla accesible.

## Rutas

- `#/` — panel unificado.
- `#registrar` — flujo de registro de entregas.
- `#saldo` — consulta de puntos e historial.
- `#tiendas` — tienda y generación de cupones.
- `#share/<token>` — comprobante público de solo lectura.

## Desarrollo local

```bash
npm install
npm run dev
```

Abre http://localhost:5173.

### Scripts

- `npm run dev` — servidor de desarrollo con API local.
- `npm run build` — build de producción.
- `npm run preview` — previsualización del build.
- `npm run typecheck` — validación de TypeScript.
- `npm test` — pruebas unitarias de la lógica de descuento.

## Estructura relevante

```text
src/
├─ pages/DashboardPage.tsx
├─ components/dashboard/       # simulador, galga, QR, KPIs y gráfico
├─ hooks/useWeighingSimulator.ts
├─ lib/discount.ts             # 0–5 kg → 0–30%, con clamp
├─ lib/coupon.ts               # payload del QR
├─ data/dashboard.ts
└─ types/dashboard.ts
```

## Capturas

Las capturas del panel final están en `screenshots/panel/`. Las carpetas `v2`, `v3`, `v8` y `v9` conservan iteraciones anteriores del diseño.

## Despliegue en Vercel + Upstash Redis

1. **Crear proyecto en Vercel** e importar este repo (Vite se detecta solo; el directorio `api/` se convierte en funciones serverless).
2. **Instalar la integración "Upstash Redis"** (Vercel Marketplace) y enlazar el proyecto. Crear una base de datos; Vercel inyecta automáticamente `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`. Redeploy.
   - Nota: Vercel KV está deprecado; su reemplazo es Upstash Redis (`@upstash/redis`), ya incluido en `package.json`.
3. **Definir variables de entorno** (Project > Settings > Environment Variables):
   - `VITE_API_SYNC=1` → activa el sync del kiosco hacia Upstash.
   - `VITE_APP_URL=https://TUDOMINIO.vercel.app` → base de la URL que se codifica en el QR (`/#share/<token>`).

Con eso: el kiosco registra entregas y las sube a Upstash; el QR del comprobante abre `/#share/<token>`, una vista pública de solo lectura con puntos e historial en vivo.

## Desarrollo local de la API

- El servidor dev de Vite incluye una **API local** (`server/localApi.js`) que replica `POST /api/sync` y `GET /api/share` guardando en `.data/reciclaje_api.json`.
- En producción el sync se activa con `VITE_API_SYNC=1`; en desarrollo se activa solo para alimentar la API local.

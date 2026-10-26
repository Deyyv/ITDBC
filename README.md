# ReciclaPoint · Cesta Inteligente de Reciclaje

Plataforma web educativa que convierte el plástico depositado en una cesta inteligente en puntos y cupones QR de descuento para comercios del barrio.

La interfaz principal es una página por secciones con un **gemelo digital 3D de la cesta** construido a partir de las piezas impresas reales (`Modelado/`), que simula el ciclo completo: depósito, pesaje, cupón QR y descarga por la doble compuerta.

## Stack

- React 18 + Vite 6 + Tailwind CSS 3.
- TypeScript en el panel, la simulación de la cesta, la lógica de descuento, cupones y hooks nuevos.
- three.js con `@react-three/fiber` 8 y `@react-three/drei` 9 para el gemelo 3D (se carga en diferido).
- Radix UI para el slider accesible; `qrcode.react` para el QR dinámico.
- SVG nativo para la galga, los sensores y el gráfico de tendencia.

## Secciones

- **Estación**: gemelo 3D (cesta negra, aro central blanco) con vistas isométrica, frontal, superior, explosionada y rayos X; selector de material, estado de la máquina, galga, descuento y cupón QR.
- **Telemetría en vivo**: celda de carga + HX711, presencia HC-SR04, nivel VL53L0X, servo MG996R y ESP32 a 10 Hz, con consola serie.
- **Impacto**: KPIs de plástico, árboles estimados y comercios aliados, y la tendencia de la comunidad.
- **Ficha técnica**: piezas impresas con sus medidas reales, electrónica y cómo funciona.

## Reglas de negocio

- **Descuento único en toda la app** (`src/lib/discount.ts`): 6 % por kg, redondeo entero y tope de 30 % con 5 kg. Desde 167 g se obtiene 1 %.
- **Cupón QR** con código, peso, porcentaje y validez de 7 días.
- **Hardware de referencia**: los sensores, el servo y la posición de cada pieza se configuran en un solo archivo, `src/lib/basket/config.ts`.

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
- `npm test` — pruebas unitarias de la lógica (descuento, cupones y simulación de la cesta).

## Estructura relevante

```text
public/models/cesta/           # piezas STL que usa el gemelo 3D
src/
├─ pages/DashboardPage.tsx
├─ components/dashboard/       # secciones, sensores, consola serie, galga, QR, KPIs
├─ components/twin/            # gemelo 3D (TwinCanvas se carga en diferido)
├─ hooks/useBasketTwin.ts      # orquesta la simulación a 10 Hz
├─ lib/basket/                 # sensores, servo, máquina de estados y config del hardware
├─ lib/discount.ts             # 0–5 kg → 0–30 %, regla única
├─ lib/coupon.ts               # payload del QR
└─ data/dashboard.ts
```

## Revisión de código

Cada commit pasa por Gentleman Guardian Angel (`gga`), con las reglas de `AGENTS.md`.

## Capturas

Las carpetas de `screenshots/` conservan iteraciones anteriores del diseño.

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

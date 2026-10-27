/*
  =============================================================================
   ECOLADRILLOS — Compuerta de la cesta con LCD (sin báscula ni QR)
  -----------------------------------------------------------------------------
   Placa    : Arduino Uno R3 (ATmega328P, 5 V, 16 MHz)
   Versión  : 3.0.0 (2026-10-27)
   Base     : Ecoladrillos.ino v2.2.0 (misma sección COMPUERTA y mismos pines)

   FUNCIONAMIENTO (máquina de estados)
     ESPERA         Equipo listo. El HC-SR04 mide el nivel de la cesta.
     DESCARGA       Botón VERDE: las dos hojas abren, esperan y vuelven a cerrar.
     MANTENIMIENTO  Botón AZUL: abre y deja abierto; otra pulsación del AZUL cierra.
     CESTA_LLENA    Con el plástico a 2 cm o menos del sensor se bloquea la
                    descarga hasta cambiar la cesta (se rearma a 4 cm).
     FALLA          Solo con finales de carrera: una hoja no cerró a tiempo.
                    Se reintenta con el botón VERDE.

   Omitido en esta versión: galgas HX711, QR, pantalla OLED y buzzer
   (el buzzer se deja en LOW para que no suene).

   SERVOS MG995 DE ROTACIÓN CONTINUA (360°)
     Estos servos no van a un ángulo: el pulso fija velocidad y sentido, y no
     sostienen posición. Las hojas abren y cierran por TIEMPO (cerrar dura un
     15 % más para apoyar la hoja contra su tope). En reposo se aplica una
     "presión de reposo": un pulso suave hacia cerrar que mantiene la hoja
     apretada contra el tope. Al encender se cierran una por una.
     Los valores se obtienen con Mapeo_servos_360 (comando r): pegue sus líneas
     en la sección COMPUERTA de este archivo.

   CONEXIONES
     LCD 16x2 + PCF8574 ............ A4 = SDA, A5 = SCL (0x27 o 0x3F, se detecta sola)
     HC-SR04 ....................... TRIG D7, ECHO D8
     Servo 1 / Servo 2 ............. D9 / D10  (fuente externa 5 V 5 A, GND común)
     Final de carrera hoja 1 / 2 ... D4 / D5   (opcional; a GND, pull-up interno)
     Botón verde / azul ............ D6 / A2   (a GND, pull-up interno)
     LED de alarma ................. D13 (con R 220 Ω)
     Buzzer (no se usa) ............ A3

   LIBRERÍAS
     LiquidCrystal I2C (Frank de Brabander). Servo y Wire vienen con el IDE.
     Placa: "Arduino AVR Boards" 1.8.3 o superior (por Wire.setWireTimeout).

   COMANDOS POR MONITOR SERIE (9600 baudios, ajuste "Nueva línea")
     d   descargar (igual que el botón VERDE)
     m   mantenimiento: abrir / cerrar (igual que el botón AZUL)
     h   cerrar las dos hojas, una por una; h1 / h2 = cerrar solo una
     i   informe de estado

   PUESTA EN MARCHA
     1. Cargue Mapeo_servos_360, mida cada servo y pegue el resultado de "r"
        en la sección COMPUERTA.
     2. Con la cesta vacía, revise con "i" la distancia que mide el sensor y
        ajuste ALTURA_CESTA_MM si hace falta.
  =============================================================================
*/

#include <Wire.h>
#include <Servo.h>
#include <avr/wdt.h>
#include <LiquidCrystal_I2C.h>

// =============================================================================
//  1. CONFIGURACIÓN
// =============================================================================

#define USAR_WATCHDOG        1   // reinicia el equipo si el programa se bloquea > 8 s
#define USAR_FINALES_CARRERA 0   // 0 = cierre por tiempo + presión de reposo
                                 // 1 = cierre hasta tocar un microswitch en D4 / D5
#define USAR_SENSOR_NIVEL    1   // 0 si el HC-SR04 no está montado
#define USAR_BOTON_AZUL      1   // 0 para ignorar el botón de mantenimiento

namespace Pin {
  constexpr uint8_t TRIG   = 7,  ECHO   = 8;     // HC-SR04
  constexpr uint8_t SERVO1 = 9,  SERVO2 = 10;
  constexpr uint8_t FC1    = 4,  FC2    = 5;     // finales de carrera (opcionales)
  constexpr uint8_t BTN_VERDE = 6, BTN_AZUL = A2;
  constexpr uint8_t LED    = 13, BUZZER = A3;
}

namespace Cfg {
  // --- Compuerta (servos de rotación continua) -----------------------------
  //  Pulso en µs: 1500 = detenido; más o menos de 1500 = gira hacia un lado u
  //  otro. Pegue aquí las líneas que imprime Mapeo_servos_360 (comando r).
  //  PULSO_REPOSO = pulso suave hacia cerrar con la hoja apoyada en su tope
  //  (0 = motor apagado en reposo).
  //  Valores medidos con Mapeo_servos_360 v3 en el prototipo (2026-10-20).
  constexpr uint16_t S1_PULSO_ABRIR = 1300, S1_PULSO_CERRAR = 1700, S1_PULSO_REPOSO = 1550;   // pin 9
  constexpr uint16_t S1_TIEMPO_ABRIR_MS = 1573, S1_TIEMPO_CERRAR_MS = 2204;
  constexpr uint16_t S2_PULSO_ABRIR = 1300, S2_PULSO_CERRAR = 1700, S2_PULSO_REPOSO = 1550;   // pin 10
  constexpr uint16_t S2_TIEMPO_ABRIR_MS = 1836, S2_TIEMPO_CERRAR_MS = 2506;
  constexpr uint8_t  MARGEN_CIERRE_PCT  = 15;    // cerrar dura un 15 % más (apoya la hoja en el tope)
  constexpr uint16_t TIEMPO_ABIERTA_MS  = 2500;  // hojas abajo esperando que caiga el plástico
  constexpr uint16_t CIERRE_TIMEOUT_MS  = 3000;  // solo con finales de carrera
  constexpr uint16_t CAIDA_TOLERADA_MS  = 150;   // solo con finales de carrera

  // --- Nivel de la cesta ----------------------------------------------------
  constexpr uint16_t ALTURA_CESTA_MM  = 400;     // sensor -> fondo con la cesta vacía (para el %)
  constexpr uint16_t DIST_ALERTA_MM   = 20;      // cesta llena: plástico a esta distancia o menos
  constexpr uint16_t DIST_REARME_MM   = 40;      // se rearma al volver a medir esta distancia o más
  constexpr uint16_t PERIODO_SONAR_MS = 170;     // 3 lecturas (mediana) cada ~0,5 s
  constexpr uint32_t ECO_TIMEOUT_US   = 25000UL; // ~4 m
  constexpr uint8_t  SIN_ECO_MAX      = 15;      // lecturas seguidas sin eco antes de "sin dato"

  // --- Interfaz -------------------------------------------------------------
  constexpr uint16_t PERIODO_LCD_MS   = 100;
  constexpr uint16_t PAGINA_MS        = 3000;    // las pantallas de espera alternan cada 3 s
  constexpr uint16_t MENSAJE_MS       = 2000;    // "Listo, gracias" y "Bloqueada"
  constexpr uint16_t PARPADEO_MS      = 500;
  constexpr uint16_t ANTIRREBOTE_MS   = 30;
}

#define CIERRE_CON_SWITCH USAR_FINALES_CARRERA

// =============================================================================
//  2. TIPOS (antes de cualquier función, para los prototipos que genera el IDE)
// =============================================================================

enum class Estado : uint8_t { ESPERA, DESCARGA, LISTO, CESTA_LLENA, BLOQUEADA, MANTENIMIENTO, FALLA };
enum class Fase   : uint8_t { ABRIENDO, ABIERTA, CERRANDO };
enum class Mov    : uint8_t { QUIETO, ABRIENDO, CERRANDO };

struct Boton {
  uint8_t  pin;
  bool     estable;      // último estado ya filtrado (HIGH = suelto)
  bool     lectura;      // última lectura cruda
  uint32_t tCambio;
};

struct Sistema {
  Estado   estado = Estado::ESPERA;
  uint32_t tEstado = 0;
  // Compuerta
  Fase     fase = Fase::ABRIENDO;
  uint32_t tFase = 0;
  Mov      mov[2] = { Mov::QUIETO, Mov::QUIETO };
  uint32_t tMov[2] = { 0, 0 };
  bool     cerradaEst[2] = { false, false };   // sin switch: estado supuesto de la hoja
  uint32_t tSuelta[2] = { 0, 0 };             // desde cuándo la hoja no toca su final de carrera
  uint16_t descargas = 0;
  // Nivel
  uint16_t distMm = Cfg::ALTURA_CESTA_MM;     // distancia sensor -> plástico (mediana)
  uint8_t  nivel = 0;
  bool     nivelValido = false;
  bool     cestaLlena = false;
};

// =============================================================================
//  3. OBJETOS GLOBALES
// =============================================================================

LiquidCrystal_I2C lcd27(0x27, 16, 2), lcd3F(0x3F, 16, 2);
LiquidCrystal_I2C *lcd = nullptr;                 // nullptr si no se detecta la LCD
Servo   servoHoja[2];
Sistema sis;
Boton   btnVerde = { Pin::BTN_VERDE, HIGH, HIGH, 0 };
Boton   btnAzul  = { Pin::BTN_AZUL,  HIGH, HIGH, 0 };

// =============================================================================
//  4. PANTALLA LCD
// =============================================================================

// Caracteres propios. La ranura 0 de la CGRAM se escribe como código 8 para
// poder guardarla dentro de un texto; las ranuras 1..4 son celdas de barra con
// 1..4 columnas llenas. La LCD no tiene tildes, por eso los textos no las usan.
const char CH_VACIO   = 8;
const char CH_CANDADO = 5;
const char CH_ABAJO   = 6;
const char CH_OK      = 7;
const char CH_LLENO   = (char)0xFF;               // bloque sólido de la ROM de la LCD

uint8_t glifoVacio[8]   = { 0, 0, 0, 0, 0, 0, 0, 0b10101 };
uint8_t glifoCandado[8] = { 0b01110, 0b10001, 0b10001, 0b11111, 0b11011, 0b11011, 0b11111, 0 };
uint8_t glifoAbajo[8]   = { 0b00100, 0b00100, 0b00100, 0b00100, 0b10101, 0b01110, 0b00100, 0 };
uint8_t glifoOk[8]      = { 0, 0b00001, 0b00011, 0b10110, 0b11100, 0b01000, 0, 0 };

char lcdCache[2][17];                             // lo que hay en pantalla: solo se reescribe lo que cambia

bool i2cPresente(uint8_t dir) {
  Wire.beginTransmission(dir);
  return Wire.endTransmission() == 0;
}

void iniciarLcd() {
  Wire.begin();
  Wire.setWireTimeout(3000, true);                // un bus I2C bloqueado ya no congela el equipo
  if (i2cPresente(0x27))      lcd = &lcd27;
  else if (i2cPresente(0x3F)) lcd = &lcd3F;
  if (!lcd) {
    Serial.println(F("LCD : NO DETECTADA (revise SDA=A4, SCL=A5, VCC y GND)"));
    return;
  }
  lcd->init();
  lcd->backlight();
  lcd->createChar(0, glifoVacio);
  for (uint8_t cols = 1; cols <= 4; cols++) {
    uint8_t filas[8];
    uint8_t bits = (uint8_t)(0x1F << (5 - cols)) & 0x1F;
    for (uint8_t f = 0; f < 8; f++) filas[f] = bits;
    lcd->createChar(cols, filas);
  }
  lcd->createChar(CH_CANDADO, glifoCandado);
  lcd->createChar(CH_ABAJO, glifoAbajo);
  lcd->createChar(CH_OK, glifoOk);
  lcd->clear();
  for (uint8_t f = 0; f < 2; f++) {
    memset(lcdCache[f], ' ', 16);
    lcdCache[f][16] = '\0';
  }
  Serial.print(F("LCD : 0x"));
  Serial.println(lcd == &lcd27 ? F("27") : F("3F"));
}

// Escribe una fila completa (rellena con espacios) tocando solo las celdas que cambian.
void lcdLinea(uint8_t fila, const char *txt) {
  if (!lcd) return;
  bool fin = false;
  for (uint8_t col = 0; col < 16; col++) {
    if (!fin && txt[col] == '\0') fin = true;
    char c = fin ? ' ' : txt[col];
    if (lcdCache[fila][col] != c) {
      lcd->setCursor(col, fila);
      lcd->write((uint8_t)c);
      lcdCache[fila][col] = c;
    }
  }
}

// Copia `txt` centrado en un búfer de 16 columnas.
void centrado(char *dst, const char *txt) {
  size_t n = strlen(txt);
  if (n > 16) n = 16;
  memset(dst, ' ', 16);
  memcpy(dst + (16 - n) / 2, txt, n);
  dst[16] = '\0';
}

// Barra de `celdas` caracteres para un valor en milésimas (0..1000), 5 pasos por celda.
void barra(char *dst, uint8_t celdas, uint16_t milesimas) {
  if (milesimas > 1000) milesimas = 1000;
  uint16_t pasos = (uint32_t)milesimas * celdas * 5 / 1000;
  for (uint8_t i = 0; i < celdas; i++) {
    int16_t resto = (int16_t)pasos - i * 5;
    if (resto >= 5)      dst[i] = CH_LLENO;
    else if (resto <= 0) dst[i] = CH_VACIO;
    else                 dst[i] = (char)resto;
  }
  dst[celdas] = '\0';
}

// "Nivel " + barra de 6 celdas + porcentaje alineado a la derecha.
void lineaNivel(char *dst) {
#if USAR_SENSOR_NIVEL
  if (!sis.nivelValido) { strcpy(dst, "Nivel   sin dato"); return; }
  memcpy(dst, "Nivel ", 6);
  barra(dst + 6, 6, sis.nivel * 10);
  snprintf(dst + 12, 5, "%3u%%", (unsigned)sis.nivel);
#else
  centrado(dst, "ECOLADRILLOS");
#endif
}

// =============================================================================
//  5. BOTONES
// =============================================================================

void iniciarBoton(Boton &b) {
  pinMode(b.pin, INPUT_PULLUP);
  // Un botón apretado al encender solo cuenta cuando se suelta y se vuelve a pulsar.
  b.estable = b.lectura = digitalRead(b.pin);
}

bool botonPresionado(Boton &b, uint32_t ahora) {
  bool l = digitalRead(b.pin);
  if (l != b.lectura) { b.lectura = l; b.tCambio = ahora; }
  if (ahora - b.tCambio > Cfg::ANTIRREBOTE_MS && l != b.estable) {
    b.estable = l;
    return l == LOW;                              // flanco de bajada = pulsación
  }
  return false;
}

// =============================================================================
//  6. NIVEL DE LA CESTA (HC-SR04, mediana de 3)
// =============================================================================

uint16_t medirDistanciaMm() {
  digitalWrite(Pin::TRIG, LOW);  delayMicroseconds(2);
  digitalWrite(Pin::TRIG, HIGH); delayMicroseconds(10);
  digitalWrite(Pin::TRIG, LOW);
  uint32_t us = pulseIn(Pin::ECHO, HIGH, Cfg::ECO_TIMEOUT_US);
  if (us == 0) return 0;                          // 0 = sin eco
  uint32_t mm = us * 343UL / 2000UL;              // 343 m/s, ida y vuelta
  return mm < 1 ? 1 : (uint16_t)mm;
}

void actualizarNivel() {
  static uint16_t muestras[3] = { Cfg::ALTURA_CESTA_MM, Cfg::ALTURA_CESTA_MM, Cfg::ALTURA_CESTA_MM };
  static uint8_t i = 0, sinEco = 0;

  uint16_t d = medirDistanciaMm();
  if (d == 0) {
    // Sin eco. Si el plástico ya estaba muy cerca, está dentro de la zona ciega
    // del HC-SR04 (< 2-3 cm): se cuenta como lleno. Si no, se ignora la lectura.
    if (sis.distMm > Cfg::DIST_REARME_MM) {
      if (sinEco < 255 && ++sinEco >= Cfg::SIN_ECO_MAX) sis.nivelValido = false;
      return;
    }
  }
  sinEco = 0;
  sis.nivelValido = true;
  muestras[i] = d < Cfg::ALTURA_CESTA_MM ? d : Cfg::ALTURA_CESTA_MM;
  i = (i + 1) % 3;

  uint16_t a = muestras[0], b = muestras[1], c = muestras[2];
  uint16_t mediana = max(min(a, b), min(max(a, b), c));   // descarta lecturas aisladas
  sis.distMm = mediana;
  sis.nivel = (uint8_t)(((uint32_t)(Cfg::ALTURA_CESTA_MM - mediana) * 100 + Cfg::ALTURA_CESTA_MM / 2) /
                        Cfg::ALTURA_CESTA_MM);

  if (!sis.cestaLlena && mediana <= Cfg::DIST_ALERTA_MM) {
    sis.cestaLlena = true;
    Serial.print(F("ALERTA: cesta llena (")); Serial.print(mediana); Serial.println(F(" mm del sensor)"));
  } else if (sis.cestaLlena && mediana >= Cfg::DIST_REARME_MM) {
    sis.cestaLlena = false;
    Serial.println(F("Cesta cambiada: descarga habilitada."));
  }
}

// =============================================================================
//  7. COMPUERTA (servos de rotación continua, movimiento no bloqueante)
// =============================================================================

const uint8_t  HOJA_PIN_SERVO[2]    = { Pin::SERVO1, Pin::SERVO2 };
const uint8_t  HOJA_PIN_FC[2]       = { Pin::FC1, Pin::FC2 };
const uint16_t HOJA_PULSO_ABRIR[2]  = { Cfg::S1_PULSO_ABRIR,  Cfg::S2_PULSO_ABRIR };
const uint16_t HOJA_PULSO_CERRAR[2] = { Cfg::S1_PULSO_CERRAR, Cfg::S2_PULSO_CERRAR };
const uint16_t HOJA_PULSO_REPOSO[2] = { Cfg::S1_PULSO_REPOSO, Cfg::S2_PULSO_REPOSO };
const uint16_t HOJA_T_ABRIR[2]      = { Cfg::S1_TIEMPO_ABRIR_MS,  Cfg::S2_TIEMPO_ABRIR_MS };
const uint16_t HOJA_T_CERRAR[2]     = { Cfg::S1_TIEMPO_CERRAR_MS, Cfg::S2_TIEMPO_CERRAR_MS };

uint32_t tiempoCierre(uint8_t i) { return (uint32_t)HOJA_T_CERRAR[i] * (100 + Cfg::MARGEN_CIERRE_PCT) / 100; }

bool hojaCerrada(uint8_t i, uint32_t ahora) {
#if CIERRE_CON_SWITCH
  (void)ahora;
  return digitalRead(HOJA_PIN_FC[i]) == LOW;
#else
  if (sis.mov[i] == Mov::CERRANDO) return ahora - sis.tMov[i] >= tiempoCierre(i);
  return sis.cerradaEst[i];
#endif
}

// Cambia el movimiento de una hoja. QUIETO = sin pulso (motor apagado), así el
// servo de 360° no se arrastra aunque su punto neutro no sea exactamente 1500.
void motor(uint8_t i, Mov m, uint32_t ahora) {
  sis.mov[i] = m;
  sis.tMov[i] = ahora;
  if (m == Mov::ABRIENDO) sis.cerradaEst[i] = false;
  if (m == Mov::QUIETO) { servoHoja[i].detach(); return; }
  servoHoja[i].writeMicroseconds(m == Mov::ABRIENDO ? HOJA_PULSO_ABRIR[i] : HOJA_PULSO_CERRAR[i]);
  if (!servoHoja[i].attached()) servoHoja[i].attach(HOJA_PIN_SERVO[i]);
}

// Hoja cerrada: queda con la presión de reposo (si está configurada) o apagada.
void reposo(uint8_t i, uint32_t ahora) {
  motor(i, Mov::QUIETO, ahora);
  sis.cerradaEst[i] = true;
#if !CIERRE_CON_SWITCH
  if (HOJA_PULSO_REPOSO[i]) {
    servoHoja[i].writeMicroseconds(HOJA_PULSO_REPOSO[i]);
    servoHoja[i].attach(HOJA_PIN_SERVO[i]);
  }
#endif
}

void detenerHojas(uint32_t ahora) { motor(0, Mov::QUIETO, ahora); motor(1, Mov::QUIETO, ahora); }

void iniciarApertura(uint32_t ahora) {
  detenerHojas(ahora);                            // quita la presión de reposo
  motor(0, Mov::ABRIENDO, ahora);
  motor(1, Mov::ABRIENDO, ahora);
  sis.fase = Fase::ABRIENDO;
  sis.tFase = ahora;
}

void iniciarCierre(uint32_t ahora) {
  for (uint8_t i = 0; i < 2; i++)
    if (!hojaCerrada(i, ahora)) motor(i, Mov::CERRANDO, ahora);
  sis.fase = Fase::CERRANDO;
  sis.tFase = ahora;
}

// Avanza el cierre de ambas hojas. Devuelve 1 = las dos cerradas, 0 = en curso,
// -1 = alguna no tocó su final de carrera a tiempo (solo con switches).
int8_t avanzarCierre(uint32_t ahora) {
  bool pendiente = false;
  for (uint8_t i = 0; i < 2; i++) {
    if (sis.mov[i] != Mov::CERRANDO) continue;
    if (hojaCerrada(i, ahora)) reposo(i, ahora);
    else pendiente = true;
  }
  if (!pendiente) return 1;
#if CIERRE_CON_SWITCH
  if (ahora - sis.tFase >= Cfg::CIERRE_TIMEOUT_MS) { detenerHojas(ahora); return -1; }
#endif
  return 0;
}

// Avanza un ciclo de compuerta. Con autoCerrar, las hojas cierran solas tras
// TIEMPO_ABIERTA_MS; sin él (mantenimiento) quedan abiertas hasta iniciarCierre().
// Devuelve 1 = terminó cerrada, 0 = en curso, -1 = una hoja no cerró.
int8_t actualizarCompuerta(uint32_t ahora, bool autoCerrar) {
  switch (sis.fase) {
    case Fase::ABRIENDO: {
      bool abriendo = false;
      for (uint8_t i = 0; i < 2; i++) {
        if (sis.mov[i] != Mov::ABRIENDO) continue;
        if (ahora - sis.tMov[i] >= HOJA_T_ABRIR[i]) motor(i, Mov::QUIETO, ahora);
        else abriendo = true;
      }
      if (!abriendo) {
        sis.fase = Fase::ABIERTA;
        sis.tFase = ahora;
        Serial.println(F("Hojas abiertas."));
      }
      break;
    }
    case Fase::ABIERTA:
      if (autoCerrar && ahora - sis.tFase >= Cfg::TIEMPO_ABIERTA_MS) {
        Serial.println(F("Cerrando hojas..."));
        iniciarCierre(ahora);
      }
      break;
    case Fase::CERRANDO: {
      int8_t r = avanzarCierre(ahora);
      if (r > 0) Serial.println(F("Hojas cerradas."));
      return r;
    }
  }
  return 0;
}

// Cierra UNA hoja (bloqueante). Se usa al encender y con el comando h. Sin
// switch la posición es desconocida: se cierra el tiempo completo y la hoja
// termina apoyada en su tope.
bool cerrarHoja(uint8_t i) {
  char f0[17], f1[17], txt[17];
  snprintf(txt, sizeof txt, "Cerrando hoja %u", (unsigned)(i + 1));
  centrado(f0, txt);
  lcdLinea(0, f0);

  uint32_t inicio = millis();
  uint32_t total = CIERRE_CON_SWITCH ? Cfg::CIERRE_TIMEOUT_MS : tiempoCierre(i);
  sis.cerradaEst[i] = false;                      // sin switch: fuerza el cierre completo
  motor(i, Mov::CERRANDO, inicio);
  while (true) {
    wdt_reset();
    uint32_t ahora = millis();
    if (hojaCerrada(i, ahora)) { reposo(i, ahora); return true; }
#if CIERRE_CON_SWITCH
    if (ahora - inicio >= Cfg::CIERRE_TIMEOUT_MS) { motor(i, Mov::QUIETO, ahora); return false; }
#endif
    uint32_t avance = (ahora - inicio) * 1000UL / total;
    barra(f1, 16, avance > 1000 ? 1000 : (uint16_t)avance);
    lcdLinea(1, f1);
  }
}

// Al encender se cierran las hojas UNA POR UNA: arrancar los dos servos a la
// vez pide mucha corriente y la fuente puede no alcanzar para ambos.
bool cerrarUnaPorUna() {
  bool ok1 = cerrarHoja(0);
  bool ok2 = cerrarHoja(1);
  return ok1 && ok2;
}

// Solo con finales de carrera: si una hoja deja de presionar su switch (el peso
// la hace bajar), se vuelve a subir. Devuelve false si no logra cerrarla.
bool mantenerCerrada(uint32_t ahora) {
#if CIERRE_CON_SWITCH
  for (uint8_t i = 0; i < 2; i++) {
    bool cerrada = hojaCerrada(i, ahora);
    if (sis.mov[i] == Mov::QUIETO) {
      if (cerrada)               sis.tSuelta[i] = 0;
      else if (!sis.tSuelta[i])  sis.tSuelta[i] = ahora | 1;      // |1 evita el valor 0
      else if (ahora - sis.tSuelta[i] >= Cfg::CAIDA_TOLERADA_MS) motor(i, Mov::CERRANDO, ahora);
    } else if (sis.mov[i] == Mov::CERRANDO) {
      if (cerrada) { reposo(i, ahora); sis.tSuelta[i] = 0; }
      else if (ahora - sis.tMov[i] >= Cfg::CIERRE_TIMEOUT_MS) { motor(i, Mov::QUIETO, ahora); return false; }
    }
  }
#else
  (void)ahora;
#endif
  return true;
}

// Avance de la apertura en milésimas (para la barra de la LCD).
uint16_t aperturaMilesimas(uint32_t ahora) {
  uint32_t total = max(HOJA_T_ABRIR[0], HOJA_T_ABRIR[1]);
  uint32_t avance = (ahora - sis.tFase) * 1000UL / total;
  return avance > 1000 ? 1000 : (uint16_t)avance;
}

// Cuánto falta para cerrar, en milésimas (la barra se vacía al cerrar).
uint16_t cierreRestanteMilesimas(uint32_t ahora) {
  uint32_t total = CIERRE_CON_SWITCH ? Cfg::CIERRE_TIMEOUT_MS : max(tiempoCierre(0), tiempoCierre(1));
  uint32_t avance = (ahora - sis.tFase) * 1000UL / total;
  return avance >= 1000 ? 0 : (uint16_t)(1000 - avance);
}

// =============================================================================
//  8. ESTADOS
// =============================================================================

void cambiarEstado(Estado e, uint32_t ahora) {
  sis.estado = e;
  sis.tEstado = ahora;
}

void iniciarDescarga(uint32_t ahora) {
  Serial.println(F("VERDE: descarga, abriendo hojas..."));
  iniciarApertura(ahora);
  cambiarEstado(Estado::DESCARGA, ahora);
}

void iniciarMantenimiento(uint32_t ahora) {
  Serial.println(F("AZUL: mantenimiento, abriendo hojas..."));
  iniciarApertura(ahora);
  cambiarEstado(Estado::MANTENIMIENTO, ahora);
}

void entrarEnFalla(uint32_t ahora) {
  Serial.println(F("FALLA: una hoja no tocó su final de carrera (D4 / D5). Revise y pulse VERDE."));
  cambiarEstado(Estado::FALLA, ahora);
}

// Con finales de carrera, vigila que las hojas sigan arriba. Devuelve false si entró en falla.
bool vigilarCompuerta(uint32_t ahora) {
  if (mantenerCerrada(ahora)) return true;
  entrarEnFalla(ahora);
  return false;
}

void maquinaEstados(uint32_t ahora, bool verde, bool azul) {
  switch (sis.estado) {
    case Estado::ESPERA:
      if (!vigilarCompuerta(ahora)) break;
      if (azul)                 iniciarMantenimiento(ahora);
      else if (sis.cestaLlena)  cambiarEstado(Estado::CESTA_LLENA, ahora);
      else if (verde)           iniciarDescarga(ahora);
      break;

    case Estado::DESCARGA: {
      int8_t r = actualizarCompuerta(ahora, true);
      if (r > 0) {
        sis.descargas++;
        Serial.print(F("Descarga completa #")); Serial.println(sis.descargas);
        cambiarEstado(Estado::LISTO, ahora);
      } else if (r < 0) {
        entrarEnFalla(ahora);
      }
      break;
    }

    case Estado::LISTO:
    case Estado::BLOQUEADA:
      if (!vigilarCompuerta(ahora)) break;
      if (azul) iniciarMantenimiento(ahora);
      else if (ahora - sis.tEstado >= Cfg::MENSAJE_MS)
        cambiarEstado(sis.cestaLlena ? Estado::CESTA_LLENA : Estado::ESPERA, ahora);
      break;

    case Estado::CESTA_LLENA:
      if (!vigilarCompuerta(ahora)) break;
      if (azul)                 iniciarMantenimiento(ahora);
      else if (!sis.cestaLlena) cambiarEstado(Estado::ESPERA, ahora);
      else if (verde) {
        Serial.println(F("VERDE ignorado: la cesta está llena."));
        cambiarEstado(Estado::BLOQUEADA, ahora);
      }
      break;

    case Estado::MANTENIMIENTO: {
      if (azul && sis.fase == Fase::ABIERTA) {
        Serial.println(F("AZUL: cerrando hojas..."));
        iniciarCierre(ahora);
      }
      int8_t r = actualizarCompuerta(ahora, false);
      if (r > 0)      cambiarEstado(Estado::ESPERA, ahora);
      else if (r < 0) entrarEnFalla(ahora);
      break;
    }

    case Estado::FALLA:
      if (verde) {                                // reintento: se cierra de nuevo
        Serial.println(F("Reintentando cierre de la compuerta..."));
        sis.cerradaEst[0] = sis.cerradaEst[1] = false;
        iniciarCierre(ahora);
        cambiarEstado(Estado::DESCARGA, ahora);
      }
      break;
  }
}

// Las hojas están quietas y cerradas: se puede medir el nivel sin que el
// plástico que cae engañe al sensor.
bool compuertaEnReposo() {
  return sis.estado != Estado::DESCARGA && sis.estado != Estado::MANTENIMIENTO;
}

// =============================================================================
//  9. SALIDAS: LCD Y LED
// =============================================================================

void actualizarLcd(uint32_t ahora) {
  char f0[17], f1[17], txt[17];
  bool primeraPagina = ((ahora - sis.tEstado) / Cfg::PAGINA_MS) % 2 == 0;

  switch (sis.estado) {
    case Estado::ESPERA:
      if (primeraPagina) {
        centrado(f0, "Lista para usar");
        lineaNivel(f1);
      } else {
        centrado(f0, "Coloque material");
        centrado(f1, "y pulse VERDE");
      }
      break;

    case Estado::DESCARGA:
      if (sis.fase == Fase::ABRIENDO) {
        snprintf(txt, sizeof txt, "%c Abriendo...", CH_ABAJO);
        centrado(f0, txt);
        barra(f1, 16, aperturaMilesimas(ahora));
      } else if (sis.fase == Fase::ABIERTA) {
        uint32_t pasado = ahora - sis.tFase;
        uint32_t resta = pasado >= Cfg::TIEMPO_ABIERTA_MS ? 0 : Cfg::TIEMPO_ABIERTA_MS - pasado;
        snprintf(f0, sizeof f0, "%c Descargando %us", CH_ABAJO, (unsigned)((resta + 999) / 1000));
        barra(f1, 16, (uint16_t)(resta * 1000UL / Cfg::TIEMPO_ABIERTA_MS));
      } else {
        centrado(f0, "Cerrando...");
        barra(f1, 16, cierreRestanteMilesimas(ahora));
      }
      break;

    case Estado::LISTO:
      snprintf(txt, sizeof txt, "%c Listo, gracias", CH_OK);
      centrado(f0, txt);
      lineaNivel(f1);
      break;

    case Estado::CESTA_LLENA:
      snprintf(txt, sizeof txt, "%c CESTA LLENA", CH_CANDADO);
      centrado(f0, txt);
      if (primeraPagina) centrado(f1, "Cambie la cesta");
      else               lineaNivel(f1);
      break;

    case Estado::BLOQUEADA:
      snprintf(txt, sizeof txt, "%c Bloqueada", CH_CANDADO);
      centrado(f0, txt);
      snprintf(f1, sizeof f1, "Cesta llena %3u%%", (unsigned)sis.nivel);
      break;

    case Estado::MANTENIMIENTO:
      centrado(f0, "Mantenimiento");
      if (sis.fase == Fase::ABRIENDO)     centrado(f1, "Abriendo...");
      else if (sis.fase == Fase::ABIERTA) centrado(f1, "Azul = cerrar");
      else                                centrado(f1, "Cerrando...");
      break;

    case Estado::FALLA:
      centrado(f0, "FALLA compuerta");
      centrado(f1, primeraPagina ? "Revise la hoja" : "y pulse VERDE");
      break;
  }
  lcdLinea(0, f0);
  lcdLinea(1, f1);
}

void actualizarLed(uint32_t ahora) {
  bool encendido = false;
  switch (sis.estado) {
    case Estado::DESCARGA:
    case Estado::MANTENIMIENTO:
      encendido = true;                           // hojas en movimiento o abiertas
      break;
    case Estado::CESTA_LLENA:
    case Estado::BLOQUEADA:
    case Estado::FALLA:
      encendido = (ahora / Cfg::PARPADEO_MS) % 2 == 0;
      break;
    default:
      break;
  }
  digitalWrite(Pin::LED, encendido ? HIGH : LOW);
}

// =============================================================================
// 10. COMANDOS POR MONITOR SERIE
// =============================================================================

void informe(uint32_t ahora) {
  static const char *const NOMBRES[] = { "ESPERA", "DESCARGA", "LISTO", "CESTA_LLENA",
                                         "BLOQUEADA", "MANTENIMIENTO", "FALLA" };
  Serial.println(F("------------- ESTADO -------------"));
  Serial.print(F("Estado    : ")); Serial.println(NOMBRES[(uint8_t)sis.estado]);
  Serial.print(F("Cesta     : "));
  if (sis.nivelValido) {
    Serial.print(sis.nivel); Serial.print(F(" %  (")); Serial.print(sis.distMm); Serial.println(F(" mm del sensor)"));
  } else {
    Serial.println(F("sin dato (revise TRIG D7 / ECHO D8)"));
  }
  Serial.print(F("Hojas     : 1 ")); Serial.print(hojaCerrada(0, ahora) ? F("cerrada") : F("ABIERTA"));
  Serial.print(F(" | 2 "));          Serial.println(hojaCerrada(1, ahora) ? F("cerrada") : F("ABIERTA"));
  Serial.print(F("Descargas : ")); Serial.println(sis.descargas);
}

// Lee una línea sin bloquear y la ejecuta. Devuelve 'd' o 'm' para la máquina de estados.
char procesarSerie(uint32_t ahora) {
  static char linea[16];
  static uint8_t n = 0;
  while (Serial.available()) {
    char c = Serial.read();
    if (c != '\n' && c != '\r') { if (n < sizeof(linea) - 1) linea[n++] = c; continue; }
    if (n == 0) continue;
    linea[n] = '\0'; n = 0;
    char cmd = tolower(linea[0]);
    if (cmd == 'd' || cmd == 'm') return cmd;
    if (cmd == 'i') informe(ahora);
    else if (cmd == 'h') {                        // h = cerrar las dos hojas, h1 / h2 = solo una
      if (!compuertaEnReposo()) { Serial.println(F("Espere a que termine el movimiento.")); continue; }
      bool ok;
      if (linea[1] == '1' || linea[1] == '2') {
        uint8_t i = linea[1] - '1';
        Serial.print(F("Cerrando hoja ")); Serial.println(i + 1);
        ok = cerrarHoja(i);
      } else {
        Serial.println(F("Cerrando hojas una por una..."));
        ok = cerrarUnaPorUna();
      }
      Serial.println(ok ? F("Listo.") : F("Una hoja no cerró (revise D4 / D5)."));
      if (ok && sis.estado == Estado::FALLA) cambiarEstado(Estado::ESPERA, millis());
    }
    else Serial.println(F("Comandos: d, m, h, h1, h2, i"));
  }
  return 0;
}

// =============================================================================
// 11. SETUP / LOOP
// =============================================================================

void setup() {
  MCUSR = 0;
  wdt_disable();
  Serial.begin(9600);
  Serial.println(F("\n=== ECOLADRILLOS compuerta v3.0 ==="));

  iniciarBoton(btnVerde);
#if USAR_BOTON_AZUL
  iniciarBoton(btnAzul);
#endif
  pinMode(Pin::TRIG, OUTPUT);
  pinMode(Pin::ECHO, INPUT);
  pinMode(Pin::LED, OUTPUT);
  pinMode(Pin::BUZZER, OUTPUT);
  pinMode(Pin::FC1, INPUT_PULLUP);
  pinMode(Pin::FC2, INPUT_PULLUP);
  digitalWrite(Pin::TRIG, LOW);
  digitalWrite(Pin::BUZZER, LOW);                 // buzzer conectado pero sin uso

  iniciarLcd();
  char f0[17];
  centrado(f0, "ECOLADRILLOS");
  lcdLinea(0, f0);
  lcdLinea(1, "  Iniciando...");

  // Posición desconocida al encender: se cierran las dos hojas, una por una.
  bool compuertaOk = cerrarUnaPorUna();
  Serial.print(F("Compuerta: ")); Serial.println(compuertaOk ? F("cerrada") : F("NO CERRÓ (revise D4 / D5)"));
#if !CIERRE_CON_SWITCH
  Serial.println(F("  (modo sin finales de carrera: cierre por tiempo)"));
#endif

#if USAR_SENSOR_NIVEL
  for (uint8_t k = 0; k < 3; k++) { actualizarNivel(); delay(60); }
#endif

#if USAR_WATCHDOG
  wdt_enable(WDTO_8S);
#endif
  uint32_t ahora = millis();
  if (compuertaOk) cambiarEstado(Estado::ESPERA, ahora);
  else             entrarEnFalla(ahora);
  Serial.println(F("Listo. Escriba 'i' para ver el estado."));
}

void loop() {
  static uint32_t tSonar = 0, tLcd = 0;
  wdt_reset();
  uint32_t ahora = millis();

#if USAR_SENSOR_NIVEL
  if (compuertaEnReposo() && ahora - tSonar >= Cfg::PERIODO_SONAR_MS) { tSonar = ahora; actualizarNivel(); }
#else
  (void)tSonar;
#endif

  char cmd = procesarSerie(ahora);
  bool verde = botonPresionado(btnVerde, ahora) || cmd == 'd';
#if USAR_BOTON_AZUL
  bool azul = botonPresionado(btnAzul, ahora) || cmd == 'm';
#else
  bool azul = cmd == 'm';
#endif

  maquinaEstados(ahora, verde, azul);
  actualizarLed(ahora);
  if (ahora - tLcd >= Cfg::PERIODO_LCD_MS) { tLcd = ahora; actualizarLcd(ahora); }
}

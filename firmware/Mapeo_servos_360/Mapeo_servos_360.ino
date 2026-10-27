/*
  =============================================================================
   MAPEO DE SERVOS DE ROTACIÓN CONTINUA (MG995 360°) — Ecoladrillos  v3
   Sin finales de carrera
  -----------------------------------------------------------------------------
   DEFINICIONES (para toda la máquina):
     CERRADA = plataforma lista para recibir plástico (hoja arriba / horizontal,
               apoyada en su taco).
     ABIERTA = plataforma soltando el plástico a la cesta.

   En esta versión NO se adivina el sentido: usted prueba "+" y "-" y le dice al
   programa cuál de los dos CIERRA. A partir de ahí "a" siempre abre y "c"
   siempre cierra, sin importar cómo esté montado cada servo.

   Conexiones: Servo 1 -> D9   |   Servo 2 -> D10   (fuente externa, GND común)
   Monitor serie: 9600 baudios, "Nueva línea".

   PASO A PASO (para cada servo):
     s1           elegir servo 1 (s2 para el servo 2)
     +   y   -    girar un instante hacia cada lado y mirar qué hace la hoja
     cerrar+      si "+" fue el que CERRÓ la plataforma   (o cerrar- si fue "-")
     c / a        pulsos cortos para cerrar / abrir (c800 = 800 ms, a200 = 200 ms)
                  -> deje la hoja CERRADA
     m            medir apertura: abre; envíe "." cuando quede bien ABIERTA
     n            medir cierre: cierra; envíe "." cuando quede CERRADA (en el taco)
     k30          presión de reposo para sostenerla cerrada (k0 = sin presión)
     p            probar: abre, espera, cierra y queda CERRADA con presión
     inv          invertir el sentido si "a" y "c" quedaron al revés
     b            probar LOS DOS servos juntos, como en el programa real
     r            resumen y líneas para pegar en Ecoladrillos.ino

   PRUEBA DE LA PANTALLA LCD (I2C: SDA = A4, SCL = A5, VCC = 5V, GND = GND)
     g            escribe "Hola mundo" en la LCD
     g texto      escribe su propio texto (hasta 32 letras: 16 por fila)
     gb           borra la pantalla
     Al arrancar se indica si la LCD fue detectada y en qué dirección.

   Otros: "." detiene todo · v150 cambia la velocidad (50-500, defecto 200)
  =============================================================================
*/

#include <Servo.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// La LCD puede venir en la dirección 0x27 o 0x3F: se detecta sola al arrancar.
LiquidCrystal_I2C lcd27(0x27, 16, 2), lcd3F(0x3F, 16, 2);
LiquidCrystal_I2C *lcd = nullptr;

const uint8_t  PIN_SERVO[2] = { 9, 10 };
const uint16_t NEUTRO = 1500;
const uint8_t  MARGEN_CIERRE_PCT = 15;
const uint16_t TIMEOUT_MEDIDA_MS = 8000;

enum Modo : uint8_t { QUIETO, PULSO, MIDE_ABRIR, MIDE_CERRAR, P_ABRIR, P_ESPERA, P_CERRAR, B_ABRIR, B_ESPERA, B_CERRAR };

Servo    servo[2];
uint8_t  sel = 0;
uint16_t vel = 200;
int8_t   sentidoCerrar[2] = { 0, 0 };  // +1 = "+" cierra, -1 = "-" cierra, 0 = sin definir
uint16_t tAbrir[2]  = { 0, 0 };
uint16_t tCerrar[2] = { 0, 0 };
uint8_t  presion[2] = { 0, 0 };        // µs hacia cerrar en reposo
Modo     modo = QUIETO;
uint32_t t0 = 0, duracion = 0;
bool     reposoAlTerminar = false;
bool     hojaLista[2] = { false, false };   // prueba conjunta: hoja ya cerrada

// ---------------------------------------------------------------------------

void pulso(uint8_t i, uint16_t us) {
  if (us == 0) { servo[i].detach(); return; }       // sin pulso = motor apagado
  servo[i].writeMicroseconds(us);
  if (!servo[i].attached()) servo[i].attach(PIN_SERVO[i]);
}

bool definido(uint8_t i) { return sentidoCerrar[i] != 0; }

uint16_t usCerrar(uint8_t i) { return NEUTRO + sentidoCerrar[i] * (int)vel; }
uint16_t usAbrir(uint8_t i)  { return NEUTRO - sentidoCerrar[i] * (int)vel; }
uint16_t usReposo(uint8_t i) { return presion[i] ? NEUTRO + sentidoCerrar[i] * (int)presion[i] : 0; }

void aplicarReposo(uint8_t i) { pulso(i, usReposo(i)); }

void iniciar(Modo m, uint16_t us, uint32_t dur, bool reposo) {
  pulso(sel, us);
  t0 = millis(); duracion = dur; modo = m; reposoAlTerminar = reposo;
}

bool pedirSentido() {
  if (definido(sel)) return true;
  Serial.println(F("Primero pruebe + y - y luego escriba cerrar+ o cerrar-."));
  return false;
}

void estadoServo() {
  Serial.print(F("Servo ")); Serial.print(sel + 1); Serial.print(F(" (pin ")); Serial.print(PIN_SERVO[sel]);
  Serial.print(F(") | cierra con: "));
  if (!definido(sel)) Serial.print(F("--")); else Serial.print(sentidoCerrar[sel] > 0 ? F("+") : F("-"));
  Serial.print(F(" | abrir ")); Serial.print(tAbrir[sel]);
  Serial.print(F(" ms | cerrar ")); Serial.print(tCerrar[sel]);
  Serial.print(F(" ms | presión ")); Serial.print(presion[sel]); Serial.println(F(" µs"));
}

void resumen() {
  Serial.println(F("\n================ RESUMEN ================"));
  uint8_t s0 = sel;
  for (sel = 0; sel < 2; sel++) estadoServo();
  sel = s0;
  for (uint8_t i = 0; i < 2; i++) {
    if (!definido(i) || !tAbrir[i] || !tCerrar[i]) { Serial.println(F("Faltan datos (sentido, m o n de algún servo).")); return; }
  }
  Serial.println(F("\nEn Ecoladrillos.ino (sección COMPUERTA) borre las 4 líneas que empiezan"));
  Serial.println(F("con  constexpr uint16_t S1_  y  S2_  y pegue estas:\n"));
  for (uint8_t i = 0; i < 2; i++) {
    char n = '1' + i;
    Serial.print(F("  constexpr uint16_t S")); Serial.print(n); Serial.print(F("_PULSO_ABRIR = ")); Serial.print(usAbrir(i));
    Serial.print(F(", S")); Serial.print(n); Serial.print(F("_PULSO_CERRAR = ")); Serial.print(usCerrar(i));
    Serial.print(F(", S")); Serial.print(n); Serial.print(F("_PULSO_REPOSO = ")); Serial.print(usReposo(i));
    Serial.println(i == 0 ? F(";   // pin 9") : F(";   // pin 10"));
    Serial.print(F("  constexpr uint16_t S")); Serial.print(n); Serial.print(F("_TIEMPO_ABRIR_MS = ")); Serial.print(tAbrir[i]);
    Serial.print(F(", S")); Serial.print(n); Serial.print(F("_TIEMPO_CERRAR_MS = ")); Serial.print(tCerrar[i]);
    Serial.println(';');
  }
  Serial.println(F("========================================="));
}

void ayuda() {
  Serial.println(F("\ns1/s2 elegir | + - probar sentido | cerrar+ / cerrar- definir | c a pulsos (c800)"));
  Serial.println(F("m medir apertura | n medir cierre | k30 presión | p probar | b probar ambos"));
  Serial.println(F("inv invertir | r resumen | . parar"));
  Serial.println(F("LCD: g = Hola mundo | g texto = su texto | gb = borrar"));
}

uint16_t msDe(const char *txt, uint16_t defecto) { return *txt ? constrain(atoi(txt), 20, 3000) : defecto; }

bool i2cPresente(uint8_t dir) {
  Wire.beginTransmission(dir);
  return Wire.endTransmission() == 0;
}

void iniciarLcd() {
  Wire.begin();
  if (i2cPresente(0x27))      lcd = &lcd27;
  else if (i2cPresente(0x3F)) lcd = &lcd3F;
  if (lcd) {
    lcd->init();
    lcd->backlight();
    Serial.print(F("LCD detectada en 0x")); Serial.println(lcd == &lcd27 ? F("27") : F("3F"));
  } else {
    Serial.println(F("LCD NO detectada: revise SDA=A4, SCL=A5, VCC=5V y GND."));
  }
}

// Escribe un texto en la LCD: los primeros 16 caracteres en la fila 1 y el resto en la fila 2.
void escribirLcd(const char *txt) {
  if (!lcd) { Serial.println(F("No hay LCD detectada (revise conexiones y reinicie).")); return; }
  lcd->clear();
  lcd->setCursor(0, 0);
  for (uint8_t i = 0; txt[i] && i < 32; i++) {
    if (i == 16) lcd->setCursor(0, 1);
    lcd->print(txt[i]);
  }
  Serial.print(F("LCD: \"")); Serial.print(txt); Serial.println(F("\""));
  Serial.println(F("Si la luz prende pero no se ven letras, gire el tornillo azul del módulo (contraste)."));
}

void ejecutar(char *cmd) {
  while (*cmd == ' ') cmd++;

  // Comandos de la LCD: el texto se respeta tal cual (mayúsculas incluidas).
  if (tolower(cmd[0]) == 'g') {
    if (tolower(cmd[1]) == 'b' && cmd[2] == '\0') {
      if (lcd) { lcd->clear(); Serial.println(F("LCD borrada.")); }
      else Serial.println(F("No hay LCD detectada."));
    } else if (cmd[1] == ' ' && cmd[2]) {
      escribirLcd(cmd + 2);
    } else if (cmd[1] == '\0') {
      escribirLcd("Hola mundo");
    } else {
      ayuda();
    }
    return;
  }

  for (char *p = cmd; *p; p++) *p = tolower(*p);

  if (cmd[0] == '.') {
    uint32_t dt = millis() - t0;
    if (modo == MIDE_ABRIR)  { tAbrir[sel] = dt;  pulso(sel, 0);    Serial.print(F("Tiempo de APERTURA guardado: ")); Serial.print(dt); Serial.println(F(" ms")); }
    else if (modo == MIDE_CERRAR) { tCerrar[sel] = dt; aplicarReposo(sel); Serial.print(F("Tiempo de CIERRE guardado: ")); Serial.print(dt); Serial.println(F(" ms")); }
    else { pulso(0, 0); pulso(1, 0); Serial.println(F("Detenido.")); }
    modo = QUIETO;
    return;
  }
  if (modo != QUIETO) { Serial.println(F("Hay un movimiento en curso. Envíe \".\" para detener.")); return; }

  if (cmd[0] == 's' && (cmd[1] == '1' || cmd[1] == '2')) {
    sel = cmd[1] - '1';
    Serial.print(F("Trabajando con el servo ")); Serial.println(sel + 1);
    estadoServo();
  } else if (cmd[0] == '+' || cmd[0] == '-') {
    iniciar(PULSO, NEUTRO + (cmd[0] == '+' ? 1 : -1) * (int)vel, msDe(cmd + 1, 300), false);
  } else if (strncmp(cmd, "cerrar", 6) == 0 && (cmd[6] == '+' || cmd[6] == '-')) {
    sentidoCerrar[sel] = cmd[6] == '+' ? 1 : -1;
    Serial.print(F("Servo ")); Serial.print(sel + 1); Serial.print(F(": CIERRA con ")); Serial.print(cmd[6]);
    Serial.print(F(" y ABRE con ")); Serial.println(cmd[6] == '+' ? '-' : '+');
    Serial.println(F("Ahora: c = cerrar, a = abrir. Deje la hoja CERRADA y mida con m."));
  } else if (strcmp(cmd, "inv") == 0) {
    if (!pedirSentido()) return;
    sentidoCerrar[sel] = -sentidoCerrar[sel];
    Serial.println(F("Sentido invertido: ahora c y a giran al revés que antes."));
  } else if ((cmd[0] == 'c' || cmd[0] == 'a') && (cmd[1] == '\0' || isdigit(cmd[1]))) {
    if (!pedirSentido()) return;
    bool cerrar = cmd[0] == 'c';
    iniciar(PULSO, cerrar ? usCerrar(sel) : usAbrir(sel), msDe(cmd + 1, 300), cerrar);
  } else if (cmd[0] == 'm') {
    if (!pedirSentido()) return;
    iniciar(MIDE_ABRIR, usAbrir(sel), 0, false);
    Serial.println(F("ABRIENDO... envíe \".\" cuando la hoja quede bien ABIERTA."));
  } else if (cmd[0] == 'n') {
    if (!pedirSentido()) return;
    iniciar(MIDE_CERRAR, usCerrar(sel), 0, false);
    Serial.println(F("CERRANDO... envíe \".\" cuando la hoja quede CERRADA (en el taco)."));
  } else if (cmd[0] == 'k') {
    if (!pedirSentido()) return;
    presion[sel] = constrain(atoi(cmd + 1), 0, 150);
    aplicarReposo(sel);
    Serial.print(F("Presión de reposo: ")); Serial.print(presion[sel]); Serial.println(F(" µs hacia CERRAR."));
  } else if (cmd[0] == 'p') {
    if (!pedirSentido()) return;
    if (!tAbrir[sel] || !tCerrar[sel]) { Serial.println(F("Falta medir m y n.")); return; }
    iniciar(P_ABRIR, usAbrir(sel), 0, false);
    Serial.println(F("Prueba: ABRIENDO..."));
  } else if (cmd[0] == 'b') {
    for (uint8_t i = 0; i < 2; i++)
      if (!definido(i) || !tAbrir[i] || !tCerrar[i]) { Serial.println(F("Faltan datos: mapee primero los dos servos (cerrar+/-, m y n).")); return; }
    pulso(0, usAbrir(0)); pulso(1, usAbrir(1));
    t0 = millis(); modo = B_ABRIR;
    Serial.println(F("Prueba conjunta: ABRIENDO las dos hojas..."));
  } else if (cmd[0] == 'v') {
    vel = constrain(atoi(cmd + 1), 50, 500);
    Serial.print(F("Velocidad: ")); Serial.print(vel); Serial.println(F(" µs. Vuelva a medir m y n con esta velocidad."));
  } else if (cmd[0] == 'r') {
    resumen();
  } else {
    ayuda();
  }
}

void actualizarMovimiento() {
  uint32_t dt = millis() - t0;
  switch (modo) {
    case PULSO:
      if (dt >= duracion) { if (reposoAlTerminar) aplicarReposo(sel); else pulso(sel, 0); modo = QUIETO; }
      break;
    case MIDE_ABRIR:
    case MIDE_CERRAR:
      if (dt >= TIMEOUT_MEDIDA_MS) { pulso(sel, 0); modo = QUIETO; Serial.println(F("Medición cancelada (más de 8 s).")); }
      break;
    case P_ABRIR:
      if (dt >= tAbrir[sel]) { pulso(sel, 0); t0 = millis(); modo = P_ESPERA; Serial.println(F("ABIERTA. Esperando...")); }
      break;
    case P_ESPERA:
      if (dt >= 1500) { pulso(sel, usCerrar(sel)); t0 = millis(); modo = P_CERRAR; Serial.println(F("CERRANDO...")); }
      break;
    case P_CERRAR:
      if (dt >= (uint32_t)tCerrar[sel] * (100 + MARGEN_CIERRE_PCT) / 100) {
        aplicarReposo(sel); modo = QUIETO;
        Serial.println(F("Fin de la prueba: la hoja debe quedar CERRADA. Si quedó abierta, escriba inv y repita m y n."));
      }
      break;
    case B_ABRIR: {                      // cada hoja se detiene con su propio tiempo
      bool abriendo = false;
      for (uint8_t i = 0; i < 2; i++) {
        if (dt >= tAbrir[i]) pulso(i, 0); else abriendo = true;
      }
      if (!abriendo) { t0 = millis(); modo = B_ESPERA; Serial.println(F("ABIERTAS. Esperando...")); }
      break;
    }
    case B_ESPERA:
      if (dt >= 1500) {
        pulso(0, usCerrar(0)); pulso(1, usCerrar(1));
        hojaLista[0] = hojaLista[1] = false;
        t0 = millis(); modo = B_CERRAR; Serial.println(F("CERRANDO las dos hojas..."));
      }
      break;
    case B_CERRAR: {
      bool cerrando = false;
      for (uint8_t i = 0; i < 2; i++) {
        uint32_t tc = (uint32_t)tCerrar[i] * (100 + MARGEN_CIERRE_PCT) / 100;
        if (dt < tc) cerrando = true;
        else if (!hojaLista[i]) { aplicarReposo(i); hojaLista[i] = true; }
      }
      if (!cerrando) {
        modo = QUIETO;
        Serial.println(F("Fin: las dos hojas deben quedar CERRADAS y sostenidas."));
      }
      break;
    }
    default:
      break;
  }
}

void setup() {
  Serial.begin(9600);
  Serial.println(F("\n=== MAPEO SERVOS 360 v3 - Ecoladrillos ==="));
  Serial.println(F("CERRADA = lista para recibir plástico | ABIERTA = suelta el plástico"));
  Serial.println(F("Los servos arrancan apagados. Trabajando con el servo 1 (pin 9)."));
  iniciarLcd();
  ayuda();
}

void loop() {
  static char linea[40];
  static uint8_t n = 0;
  while (Serial.available()) {
    char ch = Serial.read();
    if (ch == '\n' || ch == '\r') { if (n) { linea[n] = '\0'; n = 0; ejecutar(linea); } }
    else if (n < sizeof(linea) - 1) linea[n++] = ch;
  }
  actualizarMovimiento();
}

const QR = {
  generate(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    const text = `ReciclajeApp - Comprobante\nCorreo: ${data.email}\nPeso: ${data.weight}\nPuntos sesion: +${data.sessionPoints}\nPuntos totales: ${data.totalPoints}`;

    new QRCode(container, {
      text: text,
      width: 220,
      height: 220,
      colorDark: '#166534',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M
    });
  }
};

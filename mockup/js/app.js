const App = {
  currentEmail: '',

  init() {
    Shop.render('shop-grid');
    this.bindEvents();
    this.checkHash();
  },

  bindEvents() {
    document.querySelectorAll('[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
    });

    document.getElementById('recycle-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.registerRecycle();
    });

    document.getElementById('lookup-btn').addEventListener('click', () => {
      this.lookupBalance();
    });

    document.getElementById('lookup-email').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.lookupBalance();
    });
  },

  checkHash() {
    const hash = window.location.hash.replace('#', '');
    if (['register', 'balance', 'shop'].includes(hash)) {
      this.switchTab(hash);
    }
  },

  switchTab(tab) {
    document.querySelectorAll('[data-tab]').forEach(btn => {
      btn.classList.toggle('tab-active', btn.dataset.tab === tab);
    });

    document.querySelectorAll('.tab-content').forEach(sec => {
      sec.classList.toggle('section-hidden', sec.id !== `section-${tab}`);
    });

    window.location.hash = tab;

    if (tab === 'balance' && this.currentEmail) {
      document.getElementById('lookup-email').value = this.currentEmail;
      this.lookupBalance();
    }
  },

  registerRecycle() {
    const email = document.getElementById('reg-email').value.trim();
    const weight = document.getElementById('reg-weight').value;
    const unit = document.getElementById('reg-unit').value;

    if (!email || !this.isValidEmail(email)) {
      this.toast('Ingresa un correo electrónico válido', 'error');
      return;
    }
    if (!weight || parseFloat(weight) <= 0) {
      this.toast('Ingresa un peso válido mayor a 0', 'error');
      return;
    }

    const mg = Points.toMilligrams(weight, unit);
    const sessionPoints = Points.calculate(weight, unit);

    if (sessionPoints === 0) {
      this.toast('El peso es muy bajo. Mínimo 500 mg para obtener 1 punto', 'error');
      return;
    }

    this.currentEmail = email.toLowerCase().trim();
    const user = DB.getOrCreateUser(this.currentEmail);
    DB.addPoints(this.currentEmail, mg, weight, unit, sessionPoints);
    const updated = DB.getUser(this.currentEmail);

    document.getElementById('result-section').classList.remove('section-hidden');
    document.getElementById('res-email').textContent = this.currentEmail;
    document.getElementById('res-weight').textContent = Points.formatWeight(mg);
    document.getElementById('res-session').textContent = '+' + sessionPoints;
    document.getElementById('res-total').textContent = updated.points;

    QR.generate('qr-canvas', {
      email: this.currentEmail,
      weight: Points.formatWeight(mg),
      sessionPoints: sessionPoints,
      totalPoints: updated.points
    });

    this.toast(`+${sessionPoints} puntos registrados para ${this.currentEmail}`, 'success');
  },

  lookupBalance() {
    const email = document.getElementById('lookup-email').value.trim();
    if (!email || !this.isValidEmail(email)) {
      this.toast('Ingresa un correo válido para buscar', 'error');
      return;
    }

    this.currentEmail = email.toLowerCase().trim();
    const user = DB.getUser(this.currentEmail);

    const resultDiv = document.getElementById('balance-result');
    const historyDiv = document.getElementById('balance-history');

    if (!user) {
      resultDiv.innerHTML = `
        <div class="text-center py-8">
          <p class="text-gray-500 text-lg">No se encontró ninguna cuenta con ese correo.</p>
          <p class="text-gray-400 text-sm mt-1">Registra tu primer reciclaje en la pestaña "Registrar".</p>
        </div>`;
      historyDiv.innerHTML = '';
      return;
    }

    resultDiv.innerHTML = `
      <div class="text-center">
        <p class="text-gray-500 mb-1">Puntos acumulados de</p>
        <p class="font-bold text-gray-800 text-sm mb-3">${this.currentEmail}</p>
        <div class="inline-block bg-gradient-to-r from-green-500 to-green-700 text-white text-5xl font-extrabold py-4 px-8 rounded-2xl animate-pulse-green">
          ${user.points}
        </div>
        <p class="text-gray-400 text-xs mt-2">puntos disponibles</p>
      </div>`;

    if (user.history.length > 0) {
      historyDiv.innerHTML = `
        <h4 class="font-bold text-gray-700 mt-6 mb-3">Historial de entregas</h4>
        <div class="space-y-2 max-h-64 overflow-y-auto">
          ${user.history.map(h => `
            <div class="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
              <div>
                <span class="font-semibold text-gray-700">${Points.formatWeight(h.weight_mg)}</span>
                <span class="text-gray-400 text-xs ml-2">${new Date(h.date).toLocaleDateString('es-CO')}</span>
              </div>
              <span class="text-green-600 font-bold">+${h.points_earned} pts</span>
            </div>
          `).join('')}
        </div>`;
    } else {
      historyDiv.innerHTML = '';
    }
  },

  redeemProduct(productId) {
    if (!this.currentEmail) {
      this.toast('Primero busca tu correo en "Mi Saldo" o registra un reciclaje', 'error');
      this.switchTab('balance');
      return;
    }

    const product = Shop.products.find(p => p.id === productId);
    if (!product) return;

    const user = DB.getUser(this.currentEmail);
    if (!user) {
      this.toast('Usuario no encontrado', 'error');
      return;
    }

    if (user.points < product.cost) {
      this.toast(`Necesitas ${product.cost} pts pero solo tienes ${user.points} pts`, 'error');
      return;
    }

    DB.redeemPoints(this.currentEmail, product.cost);
    const updated = DB.getUser(this.currentEmail);

    this.toast(`Canjeaste "${product.name}" por ${product.cost} pts. Saldo: ${updated.points} pts`, 'success');

    const balanceTotal = document.getElementById('balance-points-total');
    if (balanceTotal) balanceTotal.textContent = updated.points;
  },

  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  toast(message, type = 'success') {
    const existing = document.querySelectorAll('.toast');
    existing.forEach(t => t.remove());

    const toast = document.createElement('div');
    const bg = type === 'success'
      ? 'bg-green-600'
      : 'bg-red-500';
    const icon = type === 'success' ? '&#10004;' : '&#10006;';

    toast.className = `toast ${bg} text-white px-5 py-4 rounded-xl shadow-lg flex items-center gap-3`;
    toast.innerHTML = `<span class="text-xl">${icon}</span><span class="font-semibold text-sm">${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 3200);
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());

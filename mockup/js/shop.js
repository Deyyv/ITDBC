const Shop = {
  products: [
    { id: 1, name: 'Caramelo',          emoji: '🍬', cost: 10,  desc: 'Caramelo de regalo' },
    { id: 2, name: 'Chicle',            emoji: '🫧', cost: 5,   desc: 'Paquete de chicles' },
    { id: 3, name: 'Paleta',            emoji: '🍭', cost: 15,  desc: 'Paleta sabor fruta' },
    { id: 4, name: 'Papitas',           emoji: '🍟', cost: 30,  desc: 'Bolsa pequeña de papas' },
    { id: 5, name: 'Galletas',          emoji: '🍪', cost: 25,  desc: 'Paquete de galletas' },
    { id: 6, name: 'Jugo en caja',      emoji: '🧃', cost: 35,  desc: 'Jugo personal' },
    { id: 7, name: 'Gaseosa',           emoji: '🥤', cost: 50,  desc: 'Gaseosa personal' },
    { id: 8, name: 'Chocolate',         emoji: '🍫', cost: 40,  desc: 'Barra de chocolate' },
  ],

  render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = this.products.map(p => `
      <div class="card-eco bg-white rounded-2xl shadow-md overflow-hidden flex flex-col">
        <div class="bg-gradient-to-br from-green-50 to-yellow-50 p-6 text-center">
          <span class="text-6xl">${p.emoji}</span>
        </div>
        <div class="p-4 flex flex-col flex-1">
          <h3 class="font-bold text-lg text-gray-800">${p.name}</h3>
          <p class="text-gray-500 text-sm mb-3 flex-1">${p.desc}</p>
          <div class="flex items-center justify-between">
            <span class="points-badge">${p.cost} pts</span>
            <button onclick="App.redeemProduct(${p.id})"
              class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-xl text-sm transition-colors">
              Canjear
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }
};

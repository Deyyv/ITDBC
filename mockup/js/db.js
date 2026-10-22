const DB_KEY = 'reciclaje_users';

const DB = {
  getAll() {
    const data = localStorage.getItem(DB_KEY);
    return data ? JSON.parse(data) : {};
  },

  saveAll(users) {
    localStorage.setItem(DB_KEY, JSON.stringify(users));
  },

  getUser(email) {
    const users = this.getAll();
    return users[email.toLowerCase().trim()] || null;
  },

  getOrCreateUser(email) {
    const normalized = email.toLowerCase().trim();
    const users = this.getAll();
    if (!users[normalized]) {
      users[normalized] = {
        email: normalized,
        points: 0,
        history: []
      };
      this.saveAll(users);
    }
    return users[normalized];
  },

  addPoints(email, weightMg, weightOriginal, unit, pointsEarned) {
    const users = this.getAll();
    const normalized = email.toLowerCase().trim();
    if (!users[normalized]) return null;

    users[normalized].points += pointsEarned;
    users[normalized].history.unshift({
      date: new Date().toISOString(),
      weight_mg: weightMg,
      weight_original: weightOriginal,
      unit: unit,
      points_earned: pointsEarned
    });
    this.saveAll(users);
    return users[normalized];
  },

  redeemPoints(email, cost) {
    const users = this.getAll();
    const normalized = email.toLowerCase().trim();
    if (!users[normalized] || users[normalized].points < cost) return null;

    users[normalized].points -= cost;
    this.saveAll(users);
    return users[normalized];
  }
};

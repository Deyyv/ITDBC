const DB_KEY = 'reciclaje_users'

const newShareToken = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 't-' + Math.random().toString(36).slice(2) + Date.now().toString(36)

const withToken = (user) => {
  if (user && !user.shareToken) user.shareToken = newShareToken()
  return user
}

const read = () => {
  const data = localStorage.getItem(DB_KEY)
  return data ? JSON.parse(data) : {}
}

const write = (users) => {
  localStorage.setItem(DB_KEY, JSON.stringify(users))
}

const formatWeightLabel = (mg) => {
  if (mg >= 1000000) return (mg / 1000000).toFixed(2) + ' kg'
  if (mg >= 1000) return (mg / 1000).toFixed(2) + ' g'
  return mg.toFixed(0) + ' mg'
}

export const DB = {
  getAll: () => read(),

  getUser(email) {
    const users = read()
    return users[email.toLowerCase().trim()] || null
  },

  getOrCreateUser(email) {
    const normalized = email.toLowerCase().trim()
    const users = read()
    if (!users[normalized]) {
      users[normalized] = {
        email: normalized,
        points: 0,
        history: [],
        coupons: [],
        lastDelivery: null,
        shareToken: newShareToken(),
      }
      write(users)
    }
    return users[normalized]
  },

  addPoints(email, weightMg, weightOriginal, unit, pointsEarned) {
    const users = read()
    const normalized = email.toLowerCase().trim()
    if (!users[normalized]) return null

    withToken(users[normalized])
    users[normalized].points += pointsEarned
    users[normalized].lastDelivery = {
      mg: weightMg,
      label: formatWeightLabel(weightMg),
      date: new Date().toISOString(),
    }
    users[normalized].history.unshift({
      date: new Date().toISOString(),
      weight_mg: weightMg,
      weight_original: weightOriginal,
      unit,
      points_earned: pointsEarned,
    })
    write(users)
    return users[normalized]
  },

  addCoupon(email, coupon) {
    const users = read()
    const normalized = email.toLowerCase().trim()
    if (!users[normalized]) return null
    withToken(users[normalized])
    users[normalized].coupons = users[normalized].coupons || []
    users[normalized].coupons.unshift(coupon)
    write(users)
    return users[normalized]
  },
}
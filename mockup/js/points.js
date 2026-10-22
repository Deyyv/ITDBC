const Points = {
  MG_PER_POINT: 500,

  toMilligrams(value, unit) {
    const v = parseFloat(value);
    if (isNaN(v) || v <= 0) return 0;
    switch (unit) {
      case 'mg': return v;
      case 'g':  return v * 1000;
      case 'kg': return v * 1000000;
      default:   return 0;
    }
  },

  calculate(value, unit) {
    const mg = this.toMilligrams(value, unit);
    return Math.floor(mg / this.MG_PER_POINT);
  },

  formatWeight(mg) {
    if (mg >= 1000000) return (mg / 1000000).toFixed(2) + ' kg';
    if (mg >= 1000) return (mg / 1000).toFixed(2) + ' g';
    return mg.toFixed(0) + ' mg';
  }
};

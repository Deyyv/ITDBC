/**
 * Impact figures of the impact panel. They are demonstration estimates, not measurements.
 */

/** Trees spared per kilogram of recycled plastic (rough equivalence used by the panel). */
export const TREE_KG_FACTOR = 0.05

/** Trees spared by recycling `plasticKg`, rounded to one decimal. */
export function treesSaved(plasticKg: number): number {
  return Math.round(Math.max(0, plasticKg) * TREE_KG_FACTOR * 10) / 10
}

/** Progress towards a goal as a whole percentage, capped to 0-100 (0 when there is no goal). */
export function goalProgressPct(value: number, goal: number): number {
  if (!(goal > 0)) return 0
  return Math.min(100, Math.max(0, Math.round((value / goal) * 100)))
}

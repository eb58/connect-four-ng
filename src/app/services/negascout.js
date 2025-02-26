let negascout = (state, depth, maxDepth, alpha, beta) => {
  if (state.isMill) return -MAXVAL + depth
  if (MOVES.every(m => state.heightCols[m] >= DIM.NROW)) return 0
  if (depth === maxDepth) return computeScoreOfNode(state);
  let [lo, hi] = [alpha, beta];
  for (const m of MOVES) if (state.heightCols[m] < DIM.NROW) {
    let t = -negascout(doMove(m, cloneState(state)), depth + 1, maxDepth, -hi, -lo)
    if (lo < t && t < beta && j > 0 && depth < maxDepth - 1)
      t = -negascout(doMove(m, cloneState(state)), depth + 1, maxDepth, -beta, -t)
    if (t > lo) lo = t
    if (lo >= beta) return lo
    hi = lo + 1
  }
  return lo;
}

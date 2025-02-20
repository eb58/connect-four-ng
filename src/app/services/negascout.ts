// let negascout = (state: STATE, depth: number, maxDepth: number, alpha: number, beta: number): number => {
//   if (state.isMill) return -MAXVAL + depth
//   if (state.cntActiveWinningRows <= 0) return 0
//   if (depth === maxDepth) return computeScoreOfNode(state);
//   let [lo, hi] = [alpha, beta];
//   const moves = generateMoves(state)
//   for (let j = 0; j < moves.length; j++) {
//     let t = -negascout(doMove(moves[j], cloneState(state)), depth + 1, maxDepth, -hi, -lo)
//     if (lo < t && t < beta && j > 0 && depth < maxDepth - 1)
//       t = -negascout(doMove(moves[j], cloneState(state)), depth + 1, maxDepth, -beta, -t)
//     if (t > lo) lo = t
//     if (lo >= beta) return lo
//     hi = lo + 1
//   }
//   return lo;
// }

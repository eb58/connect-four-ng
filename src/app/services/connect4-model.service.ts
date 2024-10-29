import { Injectable } from '@angular/core';

const range = (n: number) => [...Array(n).keys()]
const abs = (x: number) => x < 0 ? -x : x
const sign = (x: number) => x < 0 ? -1 : 1
const feedX = (x: any, f: any) => f(x);
const reshape = (m: any, dim: number) => m.reduce((acc: any, x: any, i: number) => (i % dim ? acc[acc.length - 1].push(x) : acc.push([x])) && acc, []);

const cache = (insertCondition = (_: any) => true, c: any = {}) => ({
  add: (key: any, val: any) => (insertCondition(val) && (c[key] = val), val),
  get: (key: any) => c[key]
})
const memoize = (f: any, hash: any, c = cache()) =>
  (...args: any[]) =>
    feedX(hash(...args), (h: any) => c.get(h) !== undefined ? c.get(h) : c.add(h, f(...args)))

export const DIM = { NCOL: 7, NROW: 6 };

const computeWinningRows = (r: number, c: number, dr: number, dc: number): number[][] => { // dr = delta row,  dc = delta col
  const row = [];
  while (r >= 0 && r < DIM.NROW && c >= 0 && c < DIM.NCOL && row.length < 4) { row.push(c + DIM.NCOL * r); c += dc; r += dr; }
  return row.length < 4 ? [] : [row];
}

// winning rows - length should be 69 for DIM (7x6)
export const winningRows: number[][] = range(DIM.NROW).reduce((acc: any, r: number) => range(DIM.NCOL).reduce((acc: any, c: number) => [
  ...acc,
  ...computeWinningRows(r, c, 0, 1),
  ...computeWinningRows(r, c, 1, 1),
  ...computeWinningRows(r, c, 1, 0),
  ...computeWinningRows(r, c, -1, 1)
], acc), [])

// list of indices on allWinningRows for each field of board
export const winningRowsForFields = Object.freeze(range(DIM.NCOL * DIM.NROW).map(i => winningRows.reduce((acc: number[], r, j) => r.includes(i) ? [...acc, j] : acc, [])))

const cmpByScore = (a: MoveType, b: MoveType) => b.score - a.score
const cloneState = (s: STATE) => ({
  ...s,
  board: [...s.board],
  heightCols: [...s.heightCols],
  winningRowsCounter: [...s.winningRowsCounter],
})

export type STATE = {
  cntMoves: number;
  hash: string;
  board: number[];  // state of board
  heightCols: number[];        // height of columns
  winningRowsCounter: number[];// counter of winning rows > 0 for AI; < 0 for human
  aiTurn: boolean              // who's turn is it
  isMill: boolean,             // we have four in a row!
}

export type MoveType = {
  move: number;
  score: number;
}

const ORDER = Object.freeze([3, 4, 2, 5, 1, 6, 0])
const MAXVAL = 1000000
const NFIELDS = DIM.NCOL * DIM.NROW

const generateMoves = (state: STATE): number[] => ORDER.filter(c => state.heightCols[c] < DIM.NROW);

const doMove = (c: number, mstate: STATE) => {
  const idxBoard = c + DIM.NCOL * mstate.heightCols[c]

  // update state of winning rows attached to idxBoard
  winningRowsForFields[idxBoard].forEach(i => {
    if (mstate.winningRowsCounter[i] === -99999) return;
    if (mstate.winningRowsCounter[i] != 0 && sign(mstate.winningRowsCounter[i]) !== (mstate.aiTurn ? 1 : -1)) { mstate.winningRowsCounter[i] = -99999; return }
    mstate.winningRowsCounter[i] += mstate.aiTurn ? 1 : -1;
    mstate.isMill = mstate.isMill || abs(mstate.winningRowsCounter[i]) >= 4
  })
  mstate.cntMoves++;
  mstate.heightCols[c]++;
  mstate.aiTurn = !mstate.aiTurn;
  mstate.board[idxBoard] = mstate.aiTurn ? 1 : -1;
  mstate.hash = mstate.board.join('')
  return mstate;
}

const computeScoreOfNodeForAI = (state: STATE) => state.winningRowsCounter.reduce((res, cnt) => res + (cnt === -99999 ? 0 : cnt ** 3), 0)

let negamax = (state: STATE, maxDepth: number, actDepth: number, alpha: number, beta: number): number => { // evaluate state recursively using negamax algorithm! -> wikipedia
  if (state.isMill) return -MAXVAL + actDepth
  if (state.cntMoves >= NFIELDS) return 0
  if (actDepth === maxDepth) return -computeScoreOfNodeForAI(state);
  let score = -MAXVAL;
  for (const m of generateMoves(state)) {
    score = Math.max(score, -negamax(doMove(m, cloneState(state)), maxDepth, actDepth + 1, -beta, -alpha));
    alpha = Math.max(alpha, score)
    if (alpha >= beta)
      break;
  }
  return score;
}

negamax = memoize(negamax, (s: STATE) => s.hash, cache(x => abs(x) > MAXVAL - 50));

// function pvs(node, depth, α, β, color)
// if node is a terminal node or depth = 0
//     return color × the heuristic value of node, 0
// for each child_index, child of enumerate(node): (*cycle over nodes and their indices*)
//     if child is first child
//         score, _ := pvs(child, depth-1, -β, -α, -color)
//         score *= -1
//     else
//         score, _ := pvs(child, depth-1, -α-1, -α, -color)       (* search with a null window *)
//         score *= -1
//         if α < score < β                                      (* if it failed high,
//             score, _ := pvs(child, depth-1, -β, -score, -color)        do a full re-search *)
//             score *= -1
//     α := max(α, score)
//     if α ≥ β
//         break                                            (* beta cut-off *)
// return α, node_index

let negascout = (state: STATE, maxDepth: number, actDepth: number, alpha: number, beta: number): number => { // evaluate state recursively using negamax algorithm! -> wikipedia

  if (state.isMill) return -MAXVAL + actDepth
  if (state.cntMoves >= NFIELDS) return 0
  if (actDepth === maxDepth) return -computeScoreOfNodeForAI(state);

  const moves = generateMoves(state)
  for (let i = 0; i < moves.length; i++) {
    let score;
    if (i === 0) {
      score = -negascout(doMove(moves[i], cloneState(state)), maxDepth, actDepth + 1, -beta, -alpha)
    } else {
      score = -negascout(doMove(moves[i], cloneState(state)), maxDepth, actDepth + 1, -alpha - 1, -alpha)
      if (alpha < score && score < beta) score = -negascout(doMove(moves[i], cloneState(state)), maxDepth, actDepth + 1, -beta, -alpha)

      alpha = Math.max(alpha, score)
      if (alpha >= beta)
        break;
    }
  }
  return alpha;
}
// negascout = memoize(negascout, (s: STATE) => s.hash, cache(x => abs(x) > MAXVAL - 50));

const minmax = negamax

@Injectable({ providedIn: 'root' })
export class ConnectFourModelService {
  MAXVAL = MAXVAL;
  origState: STATE = { // state that is used for evaluating 
    cntMoves: 0,
    board: range(DIM.NCOL * DIM.NROW).map(() => 0),
    heightCols: range(DIM.NCOL).map(() => 0), // height of cols = [0, 0, 0, ..., 0];
    winningRowsCounter: winningRows.map(() => 0),
    aiTurn: false,
    isMill: false,
    hash: '',
  };

  state: STATE;
  moves: number[] = []

  constructor() {
    this.state = cloneState(this.origState);
  }

  init = () => {
    this.state = cloneState(this.origState);
    this.moves = [];
  }

  checkSimpleSolutions = (moves: number[], lev: number) => {
    const scoresOfMoves = moves.map(move => ({ move, score: -negamax(doMove(move, cloneState(this.state)), lev, 0, -MAXVAL, +MAXVAL) })).toSorted(cmpByScore)
    if (scoresOfMoves.some(m => m.score > MAXVAL - 50)) return scoresOfMoves // there are moves to win!
    if (scoresOfMoves.every(m => m.score < -MAXVAL + 50)) return scoresOfMoves // all moves lead to disaster 
    if (scoresOfMoves.filter(x => x.score > -MAXVAL + 50).length === 1) return scoresOfMoves; // there is only one move left!
    // console.log( `LEV:${lev} MOVES:${moves.join(',')}`)
    return undefined;
  }

  calcScoresOfMoves = (maxDepth: number): MoveType[] => {
    if (!this.state.aiTurn) throw Error("It must be the AI's turn!")
    const moves = generateMoves(this.state);
    return (
      [1, 2, 3].reduce((acc: any, n) => acc || this.checkSimpleSolutions(moves, n), undefined) ||
      moves.map(move => ({ move, score: -negamax(doMove(move, cloneState(this.state)), maxDepth, 0, -MAXVAL, +MAXVAL) })).toSorted(cmpByScore)
    )
  }

  generateMoves = (state: STATE): number[] => ORDER.filter(c => state.heightCols[c] < DIM.NROW);
  isMill = (): boolean => this.state.isMill
  isDraw = (): boolean => generateMoves(this.state).length === 0 && !this.state.isMill
  doMove = (m: number) => { doMove(m, this.state); this.moves.push(m); }
  doMoves = (moves: number[]): void => moves.forEach(v => this.doMove(v));
  dumpBoard = dumpBoard
}

// just for debugging
const toSymb = (x: any) => ` ${[, 'C', '_', 'H'][x + 1]} `
const dumpBoard = (board: number[]): string => '\n' + reshape(board.map(toSymb), 7).reverse().map((x: any) => x.join('')).join('\n')
const dumpCacheItem = (s: string) => reshape(s.split('').map(toSymb), 7).reverse().map((x: any) => x.join('')).join('\n')
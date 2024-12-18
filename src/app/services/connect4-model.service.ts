import {Injectable} from '@angular/core';

const range = (n: number) => [...Array(n).keys()]
const sign = (x: number) => x < 0 ? -1 : 1
const feedX = (x: any, f: any) => f(x)
const zip = (xs: any, ys: any, f: any) => xs.map((x: any, i: number) => (f ? f(x, ys[i]) : [x, ys[i]]));

const cache = (insertCondition = (_: any) => true, c: any = {}) => ({
  add: (key: any, val: any) => (insertCondition(val) && (c[key] = val), val),
  get: (key: any) => c[key]
})
const memoize = (f: any, hash: any, c = cache()) =>
  (...args: any[]) =>
    feedX(hash(...args), (h: any) => c.get(h) !== undefined ? c.get(h) : c.add(h, f(...args)))

////////////////////////////////////////////////////////////////////////////////////////////////////////

type STATE = {
  cntMoves: number;
  heightCols: number[];         // height of columns
  winningRowsCounter: number[]; // counter for every winning row  ( > 0 for AI; < 0 for human)
  aiTurn: boolean;              // who's turn is it
  isMill: boolean;              // we have four in a row!
  cntActiveWinningRows: number;
  allowedMoves: number[];
  // hash: number,
}

type SearchController = {
  nodes: number,
  start: number,
  stop: boolean,
  maxThinkingDuration: number,
  depth: number,
  duration: number,
  bestMoves: MoveType[],
  state: STATE,
}

type MoveType = {
  move: number;
  score: number;
}

type WinningRow = {
  row: number[],
  val: number
}

////////////////////////////////////////////////////////////////////////////////////////////////////////

const MAXVAL = 1000000
const NEUTRAL = 77777
export const DIM = {NCOL: 7, NROW: 6};

const computeWinningRows = (r: number, c: number, dr: number, dc: number): WinningRow[] => { // dr = delta row,  dc = delta col
  const row = [];
  const startRow = DIM.NROW - r;
  while (r >= 0 && r < DIM.NROW && c >= 0 && c < DIM.NCOL && row.length < 4) {
    row.push(c + DIM.NCOL * r);
    c += dc;
    r += dr;
  }
  return row.length < 4 ? [] : [{row, val: (dc === 0) ? 1 : (dr === 0 ? 8 * startRow : 4 * startRow)}];
}

// winning rows - length should be 69 for DIM (7x6)
export const winningRows: WinningRow[] = range(DIM.NROW).reduce((acc: any, r: number) => range(DIM.NCOL).reduce((acc: any, c: number) => [
  ...acc,
  ...computeWinningRows(r, c, 0, 1),
  ...computeWinningRows(r, c, 1, 1),
  ...computeWinningRows(r, c, 1, 0),
  ...computeWinningRows(r, c, -1, 1)
], acc), [])

// list of indices on allWinningRows for each field of board
export const winningRowsForFields = range(DIM.NCOL * DIM.NROW)
  .map(i => winningRows.reduce((acc: number[], wr: WinningRow, j: number) => wr.row.includes(i) ? [...acc, j] : acc, []))

const cmpByScore = (a: MoveType, b: MoveType) => b.score - a.score
const cloneState = (s: STATE) => ({
  ...s,
  heightCols: [...s.heightCols],
  winningRowsCounter: [...s.winningRowsCounter],
})
// const RAND_8 = () => Math.floor((Math.random() * 255) + 1)
// const RAND_32 = () => RAND_8() << 23 | RAND_8() << 16 | RAND_8() << 8 | RAND_8();
// const sideKey = RAND_32();
// const pieceKeys = range(DIM.NCOL * DIM.NROW).map(() => RAND_32());
// const HASH_PCE = (state: STATE, sq: number) => state.hash ^= pieceKeys[sq];
// const HASH_SIDE = (state: STATE) => state.hash ^= sideKey;

const state: STATE = { // state that is used for evaluating
  cntMoves: 0,
  heightCols: range(DIM.NCOL).map(() => 0), // height of columns = [0, 0, 0, ..., 0];
  winningRowsCounter: winningRows.map(() => 0),
  aiTurn: false,
  isMill: false,
  cntActiveWinningRows: winningRows.length,
  allowedMoves: [3, 4, 2, 5, 1, 6, 0],
  // hash: 0
};

const searchController: SearchController = {
  nodes: 0,
  start: Date.now(),
  stop: false,
  maxThinkingDuration: 0,
  depth: 0,
  duration: 0,
  bestMoves: [],
  state: cloneState(state)
}

const doMove = (c: number, state: STATE) => {
  const idxBoard = c + DIM.NCOL * state.heightCols[c]
  winningRowsForFields[idxBoard].forEach(i => { // update state of winning rows attached to idxBoard
    if (state.winningRowsCounter[i] === NEUTRAL) return;
    if (state.winningRowsCounter[i] != 0 && sign(state.winningRowsCounter[i]) !== (state.aiTurn ? 1 : -1)) {
      state.winningRowsCounter[i] = NEUTRAL; // to mark winning row as neutral
      state.cntActiveWinningRows--
    } else {
      state.winningRowsCounter[i] += state.aiTurn ? 1 : -1;
      state.isMill = state.isMill || Math.abs(state.winningRowsCounter[i]) >= 4
    }
  })
  state.cntMoves++;
  state.heightCols[c]++;
  state.aiTurn = !state.aiTurn;
  // HASH_PCE(state, idxBoard)
  // HASH_SIDE(state)
  return state;
}

const generateMoves = (state: STATE): number[] => state.allowedMoves = state.allowedMoves.filter(c => state.heightCols[c] < DIM.NROW);
const computeScoreOfNodeForAI = (state: STATE) => state.winningRowsCounter.reduce((res, cnt, idc) => res + (cnt === NEUTRAL ? 0 : cnt * winningRows[idc].val), 0)
const checkTimeIsUp = () => searchController.stop = searchController.maxThinkingDuration !== 0 && Date.now() - searchController.start > searchController.maxThinkingDuration

let negamax = (state: STATE, depth: number, maxDepth: number, alpha: number, beta: number): number => {
  if ((++searchController.nodes & 4095) === 0) checkTimeIsUp();
  if (searchController.stop) return 0;

  if (state.isMill) return -MAXVAL + depth
  if (state.cntActiveWinningRows <= 0) return 0
  if (depth === maxDepth) return -computeScoreOfNodeForAI(state);
  for (const m of generateMoves(state)) {
    const score = -negamax(doMove(m, cloneState(state)), depth + 1, maxDepth, -beta, -alpha)
    if (score > alpha) alpha = score;
    if (alpha >= beta)
      return alpha;
  }
  return alpha;
}

//negamax = memoize(negamax, (s: STATE, depth: number) => s.hash + depth, cache(x => Math.abs(x) >= MAXVAL));

@Injectable({providedIn: 'root'})
export class ConnectFourModelService {
  DIM = DIM;
  MAXVAL = MAXVAL;
  state = state;

  constructor() {
    this.init()
  }

  init = () => this.state = cloneState(state);
  doMove = (m: number) => doMove(m, this.state);
  doMoves = (moves: number[]) => moves.forEach(v => this.doMove(v));
  colHeight = (c: number) => this.state.heightCols[c]

  searchBestMove = (maxDepth = 6, maxThinkingDuration = 1000): SearchController => {
    searchController.nodes = 0
    searchController.start = Date.now();
    searchController.stop = false;
    searchController.maxThinkingDuration = maxThinkingDuration
    searchController.state = this.state

    let moves = generateMoves(this.state);
    for (let depth = 1; depth <= maxDepth; depth += 1) {
      const scores = moves.map(move => -negamax(doMove(move, cloneState(this.state)), 0, depth, -MAXVAL, +MAXVAL))// .map(x => x === -0 ? 0 : x)
      if (searchController.stop) break;
      const bestMoves = zip(moves, scores, (move: number, score: number) => ({move, score})).sort(cmpByScore)
      searchController.depth = depth
      searchController.duration = Date.now() - searchController.start;
      searchController.bestMoves = bestMoves
      if (bestMoves.some((m: MoveType) => m.score > MAXVAL - 50) ||  // there is a move to win!
        bestMoves.every((m: MoveType) => m.score < -MAXVAL + 50) || // all moves lead to disaster
        bestMoves.filter((m: MoveType) => m.score > -MAXVAL + 50).length === 1) break // all moves lead to disaster
      moves = bestMoves.map((m: MoveType) => m.move);
    }
    return searchController;
  }

  calcScoresOfMoves = (maxDepth = 50, maxThinkingDuration = 1000): SearchController => {
    if (!this.state.aiTurn) throw Error("It must be the AI's turn!")
    return this.searchBestMove(maxDepth, maxThinkingDuration)
  }
}

// just for debugging
const f = (x: number) => x === 0 ? '_' : x < 0 ? 'H' : 'C'
const reshape = (m: any, dim: number) => m.reduce((acc: any, x: any, i: number) => (i % dim ? acc[acc.length - 1].push(x) : acc.push([x])) && acc, []);
export const dumpBoard = (board: number[]): string => '\n' + reshape(board.map(x => ` ${f(x)} `), 7).reverse().map((x: any) => x.join('')).join('\n')

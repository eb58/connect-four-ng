import {Injectable} from '@angular/core';

type SearchController = {
  nodes: number,
  start: number,
  stop: boolean,
  maxThinkingDuration: number,
  depth: number,
  duration: number,
  bestMoves: any[]
}

const searchController: SearchController = {
  nodes: 0,
  start: Date.now(),
  stop: false,
  maxThinkingDuration: 0,
  depth: 0,
  duration: 0,
  bestMoves: []
}

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

export const DIM = {NCOL: 7, NROW: 6};

const computeWinningRows = (r: number, c: number, dr: number, dc: number): number[][] => { // dr = delta row,  dc = delta col
  const row = [];
  while (r >= 0 && r < DIM.NROW && c >= 0 && c < DIM.NCOL && row.length < 4) {
    row.push(c + DIM.NCOL * r);
    c += dc;
    r += dr;
  }
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
  heightCols: [...s.heightCols],
  winningRowsCounter: [...s.winningRowsCounter],
})

type STATE = {
  cntMoves: number;
  heightCols: number[];         // height of columns
  winningRowsCounter: number[]; // counter of winning rows > 0 for AI; < 0 for human
  aiTurn: boolean;              // who's turn is it
  isMill: boolean;              // we have four in a row!
}

type MoveType = {
  move: number;
  score: number;
}

const ORDER = Object.freeze([3, 4, 2, 5, 1, 6, 0])
const MAXVAL = 1000000
const NEUTRAL = 77777
const NFIELDS = DIM.NCOL * DIM.NROW

const generateMoves = (state: STATE): number[] => ORDER.filter(c => state.heightCols[c] < DIM.NROW);

const doMove = (c: number, state: STATE) => {
  const idxBoard = c + DIM.NCOL * state.heightCols[c]
  winningRowsForFields[idxBoard].forEach(i => { // update state of winning rows attached to idxBoard
    if (state.winningRowsCounter[i] === NEUTRAL) return;
    if (state.winningRowsCounter[i] != 0 && sign(state.winningRowsCounter[i]) !== (state.aiTurn ? 1 : -1)) {
      state.winningRowsCounter[i] = NEUTRAL; // to mark winning row as neutral
    } else {
      state.winningRowsCounter[i] += state.aiTurn ? 1 : -1;
      state.isMill = state.isMill || Math.abs(state.winningRowsCounter[i]) >= 4
    }
  })
  state.cntMoves++;
  state.heightCols[c]++;
  state.aiTurn = !state.aiTurn;
  return state;
}

const computeScoreOfNodeForAI = (state: STATE) => state.winningRowsCounter.reduce((res, cnt) => res + (cnt === NEUTRAL ? 0 : cnt ** 2), 0)

const checkTimeIsUp = () => searchController.stop = searchController.maxThinkingDuration !== 0 && Date.now() - searchController.start > searchController.maxThinkingDuration

let negamax = (state: STATE, depth: number, maxDepth: number, alpha: number, beta: number): number => {
  if ((++searchController.nodes & 4095) === 0) checkTimeIsUp();
  if (searchController.stop) return 0;

  // evaluate state recursively using negamax algorithm! -> wikipedia
  if (state.isMill) return -MAXVAL
  if (state.cntMoves >= NFIELDS) return 0
  if (depth === maxDepth) return (state.aiTurn ? 1 : -1) * computeScoreOfNodeForAI(state);
  for (const m of generateMoves(state)) {
    const score = -negamax(doMove(m, cloneState(state)), depth + 1, maxDepth, -beta, -alpha)
    if (score > alpha) alpha = score;
    if (alpha >= beta)
      return alpha;
  }
  return alpha;
}

// negamax = memoize(negamax, (s: STATE, depth: number) => s.hash + depth, cache(x => Math.abs(x) >= MAXVAL));

@Injectable({providedIn: 'root'})
export class ConnectFourModelService {
  MAXVAL = MAXVAL;
  origState: STATE = { // state that is used for evaluating
    cntMoves: 0,
    heightCols: range(DIM.NCOL).map(() => 0), // height of columns = [0, 0, 0, ..., 0];
    winningRowsCounter: winningRows.map(() => 0),
    aiTurn: false,
    isMill: false,
  };

  state: STATE = cloneState(this.origState);

  constructor() {
    this.init()
  }

  init = () => this.state = cloneState(this.origState);
  doMove = (m: number) => doMove(m, this.state);
  doMoves = (moves: number[]) => moves.forEach(v => this.doMove(v));

  searchBestMove = (maxThinkingDuration = 1000): SearchController => {
    searchController.nodes = 0
    searchController.start = Date.now();
    searchController.stop = false;
    searchController.maxThinkingDuration = maxThinkingDuration

    let moves = generateMoves(this.state);
    for (let depth = 2; depth <= 40; depth += 2) {
      const scores = moves.map(move => -negamax(doMove(move, cloneState(this.state)), 0, depth, -MAXVAL, +MAXVAL))// .map(x => x === -0 ? 0 : x)
      if (searchController.stop) break;
      const bestMoves = zip(moves, scores, (move: number, score: number) => ({move, score})).sort(cmpByScore)
      searchController.depth = depth
      searchController.duration = Date.now() - searchController.start;
      searchController.bestMoves = bestMoves
      if (bestMoves.some((m: MoveType) => m.score > MAXVAL - 50)) break;  // there is a move to win!
      if (bestMoves.every((m: MoveType) => m.score < -MAXVAL + 50)) break // all moves lead to disaster
      if (bestMoves.filter((m: MoveType) => m.score > -MAXVAL + 50).length === 1) break // all moves lead to disaster
      moves = bestMoves.map((x: any) => x.move);
    }
    return searchController;
  }

  calcScoresOfMoves = (thinkingTime = 1000): SearchController => {
    if (!this.state.aiTurn) throw Error("It must be the AI's turn!")
    return this.searchBestMove(thinkingTime)
  }
  colHeight = (c: number) => this.state.heightCols[c]
}


// just for debugging
const f = (x: number) => x === 0 ? '_' : x < 0 ? 'H' : 'C'
const reshape = (m: any, dim: number) => m.reduce((acc: any, x: any, i: number) => (i % dim ? acc[acc.length - 1].push(x) : acc.push([x])) && acc, []);
export const dumpBoard = (board: number[]): string => '\n' + reshape(board.map(x => ` ${f(x)} `), 7).reverse().map((x: any) => x.join('')).join('\n')

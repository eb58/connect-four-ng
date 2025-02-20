import {Injectable} from '@angular/core';

const range = (n: number) => [...Array(n).keys()]
const feedX = (x: any, f: any) => f(x)

const cache = (insertCondition = (_: any) => true, c: any = {}) => ({
  add: (key: any, val: any) => (insertCondition(val) && (c[key] = val), val),
  get: (key: any) => c[key]
})
const memoize = (f: any, hash: any, c = cache()) =>
  (...args: any[]) =>
    feedX(hash(...args), (h: number) => c.get(h) !== undefined ? c.get(h) : c.add(h, f(...args)))

const decorator = (f: any, decorator: any) => (...args: any[]) => decorator() ? f(...args) : 0;

////////////////////////////////////////////////////////////////////////////////////////////////////////

export type Player = -1 | 1

type STATE = {
  cntMoves: number;
  heightCols: number[];         // height of columns
  winningRowsCounterRed: number[]; // counter for every winning row for human
  winningRowsCounterBlue: number[]; // counter for every winning row  for AI;
  side: Player;                 // who's turn is it 1 -> 'blue' -> AI player -1 -> 'red' -> human player
  isMill: boolean;              // we have four in a row!
  cntActiveWinningRows: number;
  hash: number,
}

export type SearchInfo = {
  nodes: number,
  stopAt: number,
  depth: number,
  bestMoves: MoveType[],
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
export const DIM = {NCOL: 7, NROW: 6};

const rand8 = (): number => Math.floor((Math.random() * 255) + 1)
const rand32 = (): number => rand8() << 23 | rand8() << 16 | rand8() << 8 | rand8();
const depthKeys = range(42).map(() => rand32())
const sideKeys = [rand32(), rand32()]
const pieceKeys = range(2 * DIM.NCOL * DIM.NROW).map(() => rand32())
const hashPiece = (state: STATE, sq: number) => {
  const c = state.side === 1 ? 1 : 2
  state.hash ^= pieceKeys[sq * c]
  state.hash ^= sideKeys[c];
}

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
export const winningRowsForFields = range(DIM.NCOL * DIM.NROW).map(i => winningRows.reduce((acc: number[], wr: WinningRow, j: number) => wr.row.includes(i) ? [...acc, j] : acc, []))

const cmpByScore = (a: MoveType, b: MoveType) => b.score - a.score
const cloneState = (s: STATE) => ({
  ...s,
  heightCols: [...s.heightCols],
  winningRowsCounterRed: [...s.winningRowsCounterRed],
  winningRowsCounterBlue: [...s.winningRowsCounterBlue],
})

const MOVES = [3, 4, 2, 5, 1, 6, 0];

const state: STATE = { // state that is used for evaluating
  cntMoves: 0,
  heightCols: range(DIM.NCOL).map(() => 0), // height of columns = [0, 0, 0, ..., 0];
  winningRowsCounterRed: winningRows.map(() => 0),
  winningRowsCounterBlue: winningRows.map(() => 0),
  side: -1,
  isMill: false,
  cntActiveWinningRows: winningRows.length,
  hash: 0,
};

const searchInfo: SearchInfo = {
  nodes: 0,
  stopAt: 0,
  depth: 0,
  bestMoves: [],
}

const timeOut = () => Date.now() >= searchInfo.stopAt

const doMove = (c: number, state: STATE) => {
  const idxBoard = c + DIM.NCOL * state.heightCols[c]
  hashPiece(state, idxBoard)
  winningRowsForFields[idxBoard].forEach((i: number) => { // update state of winning rows attached to idxBoard
    if (state.winningRowsCounterRed[i] > 0 && state.winningRowsCounterBlue[i] > 0) return;
    const cnt = state.side === 1 ? state.winningRowsCounterBlue : state.winningRowsCounterRed;
    cnt[i]++
    state.isMill ||= cnt[i] >= 4
    if (state.winningRowsCounterRed[i] > 0 && state.winningRowsCounterBlue[i] > 0) state.cntActiveWinningRows--
  })
  state.cntMoves++;
  state.heightCols[c]++;
  state.side = state.side === 1 ? -1 : 1;
  return state;
}

const generateMoves = (state: STATE): number[] => MOVES.filter(c => state.heightCols[c] < DIM.NROW);
const computeScoreOfNode = (state: STATE) => state.side * winningRows.reduce((res, wr, i) => res + (state.winningRowsCounterRed[i] > 0 && state.winningRowsCounterBlue[i] > 0 ? 0 : (state.winningRowsCounterBlue[i] - state.winningRowsCounterRed[i]) * wr.val), 0)

let negamax = (state: STATE, depth: number, maxDepth: number, alpha: number, beta: number): number => {
  if (state.isMill) return -MAXVAL + depth
  if (state.cntActiveWinningRows <= 0) return 0
  if (depth === maxDepth) return computeScoreOfNode(state);
  for (const m of generateMoves(state)) {
    const score = -negamax(doMove(m, cloneState(state)), depth + 1, maxDepth, -beta, -alpha)
    if (score > alpha) alpha = score;
    if (alpha >= beta) return alpha;
  }
  return alpha;
}
negamax = decorator(negamax, () => (++searchInfo.nodes & 4095) && !timeOut())
negamax = memoize(negamax, (s: STATE, depth: number) => s.hash ^ depthKeys[depth], cache(x => Math.abs(x) >= MAXVAL - 50));

@Injectable({providedIn: 'root'})
export class ConnectFourModelService {
  MAXVAL = MAXVAL;
  state = state;

  constructor() {
    this.init()
  }

  init = (): STATE => this.state = cloneState(state);
  doMove = (m: number): STATE => doMove(m, this.state);
  isAllowedMove = (c: number): boolean => this.state.heightCols[c] < DIM.NROW

  searchBestMove = (maxThinkingDuration = 1000, maxDepth = 40): SearchInfo => {
    searchInfo.nodes = 0
    searchInfo.stopAt = Date.now() + maxThinkingDuration;

    for (let depth = 2; depth <= maxDepth; depth += 2) {
      const moves = generateMoves(this.state);
      const bestMoves: MoveType[] = []
      for (let i = 0; i < moves.length; i++) {
        const score = -negamax(doMove(moves[i], cloneState(this.state)), 0, depth, -MAXVAL, +MAXVAL)
        bestMoves.push({move: moves[i], score});
        if (score > MAXVAL - 50) {
          searchInfo.depth = depth
          searchInfo.bestMoves = bestMoves.sort(cmpByScore)
          // console.log( `DEPTH:${depth}`, bestMoves.reduce((acc:string, m:MoveType)=>acc+ `${m.move}:${m.score} `,''))
          return searchInfo
        }
      }
      if (timeOut()) break;
      searchInfo.depth = depth
      searchInfo.bestMoves = bestMoves.sort(cmpByScore)
      // console.log(`DEPTH:${depth}`, bestMoves.reduce((acc: string, m: MoveType) => acc + `${m.move}:${m.score} `, ''))
      if (bestMoves.every((m: MoveType) => m.score < -MAXVAL + 50)                // all moves lead to disaster
        || bestMoves.filter((m: MoveType) => m.score > -MAXVAL + 50).length === 1 // all moves but one lead to disaster
      ) break;
    }
    return searchInfo;
  }

}

// just for debugging
const f = (x: number) => x === 0 ? '_' : x < 0 ? 'R' : 'B'
const reshape = (m: any, dim: number) => m.reduce((acc: any, x: any, i: number) => (i % dim ? acc[acc.length - 1].push(x) : acc.push([x])) && acc, []);
export const dumpBoard = (board: number[]): string => '\n' + reshape(board.map(x => ` ${f(x)} `), 7).reverse().map((x: any) => x.join('')).join('\n')

import { Injectable } from '@angular/core';

export const range = (n: number) => [...Array(n).keys()]
const feedX = (x: any, f: any) => f(x);
const reshape = (m: any, dim: number) => m.reduce((acc: any, x: any, i: number) => (i % dim ? acc[acc.length - 1].push(x) : acc.push([x])) && acc, []);

const simpleCache = (insertCondition = (_: any) => true, c: any = {}) => ({
  add: (key: any, val: any) => (insertCondition(val) && (c[key] = val), val),
  get: (key: any) => c[key]
})
const memoize = (f: any, hash: any, c = simpleCache()) =>
  (...args: any[]) =>
    feedX(hash(...args), (h: any) => c.get(h) !== undefined ? c.get(h) : c.add(h, f(...args)))

export enum FieldOccupiedType { empty, human, ai, neutral };
export const DIM = { NCOL: 7, NROW: 6 };
export type WinningRow = {
  cnt: number,                  // count of tiles in winning row 
  occupiedBy: FieldOccupiedType // who is occupying winning row 
}

// let allWinningRows: WinningRow[] = []; // winning rows - length should be 69 for DIM (7x6)
// let winningRowsForFields: number[][] = []; // list of indices on allWinningRows for each field of board

const computeWinningRows = (r: number, c: number, dr: number, dc: number): number[][] => { // dr = delta row,  dc = delta col
  const row = [];
  while (r >= 0 && r < DIM.NROW && c >= 0 && c < DIM.NCOL && row.length < 4) { row.push(c + DIM.NCOL * r); c += dc; r += dr; }
  return row.length < 4 ? [] : [row];
}

const winningRows: number[][] = range(DIM.NROW).reduce((acc: any, r: number) => range(DIM.NCOL).reduce((acc: any, c: number) => [
  ...acc,
  ...computeWinningRows(r, c, 0, 1),
  ...computeWinningRows(r, c, 1, 1),
  ...computeWinningRows(r, c, 1, 0),
  ...computeWinningRows(r, c, -1, 1)
], acc), [])
export const winningRowsForFields = Object.freeze(range(DIM.NCOL * DIM.NROW).map(i => winningRows.reduce((acc: number[], r, j) => r.includes(i) ? [...acc, j] : acc, [])))
export const allWinningRows = Object.freeze(winningRows.map(() => ({ cnt: 0, occupiedBy: FieldOccupiedType.empty })))

const cmpByScore = (a: MoveType, b: MoveType) => b.score - a.score
const cloneState = (s: STATE) => ({
  ...s,
  moves: [...s.moves],
  board: [...s.board],
  heightCols: [...s.heightCols],
  winningRows: s.winningRows.map((wr: WinningRow) => ({ ...wr }))
})

export type STATE = {
  hash: string;
  moves: number[],            // moves - list of columns (0, 1, ... , 6) 
  board: FieldOccupiedType[]; // state of board
  heightCols: number[];       // height of columns
  winningRows: WinningRow[];  // state of winning rows
  aiTurn: boolean             // who's turn is it
  isMill: boolean,            // we have four in a row!
}

export type MoveType = {
  move: number;
  score: number;
}

const ORDER = Object.freeze([3, 4, 2, 5, 1, 6, 0])
const MAXVAL = 1000000
const NFIELDS = DIM.NCOL * DIM.NROW

const generateMoves = (state: STATE): number[] => ORDER.filter(c => state.heightCols[c] < DIM.NROW);

const transitionGR = (i: FieldOccupiedType, o: FieldOccupiedType): FieldOccupiedType => { // i in / o out
  if (o === FieldOccupiedType.empty) return i;
  if (i === o) return i; // or o
  return FieldOccupiedType.neutral;
}

const doMove = (c: number, mstate: STATE) => {
  const idxBoard = c + DIM.NCOL * mstate.heightCols[c]
  // update state of winning rows attached to idxBoard
  winningRowsForFields[idxBoard].forEach(i => {
    const wrState = mstate.winningRows[i];
    const occupy = mstate.aiTurn ? FieldOccupiedType.ai : FieldOccupiedType.human;
    wrState.occupiedBy = transitionGR(occupy, wrState.occupiedBy);
    wrState.cnt += (wrState.occupiedBy !== FieldOccupiedType.neutral) ? 1 : 0;
    mstate.isMill ||= wrState.cnt >= 4;
  });
  mstate.moves.push(c);
  mstate.board[idxBoard] = mstate.aiTurn ? FieldOccupiedType.ai : FieldOccupiedType.human;;
  mstate.heightCols[c]++;
  mstate.aiTurn = !mstate.aiTurn;
  mstate.hash = mstate.board.join('')
  return mstate;
}

const computeScoreOfNodeForAI = (state: STATE) =>
  (state.aiTurn ? 1 : -1) * state.winningRows.reduce((res, wr) => {
    if (wr.occupiedBy === FieldOccupiedType.ai) return res + wr.cnt
    if (wr.occupiedBy === FieldOccupiedType.human) return res - wr.cnt
    return res
  }, 0)

let negamax = (state: STATE, maxDepth: number, actDepth: number, alpha: number, beta: number): number => { // evaluate state recursively using negamax algorithm! -> wikipedia
  if (state.isMill) return -MAXVAL + actDepth
  if (state.moves.length >= NFIELDS) return 0
  if (actDepth === maxDepth) return computeScoreOfNodeForAI(state);
  let score = -MAXVAL;
  for (const m of generateMoves(state)) {
    score = Math.max(score, -negamax(doMove(m, cloneState(state)), maxDepth, actDepth + 1, -beta, -alpha));
    alpha = Math.max(alpha, score)
    if (alpha >= beta)
      break;
  }
  return score;
}

negamax = memoize(negamax, (s: STATE) => s.hash, simpleCache(x => Math.abs(x) > MAXVAL - 50));

@Injectable({ providedIn: 'root' })
export class ConnectFourModelService {
  MAXVAL = MAXVAL;
  origState: STATE = { // state that is used for evaluating 
    board: range(DIM.NCOL * DIM.NROW).map(() => 0),
    heightCols: range(DIM.NCOL).map(() => 0), // height of cols = [0, 0, 0, ..., 0];
    winningRows: allWinningRows.map(r => ({ ...r })),
    aiTurn: false,
    isMill: false,
    hash: '',
    moves: [],
  };

  state: STATE;
  cntNodesEvaluated = 0;

  constructor() {
    this.state = cloneState(this.origState);
  }

  init = () => this.state = cloneState(this.origState);

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
  doMove = (m: number) => doMove(m, this.state)
  doMoves = (moves: number[]): void => moves.forEach(v => this.doMove(v));
  dumpBoard = dumpBoard
}

// just for debugging
const toSymb = (x: any) => ` ${['_', 'H', 'C',][x]} `
const dumpBoard = (state: STATE): string => '\n' + reshape(state.board.map(toSymb), 7).reverse().map((x: any) => x.join('')).join('\n')
const dumpCacheItem = (s: string) => reshape(s.split('').map(toSymb), 7).reverse().map((x: any) => x.join('')).join('\n')

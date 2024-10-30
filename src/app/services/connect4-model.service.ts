import {Injectable} from '@angular/core';

const range = (n: number) => [...Array(n).keys()]
const sign = (x: number) => x < 0 ? -1 : 1
// const cache = (insertCondition = (_: any) => true, c: any = {}) => ({
//   add: (key: any, val: any) => (insertCondition(val) && (c[key] = val), val),
//   get: (key: any) => c[key]
// })
// const memoize = (f: any, hash: any, c = cache()) =>
//   (...args: any[]) =>
//     feedX(hash(...args), (h: any) => c.get(h) !== undefined ? c.get(h) : c.add(h, f(...args)))

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
const NFIELDS = DIM.NCOL * DIM.NROW

const generateMoves = (state: STATE): number[] => ORDER.filter(c => state.heightCols[c] < DIM.NROW);

const doMove = (c: number, state: STATE) => {
  const idxBoard = c + DIM.NCOL * state.heightCols[c]
  winningRowsForFields[idxBoard].forEach(i => { // update state of winning rows attached to idxBoard
    if (state.winningRowsCounter[i] === -99999) return;
    if (state.winningRowsCounter[i] != 0 && sign(state.winningRowsCounter[i]) !== (state.aiTurn ? 1 : -1)) {
      state.winningRowsCounter[i] = -99999; // to mark winning row as neutral
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

const computeScoreOfNodeForAI = (state: STATE) => state.winningRowsCounter.reduce((res, cnt) => res + (cnt === -99999 ? 0 : cnt ** 3), 0)

let minimax = (state: STATE, maxDepth: number, actDepth: number, alpha: number, beta: number): number => { // evaluate state recursively using negamax algorithm! -> wikipedia
  if (state.isMill) return -MAXVAL + actDepth
  if (state.cntMoves >= NFIELDS) return 0
  if (actDepth === maxDepth) return -computeScoreOfNodeForAI(state);
  return generateMoves(state).reduce((score, m) => Math.max(score, -minimax(doMove(m, cloneState(state)), maxDepth, actDepth + 1, -beta, -alpha)), -MAXVAL);
}

let negamax = (state: STATE, maxDepth: number, actDepth: number, alpha: number, beta: number): number => { // evaluate state recursively using negamax algorithm! -> wikipedia
  if (state.isMill) return -MAXVAL + actDepth
  if (state.cntMoves >= NFIELDS) return 0
  if (actDepth === maxDepth) return -computeScoreOfNodeForAI(state);
  let score = alpha;
  for (const m of generateMoves(state)) {
    score = Math.max(score, -negamax(doMove(m, cloneState(state)), maxDepth, actDepth + 1, -beta, -alpha));
    alpha = Math.max(alpha, score)
    if (alpha >= beta)
      break;
  }
  return score;
}

let negascout = (state: STATE, maxDepth: number, actDepth: number, alpha: number, beta: number): number => { // https://www.chessprogramming.org/NegaScout
  if (state.isMill) return -MAXVAL + actDepth
  if (state.cntMoves >= NFIELDS) return 0
  if (actDepth === maxDepth) return -computeScoreOfNodeForAI(state);

  let b = beta;
  const moves = generateMoves(state)
  for (let i = 0; i < moves.length; i++) {
    let score = -negascout(doMove(moves[i], cloneState(state)), maxDepth, actDepth + 1, -b, -alpha)
    if (alpha < score && score < beta && i > 1)
      score = -negascout(doMove(moves[i], cloneState(state)), maxDepth, actDepth + 1, -beta, -alpha)
    alpha = Math.max(alpha, score)
    if (alpha >= beta)
      break;
    b = alpha + 1;
  }
  return alpha;
}

const minmax = negascout

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
  moves: number[] = []
  board: string[] = []

  constructor() {
    this.init()
  }

  init = () => {
    this.state = cloneState(this.origState);
    this.moves = [];
    this.board = range(NFIELDS).map(() => ' ');
  }

  isMill = (): boolean => this.state.isMill
  isDraw = (): boolean => this.moves.length === NFIELDS && !this.state.isMill
  doMove = (m: number) => {
    this.board[m + DIM.NCOL * (this.state.heightCols[m])] = this.state.aiTurn ? 'C' : 'H';
    this.moves.push(m);
    doMove(m, this.state);
  }
  doMoves = (moves: number[]): void => moves.forEach(v => this.doMove(v));

  checkSimpleSolutions = (moves: number[], lev: number) => {
    const scoresOfMoves = moves.map(move => ({
      move,
      score: -minmax(doMove(move, cloneState(this.state)), lev, 0, -MAXVAL, +MAXVAL)
    })).toSorted(cmpByScore)
    if (scoresOfMoves.some(m => m.score > MAXVAL - 50)) return scoresOfMoves // there are moves to win!
    if (scoresOfMoves.every(m => m.score < -MAXVAL + 50)) return scoresOfMoves // all moves lead to disaster
    // console.log( `LEV:${lev} MOVES:${moves.join(',')}`)
    return undefined;
  }

  calcScoresOfMoves = (maxDepth: number): MoveType[] => {
    if (!this.state.aiTurn) throw Error("It must be the AI's turn!")
    const moves = generateMoves(this.state);
    return (
      [1, 2, 3, 4].reduce((acc: any, n) => acc || this.checkSimpleSolutions(moves, n), undefined) ||
      moves.map(move => ({
        move,
        score: -minmax(doMove(move, cloneState(this.state)), maxDepth, 0, -MAXVAL, +MAXVAL)
      })).toSorted(cmpByScore)
    )
  }

}

// just for debugging
// const toSymb = (x: any) => ` ${['H', '_', 'C'][x + 1]} `
// export const dumpBoard = (board: number[]): string => '\n' + reshape(board.map(toSymb), 7).reverse().map((x: any) => x.join('')).join('\n')
// const dumpCacheItem = (s: string) => reshape(s.split('').map(toSymb), 7).reverse().map((x: any) => x.join('')).join('\n')

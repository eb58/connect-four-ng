import {Injectable} from '@angular/core';

const range = (n: number) => [...Array(n).keys()]
const sign = (x: number) => x < 0 ? -1 : 1
const feedX = (x: any, f: any) => f(x)

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
  board: [...s.board],
})

type STATE = {
  cntMoves: number;
  heightCols: number[];         // height of columns
  winningRowsCounter: number[]; // counter of winning rows > 0 for AI; < 0 for human
  aiTurn: boolean;              // who's turn is it
  isMill: boolean;              // we have four in a row!
  board: number[];
  hash: string;
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
  state.board[idxBoard] = state.aiTurn ? 1 : -1;
  state.hash = (state.aiTurn ? 'C' : 'H') + state.board.join()
  state.aiTurn = !state.aiTurn;
  return state;
}

const computeScoreOfNodeForAI = (state: STATE) => (state.aiTurn ? 1 : -1) * state.winningRowsCounter.reduce((res, cnt) => res + (cnt === NEUTRAL ? 0 : cnt ** 3), 0)

let alphabeta = (state: STATE, depth: number, maxDepth: number, alpha: number, beta: number, isMaximizingPlayer: boolean): number => {
  // minimax with alpha beta pruning -> wikipedia
  if (state.isMill) return state.aiTurn ? -MAXVAL : MAXVAL
  if (state.cntMoves >= NFIELDS) return 0
  if (depth === maxDepth) return state.winningRowsCounter.reduce((res, cnt) => res + (cnt === NEUTRAL ? 0 : cnt ** 3), 0)

  let [maxValue, minValue] = [-MAXVAL, MAXVAL];
  for (const m of generateMoves(state)) {
    const newState = doMove(m, cloneState(state))
    const val = alphabeta(newState, depth + 1, maxDepth, alpha, beta, !isMaximizingPlayer);
    if (isMaximizingPlayer) {
      if (val > maxValue) maxValue = val;
      if (val > alpha) alpha = val;
    } else {
      if (val < minValue) minValue = val;
      if (val < beta) beta = val;
    }
    if (alpha >= beta)
      break;
  }
  return isMaximizingPlayer ? maxValue : minValue;
}
alphabeta = memoize(alphabeta, (state: STATE, depth: number) => state.hash + '|' + depth, cache(x => Math.abs(x) >= MAXVAL));

let negamaxSimple = (state: STATE, depth: number, maxDepth: number, alpha: number, beta: number): number => { // evaluate state recursively using negamax algorithm! -> wikipedia
  if (state.isMill) return -MAXVAL
  if (state.cntMoves >= NFIELDS) return 0
  if (depth === maxDepth) return computeScoreOfNodeForAI(state);
  return generateMoves(state).reduce((score, m) => Math.max(score, -negamaxSimple(doMove(m, cloneState(state)), depth + 1, maxDepth, 0, 0)), -MAXVAL);
}
// negamaxSimple = memoize(negamaxSimple, (s: STATE) => s.hash, cache(x => Math.abs(x) >= MAXVAL));

let negamax = (state: STATE, depth: number, maxDepth: number, alpha: number, beta: number, isMaximizingPlayer: boolean): number => { // evaluate state recursively using negamax algorithm! -> wikipedia
  if (state.isMill) return -MAXVAL
  if (state.cntMoves >= NFIELDS) return 0
  if (depth === maxDepth) return computeScoreOfNodeForAI(state);
  let score = -MAXVAL;
  for (const m of generateMoves(state)) {
    score = Math.max(score, -negamax(doMove(m, cloneState(state)), depth + 1, maxDepth, -beta, -alpha, !isMaximizingPlayer));
    alpha = Math.max(alpha, score)
    if (alpha >= beta)
      break;
  }
  return score;
}
negamax = memoize(negamax, (s: STATE, depth: number) => s.hash + depth, cache(x => Math.abs(x) >= MAXVAL));

let negascout = (state: STATE, depth: number, maxDepth: number, alpha: number, beta: number, isMaximizingPlayer: boolean): number => {
  // https://www.chessprogramming.org/NegaScout
  if (state.isMill) return -MAXVAL
  if (state.cntMoves >= NFIELDS) return 0
  if (depth >= maxDepth) return computeScoreOfNodeForAI(state);

  let b = beta;
  const moves = generateMoves(state)
  for (let i = 0; i < moves.length; i++) {
    let score = -negascout(doMove(moves[i], cloneState(state)), depth + 1, maxDepth, -b, -alpha, isMaximizingPlayer)
    if (alpha < score && score < beta && i > 1)
      score = -negascout(doMove(moves[i], cloneState(state)), depth + 1, maxDepth, -beta, -alpha, isMaximizingPlayer)
    alpha = Math.max(alpha, score)
    if (alpha >= beta)
      break;
    b = alpha + 1;
  }
  return alpha;
}
negascout = memoize(negascout, (s: STATE, depth: number) => s.hash + '|' + depth, cache(x => Math.abs(x) >= MAXVAL));

@Injectable({providedIn: 'root'})
export class ConnectFourModelService {
  MAXVAL = MAXVAL;
  origState: STATE = { // state that is used for evaluating
    cntMoves: 0,
    heightCols: range(DIM.NCOL).map(() => 0), // height of columns = [0, 0, 0, ..., 0];
    winningRowsCounter: winningRows.map(() => 0),
    aiTurn: false,
    isMill: false,
    board: range(DIM.NCOL * DIM.NROW).map(() => 0),
    hash: ''
  };

  state: STATE = cloneState(this.origState);

  constructor() {
    this.init()
  }

  init = () => this.state = cloneState(this.origState);
  doMove = (m: number) => doMove(m, this.state);
  doMoves = (moves: number[]) => moves.forEach(v => this.doMove(v));

  checkSimpleSolutions = (moves: number[], maxDepth: number, minmaxAlgorithm: any): MoveType[] | undefined => {
    const scoresOfMoves = moves.map(move => ({
      move,
      score: minmaxAlgorithm(doMove(move, cloneState(this.state)), 0, maxDepth, -MAXVAL, +MAXVAL, false)
    }))
    if (scoresOfMoves.some(m => m.score > MAXVAL - 50)) return scoresOfMoves // there is a move to win!
    if (scoresOfMoves.every(m => m.score < -MAXVAL + 50)) return scoresOfMoves // all moves lead to disaster
    if (scoresOfMoves.filter(m => m.score > -MAXVAL + 50).length === 1) return scoresOfMoves // just one move does not lead to disaster
    // console.log( `LEV:${depth} MOVES:${moves.join(',')}`)
    return undefined;
  }

  calcScoresOfMoves =
    (maxDepth: number,
     minmaxAlgorithm = (state: STATE, depth: number, maxDepth: number, alpha: number, beta: number, isMaximizingPlayer: boolean) => -negamax(state, depth, maxDepth, alpha, beta, isMaximizingPlayer)
    ): MoveType[] => {
      if (!this.state.aiTurn) throw Error("It must be the AI's turn!")
      const moves = generateMoves(this.state);
      return (
        range(Math.min(4, maxDepth - 2)).reduce((acc: any, maxDepth) => acc || this.checkSimpleSolutions(moves, maxDepth, minmaxAlgorithm), undefined) ||
        moves.map(move => ({
          move,
          score: minmaxAlgorithm(doMove(move, cloneState(this.state)), 0, maxDepth, -MAXVAL, +MAXVAL, false)
        }))
      ).toSorted(cmpByScore)
    }
}

// just for debugging
const f = (x: number) => x === 0 ? '_' : x < 0 ? 'H' : 'C'
const reshape = (m: any, dim: number) => m.reduce((acc: any, x: any, i: number) => (i % dim ? acc[acc.length - 1].push(x) : acc.push([x])) && acc, []);
export const dumpBoard = (board: number[]): string => '\n' + reshape(board.map(x => ` ${f(x)} `), 7).reverse().map((x: any) => x.join('')).join('\n')

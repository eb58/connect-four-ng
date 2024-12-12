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

const computeScoreOfNodeForAI = (state: STATE) => state.winningRowsCounter.reduce((res, cnt) => res + (cnt === NEUTRAL ? 0 : cnt ** 3), 0)
const checkTimeIsUp = () => searchController.stop = searchController.maxThinkingDuration !== 0 && Date.now() - searchController.start > searchController.maxThinkingDuration

let alphabeta = (state: STATE, depth: number, maxDepth: number, alpha: number, beta: number, isMaximizingPlayer: boolean): number => {
  if ((++searchController.nodes & 1023) === 0) checkTimeIsUp();
  if (searchController.stop) return 0;

  // minimax with alpha beta pruning -> wikipedia
  if (state.isMill) return state.aiTurn ? -MAXVAL : MAXVAL
  if (state.cntMoves >= NFIELDS) return 0
  if (depth === maxDepth) return computeScoreOfNodeForAI(state)

  for (const m of generateMoves(state)) {
    const newState = doMove(m, cloneState(state))
    const score = alphabeta(newState, depth + 1, maxDepth, alpha, beta, !isMaximizingPlayer);
    if (isMaximizingPlayer) {
      if (score > alpha) alpha = score;
    } else {
      if (score < beta) beta = score;
    }
    if (alpha >= beta)
      break;
  }
  return isMaximizingPlayer ? alpha : beta;
}
// alphabeta = memoize(alphabeta, (state: STATE, depth: number, maxDepth: number) => state.hash + '|' + depth + '|' + maxDepth, cache(x => Math.abs(x) >= MAXVAL - 50));

let negamax = (state: STATE, depth: number, maxDepth: number, alpha: number, beta: number): number => {
  if ((++searchController.nodes & 1023) === 0) checkTimeIsUp();
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

  albe = (state: STATE, depth: number, maxDepth: number, alpha: number, beta: number) => alphabeta(state, depth, maxDepth, alpha, beta, false)
  nmax = (state: STATE, depth: number, maxDepth: number, alpha: number, beta: number) => -negamax(state, depth, maxDepth, alpha, beta)

  calcScoresOfMoves = (maxDepth: number, minmaxAlgorithm = this.albe): MoveType[] => {
    if (!this.state.aiTurn) throw Error("It must be the AI's turn!")
    const moves = generateMoves(this.state);
    return (
      range(Math.min(4, maxDepth - 2)).reduce((acc: any, maxDepth) => acc || this.checkSimpleSolutions(moves, maxDepth, minmaxAlgorithm), undefined) ||
      moves.map(move => ({
        move,
        score: minmaxAlgorithm(doMove(move, cloneState(this.state)), 0, maxDepth, -MAXVAL, +MAXVAL)
      }))
    ).toSorted(cmpByScore)
  }

  searchBestMove = (maxThinkingDuration = 1000): SearchController => {
    searchController.nodes = 0
    searchController.start = Date.now();
    searchController.stop = false;
    searchController.maxThinkingDuration = maxThinkingDuration

    const moves = generateMoves(this.state);
    for (let depth = 1; depth <= 20; depth++) {
      const bestMoves = moves.map(move => ({
        move,
        score: -negamax(doMove(move, cloneState(this.state)), 0, depth, -MAXVAL, +MAXVAL)
      })).toSorted(cmpByScore)
      if (searchController.stop) break;
      // bestMove = probePvTable();
      // pvNum = getPvLine(currentDepth);
      searchController.depth = depth
      searchController.duration = Date.now() - searchController.start;
      searchController.bestMoves = bestMoves
      if (bestMoves[0].score < -MAXVAL + 50) break;
      if (bestMoves[0].score > MAXVAL - 50) break;
    }
    return searchController;
  }
}

// just for debugging
const f = (x: number) => x === 0 ? '_' : x < 0 ? 'H' : 'C'
const reshape = (m: any, dim: number) => m.reduce((acc: any, x: any, i: number) => (i % dim ? acc[acc.length - 1].push(x) : acc.push([x])) && acc, []);
export const dumpBoard = (board: number[]): string => '\n' + reshape(board.map(x => ` ${f(x)} `), 7).reverse().map((x: any) => x.join('')).join('\n')

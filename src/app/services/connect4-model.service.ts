import { Injectable } from '@angular/core';
import { range, FieldOccupiedType, WinningRow, ConnectFourModelStaticService, DIM } from './connect4-model-static.service';

const cmpByScore = (a: MoveType, b: MoveType) => b.score - a.score
const reshape = (m: any, dim: number) => m.reduce((acc: any, x: any, i: number) => (i % dim ? acc[acc.length - 1].push(x) : acc.push([x])) && acc, []);
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

@Injectable({ providedIn: 'root' })
export class ConnectFourModelService {
  MAXVAL = MAXVAL;
  origState: STATE = { // state that is used for evaluating 
    board: range(DIM.NCOL * DIM.NROW).map(() => 0),
    heightCols: range(DIM.NCOL).map(() => 0), // height of cols = [0, 0, 0, ..., 0];
    winningRows: this.cfmodelstatic.allWinningRows,
    aiTurn: false,
    isMill: false,
    hash: '',
    moves: [],
  };

  state: STATE;
  cntNodesEvaluated = 0;
  cache: any = {};

  constructor(private readonly cfmodelstatic: ConnectFourModelStaticService) {
    this.state = cloneState(this.origState);
  }

  init = () => this.state = cloneState(this.origState);

  transitionGR = (i: FieldOccupiedType, o: FieldOccupiedType): FieldOccupiedType => { // i in / o out
    if (o === FieldOccupiedType.empty) return i;
    if (i === o) return i; // or o
    return FieldOccupiedType.neutral;
  }

  move = (c: number, mstate: STATE = this.state) => {
    const idxBoard = c + DIM.NCOL * mstate.heightCols[c]
    // update state of winning rows attached to idxBoard
    this.cfmodelstatic.winningRowsForFields[idxBoard].forEach(i => {
      const wrState = mstate.winningRows[i];
      const occupy = mstate.aiTurn ? FieldOccupiedType.ai : FieldOccupiedType.human;
      wrState.occupiedBy = this.transitionGR(occupy, wrState.occupiedBy);
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

  computeScoreOfNodeForAI = (state: STATE) =>
    state.winningRows.reduce((res, wr) => {
      if (wr.occupiedBy === FieldOccupiedType.ai) return res + wr.cnt 
      if (wr.occupiedBy === FieldOccupiedType.human) return res - wr.cnt 
      return res
    }, 0)

  negamax = (state: STATE, maxDepth: number, actDepth: number, alpha: number, beta: number): number => { // evaluate state recursively using negamax algorithm! -> wikipedia
    if (state.isMill) return -MAXVAL + actDepth
    if (state.moves.length >= NFIELDS) return 0
    if (actDepth === maxDepth) return this.computeScoreOfNodeForAI(state);
    let score = -MAXVAL;
    for (const m of this.generateMoves(state)) {
      score = Math.max(score, -this.negamax(this.move(m, cloneState(state)), maxDepth, actDepth + 1, -beta, -alpha));
      alpha = Math.max(alpha, score)
      if (alpha >= beta)
        break;
    }
    return score;
  }

  checkSimpleSolutions = (moves: number[], lev: number) => {
    const scoresOfMoves = moves.map(move => ({ move, score: -this.negamax(this.move(move, cloneState(this.state)), lev, 0, -MAXVAL, +MAXVAL) })).toSorted(cmpByScore)
    if (scoresOfMoves.some(m => m.score > MAXVAL - 50)) return scoresOfMoves // there are moves to win!
    if (scoresOfMoves.every(m => m.score < -MAXVAL + 50)) return scoresOfMoves // all moves lead to disaster 
    if (scoresOfMoves.filter(x => x.score > -MAXVAL + 50).length === 1) return scoresOfMoves; // there is only one move left!
    // console.log( `LEV:${lev} MOVES:${moves.join(',')}`)
    return undefined;
  }

  calcScoresOfMoves = (maxDepth: number): MoveType[] => {
    if (!this.state.aiTurn) throw Error("It must be the AI's turn!")
    const moves = this.generateMoves(this.state);
    return (
      [1, 2, 3].reduce((acc: any, n) => acc || this.checkSimpleSolutions(moves, n), undefined) ||
      moves.map(move => ({ move, score: -this.negamax(this.move(move, cloneState(this.state)), maxDepth, 0, -MAXVAL, +MAXVAL) })).toSorted(cmpByScore)
    )
  }

  generateMoves = (state: STATE): number[] => ORDER.filter(c => state.heightCols[c] < DIM.NROW);
  isMill = (): boolean => this.state.isMill
  isDraw = (): boolean => this.generateMoves(this.state).length === 0 && !this.state.isMill
  doMoves = (moves: number[]): void => moves.forEach(v => this.move(v));

  // just for debugging
  mapSym = { [FieldOccupiedType.human]: ' H ', [FieldOccupiedType.ai]: ' C ', [FieldOccupiedType.empty]: ' _ ', [FieldOccupiedType.neutral]: ' § ' };
  dumpBoard = (state: STATE = this.state): string =>
    range(DIM.NROW).reduce(
      (acc, r) => acc + range(DIM.NCOL).reduce((acc, c) => acc + this.mapSym[state.board[c + DIM.NCOL * (DIM.NROW - r - 1)]], '') + '\n',
      '\n')
  dumpCacheItem = (s: string) => reshape(s.split('').map(x => this.mapSym[Number(x) as FieldOccupiedType]), 7).reverse().map((x: any) => x.join('')).join('\n')
}
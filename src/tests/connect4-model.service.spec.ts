import {TestBed} from '@angular/core/testing';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {ConnectFourModelService, DIM, winningRows, winningRowsForFields} from '../app/services/connect4-model.service';

const range = (n: number) => [...Array(n).keys()]
let cf: ConnectFourModelService;

beforeEach(() => {
  TestBed.configureTestingModule({schemas: [CUSTOM_ELEMENTS_SCHEMA]});
  cf = TestBed.inject(ConnectFourModelService);
});

test('initialized correctly', () => {
  expect(winningRows.length).toBe(69)
  expect(winningRowsForFields.length).toBe(42)
  expect(winningRowsForFields[0]).toEqual([0, 1, 2])
  expect(winningRowsForFields[1]).toEqual([0, 3, 4, 5])
  expect(winningRowsForFields[10]).toEqual([7, 11, 15, 18, 21, 24, 25, 26, 48, 54])
  expect(cf.state.cntMoves).toBe(0);
  expect(cf.state.aiTurn).toBe(false);
  expect(cf.state.heightCols).toEqual(range(cf.origState.heightCols.length).map(() => 0));
  expect(cf.state.isMill).toBe(false);
});

test('whoseTurn works', () => {
  expect(cf.state.aiTurn).toBe(false);
  cf.doMove(0)
  expect(cf.state.aiTurn).toBe(true);
  cf.doMove(3)
  expect(cf.state.aiTurn).toBe(false);
});

test('draw - full board', () => {
  cf.state.aiTurn = true
  cf.doMoves([3, 2, 3, 3, 3, 6, 3, 6, 3, 6, 6, 2, 1, 2, 2, 2, 2, 6, 6, 5, 5, 5, 5, 4, 5, 5, 0, 0, 0, 0, 0, 0, 1, 1, 1, 4, 4, 4, 1, 4, 1, 4])
  expect(cf.state.cntMoves).toBe(DIM.NCOL * DIM.NROW)
  expect(cf.calcScoresOfMoves().bestMoves.length).toBe(0)
});

test('draw - board almost full', () => {
  cf.doMoves([3, 2, 3, 3, 3, 6, 3, 6, 3, 6, 6, 2, 1, 2, 2, 2, 2, 6, 6, 5, 5, 5, 5, 4, 5, 5, 0, 0, 0, 0, 0, 0, 1, 1, 1, 4, 4, 4, 1])
  // C  _  H  H  _  C  H
  // H  H  C  H  _  H  C
  // C  H  H  H  C  H  H
  // H  C  C  C  H  C  C
  // C  H  C  H  C  H  C
  // H  H  C  H  C  C  C
  expect(cf.state.cntMoves).toBe(39)
  const sc = cf.calcScoresOfMoves(20)
  const m = sc.bestMoves
  //console.log( m )
  expect(m.length).toBe(2)
  expect(m[0].move === 1 || m[0].move === 4).toBeTruthy()
  expect(m[0].score === 0).toBeTruthy() // -0!!
  expect(m[1].score === 0).toBeTruthy()
})

test('loosing 1', () => {
  cf.state.aiTurn = true
  cf.doMoves([0, 3, 0, 4, 1, 5])
  // _  _  _  _  _  _  _
  // C  _  _  _  _  _  _
  // C  C  _  H  H  H  _
  const sc = cf.calcScoresOfMoves(20)
  const m = sc.bestMoves
  expect(m.every(({score}) => score <= -cf.MAXVAL + 50)).toBeTruthy();
});

test('loosing 2', () => {
  cf.doMoves([3, 3, 4, 0, 5])
  // _  _  _  _  _  _  _
  // _  _  _  C  _  _  _
  // C  _  _  H  H  H  _
  const sc = cf.calcScoresOfMoves(20)
  const m = sc.bestMoves
  expect(m.every(({score}) => score <= -cf.MAXVAL + 50)).toBeTruthy();
});

test('loosing 3', () => {
  cf.state.aiTurn = true
  cf.doMoves([0, 4, 0, 3, 2, 3, 0, 0, 1, 2, 4, 3, 3, 2])
  // _  _  _  _  _  _  _
  // H  _  _  C  _  _  _
  // C  _  H  H  _  _  _
  // C  _  H  H  C  _  _
  // C  C  C  H  H  _  _
  const sc = cf.calcScoresOfMoves(20)
  const m = sc.bestMoves
  //console.log("loosing 3",m)
  expect(m.every(({score}) => score <= -cf.MAXVAL + 50)).toBeTruthy();
});

test('eval 1', () => {
  cf.doMoves([0, 3, 0, 3, 0])
  // _  _  _  _  _  _  _
  // H  _  _  _  _  _  _
  // H  _  _  C  _  _  _
  // H  _  _  C  _  _  _
  const sc = cf.calcScoresOfMoves(20)
  const m = sc.bestMoves
  // console.log('eval 3', m)
  expect(m[0].move).toBe(0);
  expect(m.some(({score}) => score > -cf.MAXVAL + 50))
});

test('eval 2', () => {
  cf.state.aiTurn = true
  cf.doMoves([0, 4, 0, 3, 2, 3, 0, 0, 1, 2])
  // _  _  _  _  _  _  _
  // H  _  _  _  _  _  _
  // C  _  _  _  _  _  _
  // C  _  H  H  _  _  _
  // C  C  C  H  H  _  _
  const sc = cf.calcScoresOfMoves(20)
  const m = sc.bestMoves
  //console.log('eval 2', m)
  // expect(m[0].move).toBe(4);
  expect(m.some(({score}) => score > -cf.MAXVAL + 50))
});

test('eval 3', () => {
  cf.doMoves([3, 3, 4])
  // _  _  _  _  _  _  _
  // _  _  _  C  _  _  _
  // _  _  _  H  H  _  _
  const sc = cf.calcScoresOfMoves(20)
  const m = sc.bestMoves
  // console.log('eval 3', m)
  expect(m[0].move === 2 || m[0].move === 5).toBeTruthy();
});


test('eval 4', () => {
  cf.doMoves([2, 6, 4])
  // _  _  _  _  _  _  _
  // _  _  C  _  _  _  _
  // _  _  H  _  H  _  _
  const sc = cf.calcScoresOfMoves(20)
  const m = sc.bestMoves
  // console.log('eval 4', m)
  expect(m[0].move === 1 || m[0].move === 3 || m[0].move === 5).toBeTruthy();
});

test('eval 5', () => {
  cf.doMoves([3, 0, 4])
  // _  _  _  _  _  _  _
  // _  _  _  _  _  _  _
  // C  _  _  H  H  _  _
  const sc = cf.calcScoresOfMoves(20)
  // console.log(m, cf.dumpBoard(cf.state.board));
  expect(sc.bestMoves[0].move === 2 || sc.bestMoves[0].move === 5).toBeTruthy();
});

test('eval 6', () => {
  cf.state.aiTurn = true
  // _  _  _  _  _  _  _
  // _  _  _  _  _  _  _
  // _  _  _  _  _  _  _
  const sc = cf.calcScoresOfMoves(100)
  // console.log('eval 6', sc)
  expect(sc.bestMoves.some(({score}) => score > 0)).toBeTruthy();
});

test('eval 7', () => {
  cf.doMove(0)
  // _  _  _  _  _  _  _
  // _  _  _  _  _  _  _
  // H  _  _  _  _  _  _
  const sc = cf.calcScoresOfMoves(100)
  // console.log('eval 7', s)
  expect(sc.bestMoves.some(({score}) => score >= 0)).toBeTruthy();
});

test('eval 8 - bad moves', () => {
  cf.doMoves([3, 0, 3, 0, 3])
  // _  _  _  H  _  _  _
  // C  _  _  H  _  _  _
  // C  _  _  H  _  _  _
  const sc = cf.calcScoresOfMoves(100)
  // console.log('eval 8', sc ) // , dumpBoard(cf.state.board))
  expect(sc.bestMoves[0].score).toBeGreaterThan(0);
  expect(sc.bestMoves.slice(1).every(({score}) => score <= -cf.MAXVAL + 1)).toBeTruthy();
});

test('eval 9 - bad moves', () => {
  cf.doMoves([3, 0, 3, 0, 4])
  // _  _  _  _  _  _  _
  // C  _  _  H  _  _  _
  // C  _  _  H  H  _  _
  const sc = cf.calcScoresOfMoves(20)
  // console.log('eval9', s, dumpBoard(cf.state.board))
  expect(sc.bestMoves.some(({score}) => score > -cf.MAXVAL + 50))
});

test('winning 1', () => {
  cf.doMoves([3, 3, 3, 3, 3, 2, 3, 4, 0, 2, 0, 2, 2, 4, 4, 0, 4, 4, 4, 5, 5, 5, 5, 6, 5, 1, 1])
  // _  _  _  H  H  _  _
  // _  _  _  H  C  H  _
  // _  _  H  C  H  H  _
  // C  _  C  H  H  C  _
  // H  H  C  C  C  H  _
  // H  C  C  H  C  C  C
  const sc = cf.calcScoresOfMoves()
  // console.log('winning 2', sc)
  expect(sc.bestMoves[0].move).toBe(5);
  expect(sc.bestMoves[0].score).toBeGreaterThanOrEqual(cf.MAXVAL - 50);
});

test('winning 2', () => {
  cf.doMoves([0, 6, 0, 6, 0, 6, 1])
  // _  _  _  _  _  _  _
  // H  _  _  _  _  _  C
  // H  _  _  _  _  _  C
  // H  H  _  _  _  _  C
  const sc = cf.calcScoresOfMoves()
  // console.log('winning 2', m)
  expect(sc.bestMoves[0].move).toBe(6);
  expect(sc.bestMoves[0].score).toBeGreaterThanOrEqual(cf.MAXVAL - 50);
});

test('winning 3', () => {
  cf.doMoves([0, 3, 0, 4, 3])
  // _  _  _  _  _  _  _
  // H  _  _  H  _  _  _
  // H  _  _  C  C  _  _
  const sc = cf.calcScoresOfMoves()
  // console.log('winning 3', m)
  expect(sc.bestMoves[0].move === 2 || sc.bestMoves[0].move === 5).toBeTruthy();
  expect(sc.bestMoves[0].score).toBeGreaterThanOrEqual(cf.MAXVAL - 50);
});

test('winning 4', () => {
  cf.state.aiTurn = true
  cf.doMoves([2, 2, 4, 2])
  // _  _  _  _  _  _  _
  // _  _  H  _  _  _  _
  // _  _  H  _  _  _  _
  // _  _  C  _  C  _  _
  const sc = cf.calcScoresOfMoves()
  // console.log('winning 4', m)
  expect(sc.bestMoves[0].move).toBe(3);
  expect(sc.bestMoves[0].score).toBeGreaterThanOrEqual(cf.MAXVAL - 50);
});

test('winning 5', () => {
  cf.doMoves([0, 4, 0, 3, 0, 0, 2, 3, 3, 4, 2])
  // _  _  _  _  _  _  _
  // C  _  _  _  _  _  _
  // H  _  _  H  _  _  _
  // H  _  H  C  C  _  _
  // H  _  H  C  C  _  _
  const sc = cf.calcScoresOfMoves()
  // console.log('winning 5', m)
  expect(sc.bestMoves[0].score).toBeGreaterThanOrEqual(cf.MAXVAL - 50);
});

test('winning 6', () => {
  cf.doMoves([0, 4, 0, 3, 2, 3, 0, 0, 1])
  // _  _  _  _  _  _  _
  // C  _  _  _  _  _  _
  // H  _  _  _  _  _  _
  // H  _  _  C  _  _  _
  // H  H  H  C  C  _  _
  const sc = cf.calcScoresOfMoves(3000)
  // console.log('winning 6', sc)
  expect(sc.depth).toBe(6)
  expect(sc.bestMoves[0].score).toBeGreaterThanOrEqual(cf.MAXVAL - 6);
});

test('winning 7', () => {
  cf.doMoves([0, 4, 1, 3, 2, 3, 2, 3, 3, 2, 2, 3, 2, 2, 6, 3, 6, 1, 6, 6, 6])
  // _  _  C  C  _  _  _
  // _  _  H  C  _  _  H
  // _  _  H  H  _  _  C
  // _  _  C  C  _  _  H
  // _  C  H  C  _  _  H
  // H  H  H  C  C  _  H
  const sc = cf.calcScoresOfMoves()
  // console.log('winning 7', sc)
  expect(sc.depth).toBe(10)
  expect(sc.nodes).toBeGreaterThanOrEqual(10000)
  expect(sc.bestMoves[0].score).toBeGreaterThanOrEqual(cf.MAXVAL - 10);
})

test('winning 8 - depth 12', () => {
  cf.doMoves([3, 6, 3, 3, 2, 4, 1, 0, 0, 3, 0, 2, 1, 3, 3, 2, 1, 1, 0, 0, 2, 1, 2, 6, 6])
  const sc = cf.calcScoresOfMoves(2000)
  // console.log('winning 8', sc)
  expect(sc.bestMoves[0].score).toBeGreaterThanOrEqual(cf.MAXVAL - 12);
  expect(sc.nodes).toBeGreaterThanOrEqual(10000)
  expect(sc.duration).toBeLessThan(2000)
  expect(sc.depth).toBe(12)
})


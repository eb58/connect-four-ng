import { TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ConnectFourModelService } from '../app/services/connect4-model.service';

describe('tests for winning ', () => {
  let cf: ConnectFourModelService;

  beforeEach(() => {
    TestBed.configureTestingModule({ schemas: [CUSTOM_ELEMENTS_SCHEMA] });
    cf = TestBed.inject(ConnectFourModelService);
  });

  test('scenario 1', () => {
    cf.doMoves([0, 6, 0, 6, 0, 6, 1])
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // H  _  _  _  _  _  C
    // H  _  _  _  _  _  C
    // H  H  _  _  _  _  C
    const m = cf.calcScoresOfMoves(6)
    expect(m[0].score).toBe(cf.MAXVAL);
    expect(m[0].move).toBe(6);
  });

  test('scenario 2', () => {
    cf.doMoves([0, 3, 0, 4, 3])
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // H  _  _  H  _  _  _
    // H  _  _  C  C  _  _
    const m = cf.calcScoresOfMoves(6)
    expect(m[0].score).toBe(cf.MAXVAL - 2);
    expect(m[0].move === 2 || m[0].move === 5).toBeTruthy();
  });

  test('scenario 4', () => {
    cf.state.aiTurn = true
    cf.doMoves([2, 2, 4, 2])
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // _  _  H  _  _  _  _
    // _  _  H  _  _  _  _
    // _  _  C  _  C  _  _
    const m = cf.calcScoresOfMoves(6)
    expect(m[0].move).toBe(3);
    expect(m[0].score).toBe(cf.MAXVAL - 2);
  });

  test('scenario 5', () => {
    cf.doMoves([3, 3, 3, 3, 3, 2, 3, 4, 0, 2, 0, 2, 2, 4, 4, 0, 4, 4, 4, 5, 5, 5, 5, 6, 5, 1, 1])
    // _  _  _  H  H  _  _                                                                 
    // _  _  _  H  C  H  _                                                                 
    // _  _  H  C  H  H  _                                                                 
    // C  _  C  H  H  C  _                                                                 
    // H  H  C  C  C  H  _
    // H  C  C  H  C  C  C
    const m = cf.calcScoresOfMoves(6)
    expect(m[0].move).toBe(5);
    expect(m[0].score).toBe(cf.MAXVAL);
  });

  test('scenario 6', () => {
    cf.doMoves([0, 4, 0, 3, 0, 0, 2, 3, 3, 4, 2])
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // C  _  _  _  _  _  _
    // H  _  _  H  _  _  _
    // H  _  H  C  C  _  _
    // H  _  H  C  C  _  _
    const m = cf.calcScoresOfMoves(6)
    expect(m[0].move).toBe(6);
    expect(m[0].score).toBe(cf.MAXVAL - 6);
  });

  test('scenario 7', () => {
    cf.doMoves([0, 4, 0, 3, 2, 3, 0, 0, 1])
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // C  _  _  _  _  _  _
    // H  _  _  _  _  _  _ 
    // H  _  _  C  _  _  _ 
    // H  H  H  C  C  _  _
    const m = cf.calcScoresOfMoves(6)
    expect(m[0].move).toBe(2); expect(m[0].score).toBe(cf.MAXVAL - 6);
  });

  test('scenario 8', () => {
    cf.doMoves([0, 4, 1, 3, 2, 3, 2, 3, 3, 2, 2, 3, 2, 2, 6, 3, 6, 1, 6, 6, 6])
    // _  _  C  C  _  _  _
    // _  _  H  C  _  _  H
    // _  _  H  H  _  _  C
    // _  _  C  C  _  _  H
    // _  C  H  C  _  _  H
    // H  H  H  C  C  _  H
    const m = cf.calcScoresOfMoves(10)
    // console.log(m, cf.dumpBoard(cf.state))
    expect(m[0].move).toBe(6); 
    expect(m[0].score).toBeGreaterThanOrEqual(cf.MAXVAL - 20);
  })
})


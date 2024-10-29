import { TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ConnectFourModelService, DIM } from '../app/services/connect4-model.service';

  let cf: ConnectFourModelService;

  beforeEach(() => {
    TestBed.configureTestingModule({ schemas: [CUSTOM_ELEMENTS_SCHEMA] });
    cf = TestBed.inject(ConnectFourModelService);
  });

  test('winning scenario 1', () => {
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

  test('winning scenario 2', () => {
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

  test('winning scenario 4', () => {
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

  test('winning scenario 5', () => {
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

  test('winning scenario 6', () => {
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

  test('winning scenario 7', () => {
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

  test('winning scenario 8', () => {
    cf.doMoves([0, 4, 1, 3, 2, 3, 2, 3, 3, 2, 2, 3, 2, 2, 6, 3, 6, 1, 6, 6, 6])
    // _  _  C  C  _  _  _
    // _  _  H  C  _  _  H
    // _  _  H  H  _  _  C
    // _  _  C  C  _  _  H
    // _  C  H  C  _  _  H
    // H  H  H  C  C  _  H
    const m = cf.calcScoresOfMoves(10)
    expect(m[0].move).toBe(5); expect(m[0].score).toBeGreaterThan(cf.MAXVAL - 20);
  })

  
  test('loosing scenario 1', () => {
    cf.state.aiTurn = true
    cf.doMoves([0, 3, 0, 4, 1, 5])
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // C  _  _  _  _  _  _
    // C  C  _  H  H  H  _
    const m = cf.calcScoresOfMoves(6)
    expect(m.every(x => x.score === -cf.MAXVAL + 1)).toBeTruthy(); // no chance to win!
  });

  test('loosing scenario 2', () => {
    cf.doMoves([3, 3, 4, 0, 5])
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // _  _  _  C  _  _  _
    // C  _  _  H  H  H  _
    const m = cf.calcScoresOfMoves(6)
    expect(m.every(x => x.score === -cf.MAXVAL + 1)).toBeTruthy(); // no chance to win!
  });

  test('loosing scenario 3', () => {
    cf.state.aiTurn = true
    cf.doMoves([0, 4, 0, 3, 2, 3, 0, 0, 1, 2, 4, 3, 3, 2])
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // H  _  _  C  _  _  _
    // C  _  H  H  _  _  _
    // C  _  H  H  C  _  _
    // C  C  C  H  H  _  _
    const m = cf.calcScoresOfMoves(6)
    expect(m[0].move).toBe(3); expect(m[0].score).toBe(-cf.MAXVAL + 3);
  });

  test('loosing scenario 4', () => {
    cf.state.aiTurn = true
    cf.doMoves([0, 4, 0, 3, 2, 3, 0, 0, 1, 2])
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // H  _  _  _  _  _  _
    // C  _  _  _  _  _  _ 
    // C  _  H  H  _  _  _ 
    // C  C  C  H  H  _  _
    const m = cf.calcScoresOfMoves(10)
    // console.log(m)
    expect(m[0].move).toBe(4);
    expect(m[0].score).toBeGreaterThan(-cf.MAXVAL + 50)
  });

  // draw
  test('draw - full board', () => {
    cf.state.aiTurn = true
    cf.doMoves([3, 2, 3, 3, 3, 6, 3, 6, 3, 6, 6, 2, 1, 2, 2, 2, 2, 6, 6, 5, 5, 5, 5, 4, 5, 5, 0, 0, 0, 0, 0, 0, 1, 1, 1, 4, 4, 4, 1, 4, 1, 4])
    expect(cf.state.moves.length).toBe(DIM.NCOL * DIM.NROW)
    expect(cf.calcScoresOfMoves(6).length).toBe(0)
  });

  test('draw - board almost full', () => {
    cf.doMoves([3, 2, 3, 3, 3, 6, 3, 6, 3, 6, 6, 2, 1, 2, 2, 2, 2, 6, 6, 5, 5, 5, 5, 4, 5, 5, 0, 0, 0, 0, 0, 0, 1, 1, 1, 4, 4, 4, 1])
    // C  _  H  H  _  C  H                                                                 
    // H  H  C  H  _  H  C                                                                 
    // C  H  H  H  C  H  H                                                                 
    // H  C  C  C  H  C  C                                                                 
    // C  H  C  H  C  H  C
    // H  H  C  H  C  C  C
    expect(cf.state.moves.length).toBe(39)
    const m = cf.calcScoresOfMoves(6)
    expect(m.length).toBe(2)
    expect(m[0].move === 1 || m[0].move === 4).toBeTruthy()
    expect(m[0].score === 0).toBeTruthy() // -0!!
    expect(m[1].score === 0).toBeTruthy()
  })

  // eval
  test('eval A', () => {
    cf.state.aiTurn = true
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    const s = cf.calcScoresOfMoves(6)
    expect(s.every(({ score }) => score > 0)).toBeTruthy();
  });

  test('eval B', () => {
    cf.doMove(0)
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // H  _  _  _  _  _  _
    const s = cf.calcScoresOfMoves(6)
    expect(s[0].score).toBeGreaterThan(0);
  });

  test('eval 1', () => {
    cf.doMoves([3, 3, 4])
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // _  _  _  C  _  _  _
    // _  _  _  H  H  _  _
    const m = cf.calcScoresOfMoves(6)
    expect(m[0].move === 2 || m[0].move === 5).toBeTruthy();
  });

  test('eval 2', () => {
    cf.doMoves([2, 6, 4])
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // _  _  C  _  _  _  _
    // _  _  H  _  H  _  _
    const m = cf.calcScoresOfMoves(6)
    expect(m[0].move).toBe(3);
  });

  test('eval 3', () => {
    cf.doMoves([0, 3, 0, 3, 0])
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // H  _  _  _  _  _  _
    // H  _  _  C  _  _  _
    // H  _  _  C  _  _  _
    const m = cf.calcScoresOfMoves(6)
    expect(m[0].move).toBe(0);
    expect(m.filter(x => x.score > -cf.MAXVAL + 50).length).toBe(1);
  });

  test('eval 4', () => {
    cf.doMoves([3, 0, 4])
    // _  _  _  _  _  _  _ 
    // _  _  _  _  _  _  _ 
    // _  _  _  _  _  _  _ 
    // C  _  _  H  H  _  _
    const m = cf.calcScoresOfMoves(4)
    // console.log(m, cf.dumpBoard());
    expect(m[0].move === 2 || m[0].move === 5).toBeTruthy();
  });





import { TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ConnectFourModelService } from '../app/services/connect4-model.service';

describe('tests for loosing', () => {
  let cf: ConnectFourModelService;

  beforeEach(() => {
    TestBed.configureTestingModule({ schemas: [CUSTOM_ELEMENTS_SCHEMA] });
    cf = TestBed.inject(ConnectFourModelService);
  });

  test('scenario 1', () => {
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

  test('scenario 2', () => {
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

  test('scenario 3', () => {
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

  test('scenario 4', () => {
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

});

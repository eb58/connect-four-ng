import { TestBed } from '@angular/core/testing';
import { ConnectFourModelService } from '../app/services/connect4-model.service';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('tests for loosing', () => {
  let vg: ConnectFourModelService;

  beforeEach(() => {
    TestBed.configureTestingModule({ schemas: [CUSTOM_ELEMENTS_SCHEMA] });
    vg = TestBed.inject(ConnectFourModelService);
    vg.gameSettings.maxDepth = 6
  });

  test('scenario 1', () => {
    vg.state.whoseTurn = 'ai'
    vg.doMoves([0, 3, 0, 4, 1, 5])
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // C  _  _  _  _  _  _
    // C  C  _  H  H  H  _
    const m = vg.calcBestMoves()
    expect(m.every(x => x.score === -vg.MAXVAL + 1)).toBeTruthy(); // no chance to win!
  });

  test('scenario 2', () => {
    vg.doMoves([3, 3, 4, 0, 5])
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // _  _  _  C  _  _  _
    // C  _  _  H  H  H  _
    const m = vg.calcBestMoves()
    expect(m.every(x => x.score === -vg.MAXVAL + 1)).toBeTruthy(); // no chance to win!
  });

  test('scenario 3', () => {
    vg.state.whoseTurn = 'ai'
    vg.doMoves([0, 4, 0, 3, 2, 3, 0, 0, 1, 2, 4, 3, 3, 2])
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // H  _  _  C  _  _  _
    // C  _  H  H  _  _  _
    // C  _  H  H  C  _  _
    // C  C  C  H  H  _  _
    const m = vg.calcBestMoves()
    expect(m[0].move).toBe(3); expect(m[0].score).toBe(-vg.MAXVAL + 3);
  });

  test('scenario 4', () => {
    vg.gameSettings.maxDepth = 8;
    vg.state.whoseTurn = 'ai'
    vg.doMoves([0, 4, 0, 3, 2, 3, 0, 0, 1, 2])
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // H  _  _  _  _  _  _
    // C  _  _  _  _  _  _ 
    // C  _  H  H  _  _  _ 
    // C  C  C  H  H  _  _
    const m = vg.calcBestMoves()
    expect(m[0].move).toBe(4); expect(m[0].score).toBe(-vg.MAXVAL + 5);
  });

});

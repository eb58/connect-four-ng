import { TestBed } from '@angular/core/testing';
import { ConnectFourModelService } from '../app/services/connect4-model.service';
import { range, DIM } from '../app/services/connect4-model-static.service';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('ConnectFourModelService', () => {
  let cf: ConnectFourModelService;

  beforeEach(() => {
    TestBed.configureTestingModule({ schemas: [CUSTOM_ELEMENTS_SCHEMA] });
    cf = TestBed.inject(ConnectFourModelService);
  });

  test('should be created', () => expect(cf).toBeTruthy());

  test('should be initalized correctly', () => {
    expect(cf.state.board.length).toBe(DIM.NCOL * DIM.NROW);
    expect(cf.state.board).toEqual(range(DIM.NCOL * DIM.NROW).map(() => 0));
    expect(cf.state.moves).toEqual([]);
    expect(cf.state.aiTurn).toBe(false);
    expect(cf.state.heightCols).toEqual(range(cf.origState.heightCols.length).map(() => 0));
    expect(cf.isMill()).toBe(false);
    expect(cf.isDraw()).toBe(false);
  });

  test('whoseTurn works', () => {
    expect(cf.state.aiTurn).toBe(false);
    expect(cf.move(0))
    expect(cf.state.aiTurn).toBe(true);
    expect(cf.move(3))
    expect(cf.state.aiTurn).toBe(false);
  });

})
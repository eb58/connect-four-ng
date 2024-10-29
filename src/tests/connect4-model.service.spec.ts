import { TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ConnectFourModelService, DIM, range, winningRows, winningRowsForFields } from '../app/services/connect4-model.service';

describe('ConnectFourModelService', () => {
  let cf: ConnectFourModelService;

  beforeEach(() => {
    TestBed.configureTestingModule({ schemas: [CUSTOM_ELEMENTS_SCHEMA] });
    cf = TestBed.inject(ConnectFourModelService);
  });

  test('should be created', () => expect(cf).toBeTruthy());

  test('should be initialized correctly', () => {
    expect(winningRows.length).toBe(69)
    expect(winningRowsForFields.length).toBe(42)
    expect(winningRowsForFields[0]).toEqual([0, 1, 2])
    expect(winningRowsForFields[1]).toEqual([0, 3, 4, 5])
    expect(winningRowsForFields[10]).toEqual([7, 11, 15, 18, 21, 24, 25, 26, 48, 54])
  })

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
    expect(cf.doMove(0))
    expect(cf.state.aiTurn).toBe(true);
    expect(cf.doMove(3))
    expect(cf.state.aiTurn).toBe(false);
  });

})
import { TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ConnectFourModelService, DIM } from '../app/services/connect4-model.service';

describe('tests for draw scenarios', () => {
    let cf: ConnectFourModelService;
    beforeEach(() => {
        TestBed.configureTestingModule({ schemas: [CUSTOM_ELEMENTS_SCHEMA] });
        cf = TestBed.inject(ConnectFourModelService);
    });

    test('full board', () => {
        cf.state.aiTurn = true
        cf.doMoves([3, 2, 3, 3, 3, 6, 3, 6, 3, 6, 6, 2, 1, 2, 2, 2, 2, 6, 6, 5, 5, 5, 5, 4, 5, 5, 0, 0, 0, 0, 0, 0, 1, 1, 1, 4, 4, 4, 1, 4, 1, 4])
        expect(cf.state.moves.length).toBe(DIM.NCOL * DIM.NROW)
        expect(cf.calcScoresOfMoves(6).length).toBe(0)
    });

    test('board almost full', () => {
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
        expect(m[0].score === 0 ).toBeTruthy() // -0!!
        expect(m[1].score === 0 ).toBeTruthy()
    })

})
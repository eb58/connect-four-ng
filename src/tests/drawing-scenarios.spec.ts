import { TestBed } from '@angular/core/testing';
import { ConnectFourModelService } from '../app/services/connect4-model.service';
import { DIM } from '../app/services/connect4-model-static.service';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
let vg: ConnectFourModelService;

describe('tests for draw scenarios', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({ schemas: [CUSTOM_ELEMENTS_SCHEMA] });
        vg = TestBed.inject(ConnectFourModelService);
        vg.gameSettings.maxDepth = 6
    });

    test('full board', () => {
        vg.state.whoseTurn = 'ai'
        vg.doMoves([3, 2, 3, 3, 3, 6, 3, 6, 3, 6, 6, 2, 1, 2, 2, 2, 2, 6, 6, 5, 5, 5, 5, 4, 5, 5, 0, 0, 0, 0, 0, 0, 1, 1, 1, 4, 4, 4, 1, 4, 1, 4])
        expect(vg.state.moves.length).toBe(DIM.NCOL * DIM.NROW)
        expect(vg.calcBestMoves().length).toBe(0)
    });

    test('board almost full', () => {
        vg.doMoves([3, 2, 3, 3, 3, 6, 3, 6, 3, 6, 6, 2, 1, 2, 2, 2, 2, 6, 6, 5, 5, 5, 5, 4, 5, 5, 0, 0, 0, 0, 0, 0, 1, 1, 1, 4, 4, 4, 1])
        // C  _  H  H  _  C  H                                                                 
        // H  H  C  H  _  H  C                                                                 
        // C  H  H  H  C  H  H                                                                 
        // H  C  C  C  H  C  C                                                                 
        // C  H  C  H  C  H  C
        // H  H  C  H  C  C  C
        expect(vg.state.moves.length).toBe(39)
        const m = vg.calcBestMoves()
        expect(m.length).toBe(2)
        expect(m[0].move === 1 || m[0].move === 4).toBeTruthy()
        expect(m[0].score === 0 ).toBeTruthy() // -0!!
        expect(m[1].score === 0 ).toBeTruthy()
    })

})
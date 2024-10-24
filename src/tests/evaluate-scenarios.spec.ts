import { TestBed } from '@angular/core/testing';
import { ConnectFourModelService } from '../app/services/connect4-model.service';
import { DIM } from '../app/services/connect4-model-static.service';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
let cf: ConnectFourModelService;

describe('tests for draw scenarios', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({ schemas: [CUSTOM_ELEMENTS_SCHEMA] });
        cf = TestBed.inject(ConnectFourModelService);
    });

    test('scenario 1', () => {
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

    test('scenario 2', () => {
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
})
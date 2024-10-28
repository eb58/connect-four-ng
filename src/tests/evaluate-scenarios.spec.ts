import { TestBed } from '@angular/core/testing';
import { ConnectFourModelService } from '../app/services/connect4-model.service';
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

    test('scenario 3', () => {
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

    test('scenario 4', () => {
        cf.doMoves([3, 0, 4])
        // _  _  _  _  _  _  _ 
        // _  _  _  _  _  _  _ 
        // _  _  _  _  _  _  _ 
        // C  _  _  H  H  _  _
        const m = cf.calcScoresOfMoves(4)
        // console.log(m, cf.dumpBoard());
        expect(m[0].move === 2 || m[0].move === 5).toBeTruthy();
    });

});


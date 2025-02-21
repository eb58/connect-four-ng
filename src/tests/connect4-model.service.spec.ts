import {TestBed} from '@angular/core/testing';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {ConnectFourModelService, DIM, winningRows, winningRowsForFields} from '../app/services/connect4-model.service';

const range = (n: number) => [...Array(n).keys()]

TestBed.configureTestingModule({schemas: [CUSTOM_ELEMENTS_SCHEMA]});
const cf = TestBed.inject(ConnectFourModelService);

const initGame = (game: string) => {
  const x = game.split('|')
  cf.state.side = x[0] === 'blue' ? 1 : -1
  x[1].split('').map(x => +x).forEach(v => cf.doMove(v));
}

beforeEach(() => {
  cf.init()
});

test('initialized correctly', () => {
  expect(winningRows.length).toBe(69)
  expect(winningRowsForFields.length).toBe(42)
  expect(winningRowsForFields[0]).toEqual([0, 1, 2])
  expect(winningRowsForFields[1]).toEqual([0, 3, 4, 5])
  expect(winningRowsForFields[10]).toEqual([7, 11, 15, 18, 21, 24, 25, 26, 48, 54])
  expect(cf.state.side).toBe(-1);
  expect(cf.state.heightCols).toEqual(range(DIM.NCOL).map(() => 0));
  expect(cf.state.isMill).toBe(false);
});

test('whoseTurn works', () => {
  expect(cf.state.side).toBe(-1);
  cf.doMove(0)
  expect(cf.state.side).toBe(1);
  cf.doMove(3)
  expect(cf.state.side).toBe(-1);
});

test('draw - full board', () => {
  initGame('blue|323336363662122226655554550000001114441414')
  expect(cf.searchBestMove().bestMoves.length).toBe(0)
});

test('draw - board almost full', () => {
    initGame('red|323336363662122226655554550000001114441')
    // C  _  H  H  _  C  H
    // H  H  C  H  _  H  C
    // C  H  H  H  C  H  H
    // H  C  C  C  H  C  C
    // C  H  C  H  C  H  C
    // H  H  C  H  C  C  C
  const sc = cf.searchBestMove()
    const m = sc.bestMoves
    expect(m.length).toBe(2)
    expect(m[0].move === 1 || m[0].move === 4).toBeTruthy()
    expect(m[0].score === 0).toBeTruthy() // -0!!
    expect(m[1].score === 0).toBeTruthy()
  }
)

test('loosing 1', () => {
  initGame('blue|030415')
  // _  _  _  _  _  _  _
  // C  _  _  _  _  _  _
  // C  C  _  H  H  H  _
  const sc = cf.searchBestMove()
  const m = sc.bestMoves
  // console.log('loosing 1', sc)
  expect(sc.depth).toBe(2)
  expect(m.every(({score}) => score === -cf.MAXVAL + 1)).toBeTruthy();
});

test('loosing 2', () => {
  initGame('blue|33405')
  // _  _  _  _  _  _  _
  // _  _  _  C  _  _  _
  // C  _  _  H  H  H  _
  const sc = cf.searchBestMove()
  expect(sc.depth).toBe(2)
  expect(sc.bestMoves.every(({score}) => score <= -cf.MAXVAL + 1)).toBeTruthy();
});

test('loosing 3', () => {
  initGame('blue|04032300124332')
  // _  _  _  _  _  _  _
  // H  _  _  C  _  _  _
  // C  _  H  H  _  _  _
  // C  _  H  H  C  _  _
  // C  C  C  H  H  _  _
  const sc = cf.searchBestMove()
  // console.log('loosing 3', sc)
  expect(sc.depth).toBe(4)
  expect(sc.bestMoves.every(({score}) => score <= -cf.MAXVAL + 3)).toBeTruthy();
});

test('eval 1', () => {
  initGame('red|03030')
  // _  _  _  _  _  _  _
  // H  _  _  _  _  _  _
  // H  _  _  C  _  _  _
  // H  _  _  C  _  _  _
  const sc = cf.searchBestMove()
  // console.log('eval 1', sc)
  expect(sc.depth).toBe(2)
  expect(sc.bestMoves[0].move).toBe(0);
  expect(sc.bestMoves.slice(1).every(({score}) => score <= -cf.MAXVAL + 1)).toBeTruthy()
});

test('eval 2', () => {
    initGame('blue|0403230012')
    // _  _  _  _  _  _  _
    // H  _  _  _  _  _  _
    // C  _  _  _  _  _  _
    // C  _  H  H  _  _  _
    // C  C  C  H  H  _  _
  const sc = cf.searchBestMove()
    // console.log('eval 2', sc)
  expect(sc.depth).toBe(4)
    expect(sc.bestMoves[0].move).toBe(4);
  expect(sc.bestMoves.slice(6).every(({score}) => score <= -cf.MAXVAL + 3))
  }
)

test('eval 3', () => {
  initGame('red|334')
  // _  _  _  _  _  _  _
  // _  _  _  C  _  _  _
  // _  _  _  H  H  _  _
  const sc = cf.searchBestMove()
  // console.log('eval 3', sc)
  expect(sc.bestMoves[0].move === 2 || sc.bestMoves[0].move === 5).toBeTruthy();
  expect(sc.bestMoves.slice(5).every(({score}) => score <= -cf.MAXVAL + 3)).toBeTruthy()
});

test('eval 4', () => {
  initGame('red|304')
  // _  _  _  _  _  _  _
  // _  _  _  _  _  _  _
  // C  _  _  H  H  _  _
  const sc = cf.searchBestMove()
  // console.log('eval 4', sc)
  expect(sc.bestMoves[0].move === 2 || sc.bestMoves[0].move === 5).toBeTruthy();
  expect(sc.bestMoves.slice(5).every(({score}) => score === -cf.MAXVAL + 3)).toBeTruthy()
});

test('eval 5 - bad moves', () => {
  initGame('red|30303')
  // _  _  _  H  _  _  _
  // C  _  _  H  _  _  _
  // C  _  _  H  _  _  _
  const sc = cf.searchBestMove()
  // console.log('eval 5', sc) // , dumpBoard(cf.state.board))
  expect(sc.depth).toBe(2)
  expect(sc.bestMoves[0].move).toBe(3);
  expect(sc.bestMoves.slice(1).every(({score}) => score === -cf.MAXVAL + 1)).toBeTruthy();
});

test('eval 6 - bad moves', () => {
  initGame('red|30304')
  // _  _  _  _  _  _  _
  // C  _  _  H  _  _  _
  // C  _  _  H  H  _  _
  const sc = cf.searchBestMove()
  // console.log('eval 6', sc, )
  expect(sc.depth).toBeGreaterThanOrEqual(6)
  expect(sc.bestMoves.slice(3).every(({score}) => score === -cf.MAXVAL + 3)).toBeTruthy()
});

test('eval 7', () => {
  initGame('red|264')
  // _  _  _  _  _  _  _
  // _  _  C  _  _  _  _
  // _  _  H  _  H  _  _
  const sc = cf.searchBestMove()
  const m = sc.bestMoves
  // console.log('eval 7', sc)
  expect(sc.depth).toBeGreaterThanOrEqual(8)
  expect(m[0].move === 1 || m[0].move === 3 || m[0].move === 5).toBeTruthy();
  expect(sc.bestMoves.slice(3).every(({score}) => score <= -cf.MAXVAL + 3)).toBeTruthy()
});

test('eval 8', () => {
  initGame('red|')
  const sc = cf.searchBestMove()
  // console.log('eval 8', sc)
  expect(sc.depth).toBeGreaterThanOrEqual(10)
  expect(sc.bestMoves.every(({score}) => score > 0)).toBeTruthy();
});

test('winning 1', () => {
  initGame('red|333332340202244044455556511')
  // _  _  _  H  H  _  _
  // _  _  _  H  C  H  _
  // _  _  H  C  H  H  _
  // C  _  C  H  H  C  _
  // H  H  C  C  C  H  _
  // H  C  C  H  C  C  C
  const sc = cf.searchBestMove()
  // console.log('winning 1', sc)
  expect(sc.depth).toBe(2)
  expect(sc.bestMoves[0].move).toBe(5);
  expect(sc.bestMoves[0].score).toBe(cf.MAXVAL);
});

test('winning 2', () => {
  initGame('red|0606061')
  // _  _  _  _  _  _  _
  // H  _  _  _  _  _  C
  // H  _  _  _  _  _  C
  // H  H  _  _  _  _  C
  const sc = cf.searchBestMove()
  // console.log('winning 2', sc)
  expect(sc.depth).toBe(2)
  expect(sc.bestMoves[0].move).toBe(6);
  expect(sc.bestMoves[0].score).toBe(cf.MAXVAL);
  expect(sc.bestMoves.slice(2).every(({score}) => score === -cf.MAXVAL + 1)).toBeTruthy();
});

test('winning 3', () => {
  initGame('red|03043')
  // _  _  _  _  _  _  _
  // H  _  _  H  _  _  _
  // H  _  _  C  C  _  _
  const sc = cf.searchBestMove()
  // console.log('winning 3'sc)
  expect(sc.depth).toBe(2)
  expect(sc.bestMoves[0].move === 2 || sc.bestMoves[0].move === 5).toBeTruthy();
  expect(sc.bestMoves[0].score).toBe(cf.MAXVAL - 2);
});

test('winning 4', () => {
  initGame('blue|2242')
  // _  _  _  _  _  _  _
  // _  _  H  _  _  _  _
  // _  _  H  _  _  _  _
  // _  _  C  _  C  _  _
  const sc = cf.searchBestMove()
  // console.log('winning 4', sc)
  expect(sc.depth).toBe(2)
  expect(sc.bestMoves[0].move).toBe(3);
  expect(sc.bestMoves[0].score).toBe(cf.MAXVAL - 2);
});

test('winning 5 - depth 6', () => {
  initGame('red|04030023342')
  // _  _  _  _  _  _  _
  // C  _  _  _  _  _  _
  // H  _  _  H  _  _  _
  // H  _  H  C  C  _  _
  // H  _  H  C  C  _  _
  const sc = cf.searchBestMove()
  // console.log('winning 5', sc)
  expect(sc.depth).toBe(6)
  expect(sc.bestMoves[0].move).toBe(6);
  expect(sc.bestMoves[0].score).toBe(cf.MAXVAL - 6);
});

test('winning 6 - depth 6', () => {
  initGame('red|040323001')
  // _  _  _  _  _  _  _
  // C  _  _  _  _  _  _
  // H  _  _  _  _  _  _
  // H  _  _  C  _  _  _
  // H  H  H  C  C  _  _
  const sc = cf.searchBestMove()
  // console.log('winning 6', sc)
  expect(sc.depth).toBe(6)
  expect(sc.bestMoves[0].move).toBe(2);
  expect(sc.bestMoves[0].score).toBe(cf.MAXVAL - 6);
});

test('winning 7 - depth 8', () => {
  initGame('red|041323233223226361666')
  // _  _  C  C  _  _  _
  // _  _  H  C  _  _  H
  // _  _  H  H  _  _  C
  // _  _  C  C  _  _  H
  // _  C  H  C  _  _  H
  // H  H  H  C  C  _  H
  const sc = cf.searchBestMove()
  // console.log('winning 7', sc)
  expect(sc.depth).toBeGreaterThanOrEqual(8)
  expect(sc.bestMoves[0].move).toBe(6);
  expect(sc.bestMoves[0].score).toBeLessThanOrEqual(cf.MAXVAL - 8);
})

test('winning 8 - depth 10', () => {
  initGame('blue|5443421244553533332222')
  const sc = cf.searchBestMove()
  // console.log('winning 8', sc)
  expect(sc.depth).toBe(10)
  expect(sc.bestMoves[0].move).toBe(4);
  expect(sc.bestMoves[0].score).toBe(cf.MAXVAL - 10);
})

test('winning 9 - depth 8', () => {
  initGame('red|33333535212225510112245514444')
  const sc = cf.searchBestMove()
  // console.log('winning 9', sc)
  expect(sc.depth).toBe(8)
  expect(sc.bestMoves[0].move).toBe(4);
  expect(sc.bestMoves[0].score).toBe(cf.MAXVAL - 8);
})

test('winning 10 - depth 10', () => {
  initGame('blue|5443421244553533332222')
  const sc = cf.searchBestMove()
  // console.log('winning 10', sc)
  expect(sc.bestMoves[0].move).toBe(4);
  expect(sc.bestMoves[0].score).toBe(cf.MAXVAL - 10);
})

test('winning 11 - depth 12', () => {
  initGame('red|3633241003021332110021266')
  const sc = cf.searchBestMove()
  // console.log('winning 11', sc)
  expect(sc.depth).toBe(12)
  expect(sc.bestMoves[0].move).toBe(6);
  expect(sc.bestMoves[0].score).toBe(cf.MAXVAL - 12);
})

test('winning 12 - depth 14', () => {
  initGame('blue|4332330222332211')
  const sc = cf.searchBestMove()
  // console.log('winning 12', sc)
  expect(sc.depth).toBe(14)
  expect(sc.bestMoves[0].move).toBe(4);
  expect(sc.bestMoves[0].score).toBe(cf.MAXVAL - 14);
})

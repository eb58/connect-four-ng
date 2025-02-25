const range = (n) => [...Array(n).keys()];
const cache = (insertCondition = (_) => true, c = {}) => ({
    add: (key, val) => (insertCondition(val) && (c[key] = val), val),
    get: (key) => c[key]
});
const memoize = (f, hash, c = cache()) => (...args) => {
    const h = hash(...args);
    const val = c.get(h);
    return val !== undefined ? val : c.add(h, f(...args));
};
const decorator = (f, decorator) => (...args) => decorator() ? f(...args) : 0;
////////////////////////////////////////////////////////////////////////////////////////////////////////
export var Player;
(function (Player) {
    Player[Player["blue"] = 0] = "blue";
    Player[Player["red"] = 1] = "red";
})(Player || (Player = {})); // AI / human player
////////////////////////////////////////////////////////////////////////////////////////////////////////
const MAXVAL = 1000000;
export const DIM = { NCOL: 7, NROW: 6 };
// const rand8 = () => Math.floor((Math.random() * 255) + 1)
// const rand32 = () => rand8() << 23 | rand8() << 16 | rand8() << 8 | rand8();
// const sideKeys = [rand32(), rand32()]
// const pieceKeys = range(84).map(() => rand32())
// const depthKeys = range(42).map(() => rand32())
const sideKeys = [127938607, 1048855538];
const depthKeys = [2012132760, 1376825350, 1541527030, 2075000490, 1174249057, 1779257161, 1640788463, 1214077343, 704075087, 2021904463, 415505373, 579276056, 829253023, 1239592681, 1713094398, 1808160198, 1825914667, 1608185404, 1353190506, 1547529551, 1577172802, 1221714693, 1923161146, 606324792, 947985324, 787103526, 25555663, 1435339853, 718656395, 766360775, 111898524, 1958194192, 1611929969, 1107139413, 515629452, 1037843955, 2039596067, 341097983, 669420696, 886037943, 1150456883, 777463981];
const pieceKeys = [227019481, 1754434862, 629481213, 887205851, 529032562, 2067323277, 1070040335, 567190488, 468610655, 1669182959, 236891527, 1211317841, 849223426, 1031915473, 315781957, 1594703270, 114113554, 966088184, 2114417493, 340442843, 410051610, 1895709998, 502837645, 2046296443, 1720231708, 1437032187, 80592865, 1757570123, 2063094472, 1123905671, 901800952, 1894943568, 732390329, 401463737, 2055893758, 1688751506, 115630249, 391883254, 249795256, 1341740832, 807352454, 2122692086, 851678180, 1154773536, 64453931, 311845715, 1173309830, 1855940732, 1662371745, 998042207, 2121332908, 1905657426, 873276463, 1048910740, 1181863470, 136324833, 881754029, 1037297764, 1385633069, 2037058967, 398045724, 1522858950, 1892619084, 1364648567, 771375215, 983991136, 260316522, 648466817, 1502780386, 1733680598, 401803338, 2136229086, 718267066, 485772484, 1936892066, 1051148609, 1018878751, 1721684837, 1720651398, 2073094346, 526823540, 1170625524, 465996760, 1587572180];
const hashPiece = (state, sq) => state.hash ^= pieceKeys[sq * (state.side === 1 ? 1 : 2)] ^ sideKeys[state.side === 1 ? 1 : 2];
const computeWinningRows = (r, c, dr, dc) => {
    const row = [];
    const startRow = DIM.NROW - r;
    while (r >= 0 && r < DIM.NROW && c >= 0 && c < DIM.NCOL && row.length < 4) {
        row.push(c + DIM.NCOL * r);
        c += dc;
        r += dr;
    }
    return row.length < 4 ? [] : [{ row, val: (dc === 0) ? 1 : (dr === 0 ? 8 * startRow : 4 * startRow) }];
};
// winning rows - length should be 69 for DIM (7x6)
export const winningRows = range(DIM.NROW).reduce((acc, r) => range(DIM.NCOL).reduce((acc, c) => [
    ...acc,
    ...computeWinningRows(r, c, 0, 1),
    ...computeWinningRows(r, c, 1, 1),
    ...computeWinningRows(r, c, 1, 0),
    ...computeWinningRows(r, c, -1, 1)
], acc), []);
// list of indices on allWinningRows for each field of board
export const winningRowsForFields = range(DIM.NCOL * DIM.NROW).map(i => winningRows.reduce((acc, wr, j) => wr.row.includes(i) ? [...acc, j] : acc, []));
const cmpByScore = (a, b) => b.score - a.score;
const cloneState = (s) => (Object.assign(Object.assign({}, s), { heightCols: [...s.heightCols], winningRowsCounterRed: [...s.winningRowsCounterRed], winningRowsCounterBlue: [...s.winningRowsCounterBlue] }));
const MOVES = [3, 4, 2, 5, 1, 6, 0];
// const winningRowsCounterRed = winningRows.map(() => 0)
// const winningRowsCounterBlue = winningRows.map(() => 0)
const state = {
    heightCols: range(DIM.NCOL).map(() => 0), // height of columns = [0, 0, 0, ..., 0];
    winningRowsCounterRed: winningRows.map(() => 0),
    winningRowsCounterBlue: winningRows.map(() => 0),
    side: Player.blue,
    isMill: false,
    hash: 0,
};
const searchInfo = {
    nodes: 0,
    stopAt: 0,
    depth: 0,
    bestMoves: [],
};
const timeOut = () => Date.now() >= searchInfo.stopAt;
const doMove = (c, state) => {
    const idxBoard = c + DIM.NCOL * state.heightCols[c];
    hashPiece(state, idxBoard);
    const counters = state.side === 1 ? state.winningRowsCounterBlue : state.winningRowsCounterRed;
    winningRowsForFields[idxBoard].forEach(i => counters[i]++);
    state.isMill = winningRowsForFields[idxBoard].some(i => counters[i] >= 4);
    state.heightCols[c]++;
    state.side = state.side === Player.red ? Player.blue : Player.red;
    return state;
};
const undoMove = (c, newState, oldState) => {
    // const idxBoard = c + DIM.NCOL * state.heightCols[c]
    // const counters = state.side === -1 ? winningRowsCounterBlue : winningRowsCounterRed;
    // winningRowsForFields[idxBoard].forEach((i: number) => { // update state of winning rows attached to idxBoard
    //   counters[i]--
    // })
};
const computeScoreOfNode = (state) => ((state.side === Player.blue) ? -1 : 1) * winningRows.reduce((res, wr, i) => res + (state.winningRowsCounterRed[i] > 0 && state.winningRowsCounterBlue[i] > 0 ? 0 : (state.winningRowsCounterBlue[i] - state.winningRowsCounterRed[i]) * wr.val), 0);
let negamax = (state, depth, maxDepth, alpha, beta) => {
    if (state.isMill)
        return -MAXVAL + depth;
    if (MOVES.every(m => state.heightCols[m] >= DIM.NROW))
        return 0;
    if (depth === maxDepth)
        return computeScoreOfNode(state);
    for (const m of MOVES)
        if (state.heightCols[m] < DIM.NROW) {
            const newState = doMove(m, cloneState(state));
            const score = -negamax(newState, depth + 1, maxDepth, -beta, -alpha);
            undoMove(m, newState, state);
            if (score > alpha)
                alpha = score;
            if (alpha >= beta)
                return alpha;
        }
    return alpha;
};
negamax = decorator(negamax, () => (++searchInfo.nodes & 8191) && !timeOut());
negamax = memoize(negamax, (s, depth) => s.hash ^ depthKeys[depth], cache(x => x >= MAXVAL - 50 || x <= -MAXVAL + 50));
// @Injectable({providedIn: 'root'})
export class ConnectFourModelService {
    constructor() {
        this.MAXVAL = MAXVAL;
        this.state = state;
        this.init = () => this.state = cloneState(state);
        this.doMove = (m) => doMove(m, this.state);
        this.isAllowedMove = (c) => this.state.heightCols[c] < DIM.NROW;
        this.searchBestMove = (maxThinkingDuration = 1000, maxDepth = 40) => {
            searchInfo.nodes = 0;
            searchInfo.stopAt = Date.now() + maxThinkingDuration;
            const moves = MOVES.filter(c => this.state.heightCols[c] < DIM.NROW);
            for (let depth = 2; depth <= maxDepth; depth += 2) {
                const bestMoves = [];
                for (let i = 0; i < moves.length; i++) {
                    const score = -negamax(doMove(moves[i], cloneState(this.state)), 0, depth, -MAXVAL, +MAXVAL);
                    bestMoves.push({ move: moves[i], score });
                    if (score > MAXVAL - 50) {
                        searchInfo.depth = depth;
                        searchInfo.bestMoves = bestMoves.sort(cmpByScore);
                        // console.log( `DEPTH:${depth}`, bestMoves.reduce((acc:string, m:MoveType)=>acc+ `${m.move}:${m.score} `,''))
                        return searchInfo;
                    }
                }
                if (timeOut())
                    break;
                searchInfo.depth = depth;
                searchInfo.bestMoves = bestMoves.sort(cmpByScore);
                // console.log(`DEPTH:${depth}`, bestMoves.reduce((acc: string, m: MoveType) => acc + `${m.move}:${m.score} `, ''))
                if (bestMoves.every((m) => m.score < -MAXVAL + 50) // all moves lead to disaster
                    || bestMoves.filter((m) => m.score > -MAXVAL + 50).length === 1 // all moves but one lead to disaster
                )
                    break;
            }
            return searchInfo;
        };
        this.init();
    }
}

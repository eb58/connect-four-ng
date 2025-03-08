const cfEngine = (() => {
  const range = n => [...Array(n).keys()]

  const DIM = {NCOL: 7, NROW: 6};
  const MAXVAL = 1000000
  const Player = {blue: 1, red: 2} // AI / human player

  ////////////////////////////////////////////////////////////////////////////////////////////////////////

  const cache = (insertCondition = _ => true, c = {}) => ({
    add: (key, val) => {
      if (insertCondition(val)) c[key] = val;
      return val
    }, get: key => c[key], clear: () => c = {}, info: (s = "") => `${s}CACHE:${Object.keys(c).length}`
  })
  const CACHE = cache(x => x >= MAXVAL - 50);
  const memoize = (f, hash, c = CACHE) => (...args) => {
    const h = hash(...args);
    const val = c.get(h);
    return val !== undefined ? val : c.add(h, f(...args))
  }
  const decorator = (f, decorator) => (...args) => decorator() ? f(...args) : 0;

  ////////////////////////////////////////////////////////////////////////////////////////////////////////
  const computeWinningRows = (r, c, dr, dc) => { // dr = delta row,  dc = delta col
    const row = [];
    const startRow = DIM.NROW - r;
    while (r >= 0 && r < DIM.NROW && c >= 0 && c < DIM.NCOL && row.length < 4) {
      row.push(c + DIM.NCOL * r);
      c += dc;
      r += dr;
    }
    return row.length < 4 ? [] : [{row, val: (dc === 0) ? 1 : (dr !== 0 ? 4 : 8) * startRow}];
  }

  // winning rows - length should be 69 for DIM (7x6)
  const winningRows = range(DIM.NROW).reduce((acc, r) => range(DIM.NCOL).reduce((acc, c) => [...acc, ...computeWinningRows(r, c, 0, 1), ...computeWinningRows(r, c, 1, 1), ...computeWinningRows(r, c, 1, 0), ...computeWinningRows(r, c, -1, 1)], acc), [])

  // list of indices on allWinningRows for each field of board
  const winningRowsForFields = range(DIM.NCOL * DIM.NROW).map(i => winningRows.reduce((acc, wr, j) => wr.row.includes(i) ? [...acc, j] : acc, []))

  ////////////////////////////////////////////////////////////////////////////////////////////////////////

  /*
  const rand8 = () => Math.floor((Math.random() * 255) + 1)
  const rand32 = () => rand8() << 23 | rand8() << 16 | rand8() << 8 | rand8();
  const sideKeys = [rand32(), rand32()]
  const pieceKeys = range(84).map(() => rand32())
  */
  const sideKeys = [127938607, 1048855538]
  const pieceKeys = [227019481, 1754434862, 629481213, 887205851, 529032562, 2067323277, 1070040335, 567190488, 468610655, 1669182959, 236891527, 1211317841, 849223426, 1031915473, 315781957, 1594703270, 114113554, 966088184, 2114417493, 340442843, 410051610, 1895709998, 502837645, 2046296443, 1720231708, 1437032187, 80592865, 1757570123, 2063094472, 1123905671, 901800952, 1894943568, 732390329, 401463737, 2055893758, 1688751506, 115630249, 391883254, 249795256, 1341740832, 807352454, 2122692086, 851678180, 1154773536, 64453931, 311845715, 1173309830, 1855940732, 1662371745, 998042207, 2121332908, 1905657426, 873276463, 1048910740, 1181863470, 136324833, 881754029, 1037297764, 1385633069, 2037058967, 398045724, 1522858950, 1892619084, 1364648567, 771375215, 983991136, 260316522, 648466817, 1502780386, 1733680598, 401803338, 2136229086, 718267066, 485772484, 1936892066, 1051148609, 1018878751, 1721684837, 1720651398, 2073094346, 526823540, 1170625524, 465996760, 1587572180]

////////////////////////////////////////////////////////////////////////////////////////////////////////

  let STATE   // state that is used for evaluating

  const init = (player = Player.blue) => STATE = ({
    heightCols: range(DIM.NCOL).map(() => 0),
    winningRowsCounterRed: winningRows.map(() => 0),
    winningRowsCounterBlue: winningRows.map(() => 0),
    side: player,
    isMill: false,
    cntMoves: 0,
    hash: 0,
  })

  const MOVES = [3, 4, 2, 5, 1, 6, 0];

  const searchInfo = {
    nodes: 0, stopAt: 0, depth: 0, bestMoves: [],
  }

  const timeOut = () => Date.now() >= searchInfo.stopAt

  const doMove = (c, state = STATE) => {
    const idxBoard = c + DIM.NCOL * state.heightCols[c]
    state.heightCols[c]++;
    state.side = state.side === Player.red ? Player.blue : Player.red;
    const counters = state.side === Player.blue ? state.winningRowsCounterBlue : state.winningRowsCounterRed;
    winningRowsForFields[idxBoard].forEach(i => ++counters[i] >= 4)
    state.isMill = winningRowsForFields[idxBoard].some(i => counters[i] >= 4)
    state.hash ^= pieceKeys[idxBoard * state.side] ^ sideKeys[state.side];
    state.cntMoves++
    return state;
  }

  const undoMove = (c, state) => {
    --state.heightCols[c];
    state.cntMoves--
    const idxBoard = c + DIM.NCOL * state.heightCols[c]
    state.hash ^= pieceKeys[idxBoard * state.side] ^ sideKeys[state.side];
    const counters = state.side === Player.blue ? state.winningRowsCounterBlue : state.winningRowsCounterRed;
    winningRowsForFields[idxBoard].forEach((i) => counters[i]--)
    state.side = state.side === Player.red ? Player.blue : Player.red;
    state.isMill = false
  }

  const computeScoreOfNode = (state) => {
    const x = winningRows.reduce((res, wr, i) => res + (state.winningRowsCounterRed[i] > 0 && state.winningRowsCounterBlue[i] > 0 ? 0 : (state.winningRowsCounterBlue[i] - state.winningRowsCounterRed[i])), 0)
    return state.side === Player.blue ? -x : x
  }

  let negamax = (state, depth, maxDepth, alpha, beta, moves) => {
    if (state.isMill) return -MAXVAL + depth
    if (depth === maxDepth) return 0// computeScoreOfNode(state);
    if (state.cntMoves === 42) return 0
    for (const m of moves) if (state.heightCols[m] < DIM.NROW) {
      const score = -negamax(doMove(m, state), depth + 1, maxDepth, -beta, -alpha, moves)
      undoMove(m, state)
      if (score > alpha) alpha = score;
      if (alpha >= beta) return alpha;
    }
    return alpha;
  }
  negamax = memoize(negamax, s => s.hash);
  negamax = decorator(negamax, () => ++searchInfo.nodes & 65535 || !timeOut())

  const prepareResult = (depth, bestMoves) => {
    searchInfo.depth = depth
    searchInfo.bestMoves = bestMoves.sort((a, b) => b.score - a.score)
    // console.log(`DEPTH:${depth} { ${bestMoves.reduce((acc, m) => acc + `${m.move}:${m.score} `, '')}} NODES:${searchInfo.nodes} ${Date.now() - searchInfo.startAt + 'ms'} ${CACHE.info()}`)
    return searchInfo
  }

  const searchBestMove = (opts) => {
    opts = {maxThinkingTime: 1000, maxDepth: 40, ...opts,}
    CACHE.clear()
    searchInfo.nodes = 0
    searchInfo.startAt = Date.now()
    searchInfo.stopAt = searchInfo.startAt + opts.maxThinkingTime;

    const moves = MOVES.filter(c => STATE.heightCols[c] < DIM.NROW);
    for (let depth = 4; depth <= opts.maxDepth; depth += 2) {
      const bestMoves = []
      for (let i = 0; i < moves.length; i++) {
        const score = -negamax(doMove(moves[i], STATE), 0, depth, -MAXVAL, +MAXVAL, moves)
        undoMove(moves[i], STATE)
        if (timeOut()) break;
        bestMoves.push({move: moves[i], score});
        if (score > MAXVAL - 50) return prepareResult(depth, bestMoves)
      }
      if (timeOut()) break;
      prepareResult(depth, bestMoves);
      if (bestMoves.every((m) => m.score < -MAXVAL + 50)                // all moves lead to disaster
        || bestMoves.filter((m) => m.score > -MAXVAL + 50).length === 1 // all moves but one lead to disaster
      ) break;
    }
    return searchInfo;
  }
  init();
  return {
    winningRows, winningRowsForFields, DIM, MAXVAL, Player,
    init, doMove, searchBestMove,
    isAllowedMove: c => STATE.heightCols[c] < DIM.NROW && !STATE.isMill && STATE.cntMoves !== DIM.NROW * DIM.NCOL,
    getHeightOfCol: c => STATE.heightCols[c],
    side: () => STATE.side,
    isMill: () => STATE.isMill,
    isDraw: () => STATE.cntMoves === DIM.NROW * DIM.NCOL && !STATE.isMill,
  }
})()

if (typeof module !== 'undefined') module.exports = cfEngine;

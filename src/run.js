import {ConnectFourEngine, Player,} from './app/services/connect-four-engine.js';

const cf = new ConnectFourEngine()

const fen = 'blue|3'
cf.state.side = fen.split('|')[0] === 'blue' ? Player.blue : Player.red
fen.split('|')[1].split('').map(x => +x).forEach(v => cf.doMove(v));

const sc = cf.searchBestMove({maxThinkingTime: 10000})

console.log(`DEPTH:${sc.depth} { ${sc.bestMoves.reduce((acc, m) => acc + `${m.move}:${m.score} `, '')}} NODES:${sc.nodes} ${Date.now() - sc.startAt + 'ms'} `)

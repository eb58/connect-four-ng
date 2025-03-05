const connectFourEngine = require('./app/services/connect-four-engine.js')
const cf = connectFourEngine
const fen = 'blue|3'

cf.getState().side = fen.split('|')[0] === 'blue' ? cf.Player.blue : cf.Player.red
fen.split('|')[1].split('').map(x => +x).forEach(v => cf.doMove(v));

const sc = cf.searchBestMove({maxThinkingTime: 100})

console.log(`DEPTH:${sc.depth} { ${sc.bestMoves.reduce((acc, m) => acc + `${m.move}:${m.score} `, '')}} NODES:${sc.nodes} ${Date.now() - sc.startAt + 'ms'} `)

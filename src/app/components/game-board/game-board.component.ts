import {Component} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {filter, Observable} from 'rxjs';
import {ConnectFourModelService, DIM} from '../../services/connect4-model.service';
import {InfoDialog} from '../info-dialog/info-dialog.component';
import {QuestionDialog} from '../question-dialog/question-dialog.component';
import {SettingsDialog} from '../settings-dialog/settings-dialog.component';

const range = (n: number) => [...Array(n).keys()]
const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
const randomIntInRange = (min: number, max: number) => Math.floor(randomInRange(min, max + 1));

type Player = 'human' | 'ai'

export type GameSettings = {
  whoBegins: Player,
  maxDepth: number,     // skill level
}

@Component({
  selector: 'app-game-board',
  templateUrl: './game-board.component.html',
  styleUrls: ['./game-board.component.css']
})
export class GameBoardComponent {
  gameSettings = JSON.parse(localStorage.getItem('connect-4-settings') || 'false') || {whoBegins: 'human', maxDepth: 6};
  info = 'Bitte klicke in die Spalte, in die du einen Stein einwerfen möchtest.'

  NROW = range(DIM.NROW).reverse();
  NCOL = range(DIM.NCOL);

  moves: number[] = []
  board: string[] = []
  aiBeginner = false;
  thinking = false;

  constructor(private readonly cf: ConnectFourModelService, public dialog: MatDialog) {
    this.init()
    if (this.gameSettings.whoBegins === 'ai') {
      this.cf.state.aiTurn = true
      this.actAsAI()
    }
  }

  init = () => {
    this.moves = [];
    this.aiBeginner = this.gameSettings.whoBegins == 'ai'
    this.board = range(DIM.NROW * DIM.NCOL).map(() => ' ');
  }

  isMill = (): boolean => this.cf.state.isMill
  isDraw = (): boolean => this.cf.state.cntActiveWinningRows === 0 && !this.cf.state.isMill
  doMove = (m: number) => {
    this.board[m + DIM.NCOL * (this.cf.state.heightCols[m])] = this.cf.state.aiTurn ? 'C' : 'H';
    this.moves.push(m);
    this.cf.doMove(m);
  }
  undoMove = () => this.restart(this.moves.slice(0, -2))

  openInfoDialog = (info: string) => this.dialog.open(InfoDialog, {data: {title: 'Info', info}});
  openQuestionDialog = (question: string): Observable<string> => this.dialog.open(QuestionDialog, {
    data: {
      title: 'Frage',
      question
    }
  }).afterClosed()
  openSettingsDialog = (gameSettings: GameSettings): Observable<GameSettings> => this.dialog.open(SettingsDialog, {data: gameSettings}).afterClosed()

  onClick = (c: number) => {
    if (this.thinking) return
    if (this.isMill()) this.info = 'Das Spiel ist zuende. Glückwunsch, du hast gewonnen.'
    else if (this.isDraw()) this.info = 'Das Spiel ist unentschieden ausgegangen.'

    this.info = `Dein letzter Zug: Spalte ${c + 1}`
    if (this.cf.colHeight(c) >= DIM.NROW) return;
    this.doMove(c)
    if (this.isMill()) this.openInfoDialog('Gratuliere, du hast gewonnen!');
    else if (this.isDraw()) this.openInfoDialog('Gratuliere, du hast ein Remis geschafft!');
    else this.actAsAI()
  }

  actAsAI = () => {
    if (this.moves.length <= 1) {
      const m = randomIntInRange(0, 6)
      this.doMove(m)
      this.info = `Mein letzter Zug: Spalte ${m + 1}`
      return
    }

    this.thinking = true
    setTimeout(() => {
      const sc = this.cf.searchBestMove(50, 1000)
      const bestMoves = sc.bestMoves
      const scores = bestMoves.map(m => `${m.move + 1}:${m.score}`).join(' ')
      this.thinking = false
      this.doMove(bestMoves[0].move)
      console.log(`DEPTH:${sc.depth} NODES:${sc.nodes} DURATION:${sc.duration} WRS:${sc.state.cntActiveWinningRows} SCORES:${scores} BOARD:${(this.aiBeginner ? 'C' : 'H') + '|' + this.board.join('').trim()}`)
      this.info = `Mein letzter Zug: Spalte ${bestMoves[0].move + 1}`
      if (this.isMill()) this.openInfoDialog('Bedaure, du hast verloren!');
      else if (this.isDraw()) this.openInfoDialog('Gratuliere, du hast ein Remis geschafft!');
    }, 10)
  }

  restart = (moves: number[] = []) => {
    this.init();
    this.cf.init()
    this.cf.state.aiTurn = this.gameSettings.whoBegins === 'ai'
    moves.forEach(v => this.doMove(v));
    if (this.cf.state.aiTurn) setTimeout(() => this.doMove(this.cf.calcScoresOfMoves().bestMoves[0].move), 100)
  }

  restartGame = () => {
    this.info = ''
    this.openQuestionDialog('Wirklich neu starten?')
      .pipe(filter(res => res === 'ja'))
      .subscribe(() => {
        let moves: number[];
        // begin - just for test
        moves = [3, 4, 3, 2, 3, 3, 3, 6, 4, 0, 2, 3, 2, 2, 4, 4, 5]
        // moves = [2, 6, 2, 4, 2, 2, 4, 3, 5, 3, 3, 3, 3, 4, 5, 4, 4, 2, 3, 2, 4, 1, 6, 5, 5]
        // moves = [2, 6, 2, 4, 2, 2, 4, 3, 5, 3, 3, 3, 3, 4, 5, 4, 4, 2, 3, 2, 4, 1, 6, 5, 5]
        // moves = [0, 4, 1, 3, 2, 3, 2, 3, 3, 2, 2, 3, 2, 2, 6, 3, 6, 1, 6, 6, 6], this.gameSettings = { whoBegins: 'human', maxDepth: 12 };
        // moves = [3, 3, 0, 3, 0, 3, 3, 0]
        // moves = [3, 2, 3, 3, 3, 6, 3, 6, 3, 6, 6, 2, 1, 2, 2, 2, 2, 6, 6, 5, 5, 5, 5, 4, 5, 5, 0, 0, 0, 0, 0, 0, 1, 1, 1, 4, 4, 4, 1, 4]
        // moves = [3, 2, 3, 3, 3, 6, 3, 6, 3, 6, 6, 2, 1, 2, 2, 2, 2, 6, 6, 5, 5, 5, 5, 4, 5, 5, 0, 0, 0, 0, 0, 0, 1, 1, 1, 4, 4, 4]
        // moves = [3, 3, 3, 3, 3, 2, 3, 4, 0, 2, 0, 2, 2, 4, 4, 0, 4, 4, 4, 5, 5, 5, 5, 6]
        // moves = [3, 3, 3, 3, 3, 2, 3, 4, 0, 2, 0, 2, 2, 4, 4, 0, 4, 4, 4, 5, 5, 5, 5, 2]
        // end - just for test
        this.restart(moves)
      })
  }

  openSettings = () => this.openSettingsDialog(this.gameSettings)
    .pipe(filter(res => !!res))
    .subscribe(res => {
      this.gameSettings = res
      localStorage['connect-4-settings'] = JSON.stringify(res)
    })

  getClass = (row: number, col: number): string => {
    const x = col + DIM.NCOL * row;
    const lastMove = this.moves[this.moves.length - 1];
    const idx = lastMove + DIM.NCOL * (this.cf.state.heightCols[lastMove] - 1);

    if (this.board[x] === 'H') return x == idx ? 'humanx' : 'human'
    if (this.board[x] === 'C') return x == idx ? 'aix' : 'ai'
    return ''
  }
}

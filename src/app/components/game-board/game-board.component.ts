import {Component} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {filter, Observable} from 'rxjs';
import {ConnectFourModelService, DIM, Player, SearchInfo} from '../../services/connect4-model.service';
import {InfoDialog} from '../info-dialog/info-dialog.component';
import {QuestionDialog} from '../question-dialog/question-dialog.component';
import {SettingsDialog} from '../settings-dialog/settings-dialog.component';

const range = (n: number) => [...Array(n).keys()]

export type GameSettings = {
  beginner: Player,
  maxThinkingTime: number,
}

@Component({
  selector: 'app-game-board',
  templateUrl: './game-board.component.html',
  styleUrls: ['./game-board.component.css']
})
export class GameBoardComponent {
  settings = localStorage.getItem('connect-4-settings') || 'false'
  gameSettings: GameSettings = JSON.parse(this.settings) || {beginner: -1, maxThinkingTime: 100};
  info = 'Bitte klicke in die Spalte, in die du einen Stein einwerfen möchtest.'

  NROW = range(DIM.NROW).reverse();
  NCOL = range(DIM.NCOL);

  moves: number[] = []
  board: string[] = []
  beginner: Player = -1;
  thinking = false;
  hintStr = '';

  constructor(private readonly cf: ConnectFourModelService, public dialog: MatDialog) {
    this.init()
    if (this.gameSettings.beginner === 1) {
      this.cf.state.side = 1
      this.actAsAI()
    }
  }

  init = () => {
    this.moves = [];
    this.beginner = this.gameSettings.beginner
    this.board = range(DIM.NROW * DIM.NCOL).map(() => ' ');
  }

  isMill = (): boolean => this.cf.state.isMill
  isDraw = (): boolean => this.cf.state.cntActiveWinningRows === 0 && !this.cf.state.isMill
  doMove = (m: number) => {
    this.board[m + DIM.NCOL * (this.cf.state.heightCols[m])] = this.cf.state.side === 1 ? 'blue' : 'red';
    this.moves.push(m);
    this.cf.doMove(m);
  }
  undoMove = () => this.restart(this.moves.slice(0, -2), this.beginner)

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
    if (!this.cf.isAllowedMove(c)) return;
    this.doMove(c)
    if (this.isMill()) this.openInfoDialog('Gratuliere, du hast gewonnen!');
    else if (this.isDraw()) this.openInfoDialog('Gratuliere, du hast ein Remis geschafft!');
    else this.actAsAI()
    this.hintStr = ''
  }

  actAsAI = () => {
    this.hintStr = ''
    this.thinking = true
    setTimeout(() => {
      const sc = this.cf.searchBestMove(this.gameSettings.maxThinkingTime)
      const bestMoves = sc.bestMoves
      this.thinking = false
      console.log(this.infoStr(sc))
      this.doMove(bestMoves[0].move)
      this.info = `Mein letzter Zug: Spalte ${bestMoves[0].move + 1}`
      if (this.isMill()) this.openInfoDialog('Bedaure, du hast verloren!');
      else if (this.isDraw()) this.openInfoDialog('Gratuliere, du hast ein Remis geschafft!');
    }, 10)
  }

  restart = (moves: number[] = [], side: Player) => {
    this.init();
    this.cf.init()
    this.cf.state.side = side
    this.beginner = side
    moves.forEach(v => this.doMove(v));
    if (this.cf.state.side === 1) this.actAsAI()
  }

  initGame = (game: string) => {
    const x = game.trim().split('|')
    this.restart(x[1].split('').map(x => +x), x[0] === 'blue' ? 1 : -1)
  }

  restartGame = () => {
    this.info = ''
    this.openQuestionDialog('Wirklich neu starten?')
      .pipe(filter(res => res === 'ja'))
      .subscribe(() => {
        // this.initGame('blue|23323233202030002065565')
        // this.initGame('blue|5443421244553533332222')
        this.initGame(' blue|433233022233221144444666')
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

    if (this.board[x] === 'red') return x == idx ? 'redx' : 'red'
    if (this.board[x] === 'blue') return x == idx ? 'bluex' : 'blue'
    return ''
  }

  infoStr = (sc: SearchInfo): string => {
    const scores = sc.bestMoves.map(m => `${m.move + 1}:${m.score}`).join(' ')
    return `DEPTH:${sc.depth} NODES:${sc.nodes} SCORES:${scores} BOARD:${(this.beginner) + '|' + this.moves.join('').trim()}`
  }

  hint() {
    this.thinking = true
    setTimeout(() => {
      const sc = this.cf.searchBestMove(this.gameSettings.maxThinkingTime)
      this.thinking = false
      console.log(this.infoStr(sc))
      this.hintStr = `Bester Zug - Spalte ${sc.bestMoves[0].move + 1}`
    }, 10)
  }
}

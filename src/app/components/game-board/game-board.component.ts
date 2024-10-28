import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, filter } from 'rxjs';
import { ConnectFourModelService, DIM, FieldOccupiedType, range } from '../../services/connect4-model.service';
import { InfoDialog } from '../info-dialog/info-dialog.component';
import { QuestionDialog } from '../question-dialog/question-dialog.component';
import { SettingsDialog } from '../settings-dialog/settings-dialog.component';
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
  gameSettings = JSON.parse(localStorage.getItem('connect-4-settings') || 'false') || { whoBegins: 'human', maxDepth: 6 };
  info = 'Bitte klicke in die Spalte, in die du einen Stein einwerfen möchtest.'

  NROW = range(DIM.NROW);
  NCOL = range(DIM.NCOL);
  thinking = false;

  constructor(private readonly cf: ConnectFourModelService, public dialog: MatDialog) {
    if (this.gameSettings.whoBegins === 'ai') {
      this.cf.state.aiTurn = true
      this.actAsAI()
    }
  }

  openInfoDialog = (info: string) => this.dialog.open(InfoDialog, { data: { title: 'Info', info } });
  openQuestionDialog = (question: string): Observable<string> => this.dialog.open(QuestionDialog, { data: { title: 'Frage', question } }).afterClosed()
  openSettingsDialog = (gameSettings: GameSettings): Observable<GameSettings> => this.dialog.open(SettingsDialog, { data: gameSettings }).afterClosed()

  onClick = (c: number) => {
    if (this.thinking) return
    if (this.cf.state.aiTurn) { this.info = ' Du bist nicht am Zug'; return; }
    if (this.cf.isMill()) this.info = 'Das Spiel ist zuende. Glückwunsch, du hast gewonnen.'
    if (this.cf.isDraw()) this.info = 'Das Spiel ist unentschieden ausgegangen.'

    const idxBoard = c + DIM.NCOL * this.cf.state.heightCols[c]
    if (0 > idxBoard || idxBoard > DIM.NCOL * DIM.NROW) { this.info = 'Kein erlaubter Zug'; return }

    this.info = `Dein letzter Zug: Spalte ${c + 1}`
    this.cf.doMove(c)
    if (this.cf.isMill()) { this.openInfoDialog('Gratuliere, du hast gewonnen!'); return }
    if (this.cf.isDraw()) { this.openInfoDialog('Gratuliere, du hast ein Remis geschafft!'); return }
    this.actAsAI()
  }

  actAsAI = () => {
    if (this.cf.state.moves.length <= 2) {
      const m = randomIntInRange(0, 6)
      this.cf.doMove(m)
      this.info = `Mein letzter Zug: Spalte ${m + 1}`
      return
    }

    this.thinking = true
    setTimeout(() => {
      const depth = this.gameSettings.maxDepth
        + (this.cf.state.moves.length > 10 ? 2 : 0)
        + (this.cf.state.moves.length > 20 ? 2 : 0)
        + (this.cf.state.moves.length > 25 ? 2 : 0)
      const bestMoves = this.cf.calcScoresOfMoves(depth)
      this.thinking = false
      console.log(`SCORES:, ${bestMoves.reduce((acc, m) => acc + `${m.move + 1}:${m.score} `, '')}, DEPTH:${depth}, MOVES:[${this.cf.state.moves.join(',')}]`)
      this.cf.doMove(bestMoves[0].move)
      this.info = `Mein letzter Zug: Spalte ${bestMoves[0].move + 1}`
      if (this.cf.isMill()) this.openInfoDialog('Bedaure, du hast verloren!');
      if (this.cf.isDraw()) this.openInfoDialog('Gratuliere, du hast ein Remis geschafft!');
    }, 500)
  }

  restart = (gameSettings: GameSettings, moves: number[] = []) => {
    this.cf.init()
    this.cf.state.aiTurn = gameSettings.whoBegins === 'ai'
    this.cf.doMoves(moves)
    if (this.cf.state.aiTurn) setTimeout(() => {
      const x = this.cf.calcScoresOfMoves(gameSettings.maxDepth)[0]
      console.log(JSON.stringify(x))
      this.cf.doMove(x.move)
    }, 100)
  }

  undoMove = () => {
    this.info = ''
    this.restart(this.gameSettings, this.cf.state.moves.slice(0, -2))
  }

  restartGame = () => {
    this.info = ''
    this.openQuestionDialog('Wirklich neu starten?')
      .pipe(filter(res => res === 'ja'))
      .subscribe(() => {
        let moves: number[] = []
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
        this.restart(this.gameSettings, moves)
      })
  }

  openSettings = () => this.openSettingsDialog(this.gameSettings)
    .pipe(filter(res => !!res))
    .subscribe(res => {
      this.gameSettings = res
      localStorage['connect-4-settings'] = JSON.stringify(res)
    })

  getClass = (row: number, col: number): string => {
    const x = col + DIM.NCOL * (DIM.NROW - row - 1);
    if (this.cf.state.board[x] === FieldOccupiedType.human) return 'human'
    if (this.cf.state.board[x] === FieldOccupiedType.ai) return 'ai'
    return ''
  }
}
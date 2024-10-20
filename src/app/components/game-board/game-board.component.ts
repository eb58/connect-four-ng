import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, filter } from 'rxjs';
import { GameSettings, ConnectFourModelService } from '../../services/connect4-model.service';
import { DIM, FieldOccupiedType, range } from '../../services/connect4-model-static.service';
import { InfoDialog } from '../info-dialog/info-dialog.component';
import { QuestionDialog } from '../question-dialog/question-dialog.component';
import { SettingsDialog } from '../settings-dialog/settings-dialog.component';
const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
const randomIntInRange = (min: number, max: number) => Math.floor(randomInRange(min, max + 1));

@Component({
  selector: 'app-game-board',
  templateUrl: './game-board.component.html',
  styleUrls: ['./game-board.component.css']
})
export class GameBoardComponent {
  gameSettings = JSON.parse(localStorage.getItem('connect-4-settings') || '') || { whoBegins: 'human', maxDepth: 6 };
  info = 'Bitte klicke in die Spalte, in die du einen Stein einwerfen möchtest.'

  NROW = range(DIM.NROW);
  NCOL = range(DIM.NCOL);
  thinking = false;

  constructor(private readonly vg: ConnectFourModelService, public dialog: MatDialog) {
    if (this.gameSettings.whoBegins === 'ai') {
      this.vg.state.whoseTurn = 'ai'
      this.actAsAI()
    }
  }

  openInfoDialog = (info: string) => this.dialog.open(InfoDialog, { data: { title: 'Info', info } });
  openQuestionDialog = (question: string): Observable<string> => this.dialog.open(QuestionDialog, { data: { title: 'Frage', question } }).afterClosed()
  openSettingsDialog = (gameSettings: GameSettings): Observable<GameSettings> => this.dialog.open(SettingsDialog, { data: gameSettings }).afterClosed()

  onClick = (c: number) => {
    if (this.thinking) return
    this.info = ''

    if (this.vg.isDraw()) { this.info = 'Das Spiel ist unentschieden ausgegangen.'; return }
    if (this.vg.isMill()) { this.info = 'Das Spiel ist zuende. Glückwunsch, du hast gewonnen.'; return }

    if (this.vg.state.whoseTurn !== 'human') { this.info = 'Du bist nicht am Zug'; return; }

    const idxBoard = c + DIM.NCOL * this.vg.state.heightCols[c]
    if (0 > idxBoard || idxBoard > DIM.NCOL * DIM.NROW) { this.info = 'Kein erlaubter Zug'; return }

    this.info = `Dein letzter Zug: Spalte ${c + 1}`
    this.vg.move(c)
    if (this.vg.isDraw()) { this.openInfoDialog('Gratuliere, du hast ein Remis geschafft!'); return }
    if (this.vg.isMill()) { this.openInfoDialog('Gratuliere, du hast gewonnen!'); return }
    this.actAsAI()
  }

  actAsAI = () => {
    if (this.vg.state.moves.length <= 2) {
      const m = randomIntInRange(0, 6)
      this.vg.move(m)
      this.info = `Mein letzter Zug: Spalte ${m+1}`
      return
    }

    this.thinking = true
    setTimeout(() => {
      const bestMoves = this.vg.calcBestMoves(this.gameSettings.maxDepth)
      this.thinking = false
      console.log('SCORES:', bestMoves.reduce((acc, m) => acc + `${m.move + 1}:${m.score} `, ''), this.vg.state.moves.join(','))
      this.vg.move(bestMoves[0].move)
      this.info = `Mein letzter Zug: Spalte ${bestMoves[0].move + 1}`
      if (this.vg.isMill()) this.openInfoDialog('Bedaure, du hast verloren!')
      if (this.vg.isDraw()) this.openInfoDialog('Gratuliere, du hast ein Remis geschafft!');
    }, 500)
  }

  restart = (gameSettings: GameSettings, moves: number[] = []) => {
    this.vg.init()
    this.vg.state.whoseTurn = gameSettings.whoBegins
    this.vg.doMoves(moves)
    if (this.vg.state.whoseTurn === 'ai') setTimeout(() => {
      const x = this.vg.calcBestMoves(gameSettings.maxDepth)[0]
      console.log(JSON.stringify(x))
      this.vg.move(x.move)
    }, 100)
  }

  undoMove = () => {
    this.info = ''
    this.restart(this.gameSettings, this.vg.state.moves.slice(0, -2))
  }

  restartGame = () => {
    this.info = ''
    this.openQuestionDialog('Wirklich neu starten?')
      .pipe(filter(res => res === 'ja'))
      .subscribe(() => {
        let moves: number[] = []
        // just for test begin
        moves = [0, 4, 1, 3, 2, 3, 2, 3, 3, 2, 2, 3, 2, 2, 6, 3, 6, 1, 6, 6, 6], this.gameSettings = { whoBegins: 'human', maxDepth: 12 };
        // moves = [3, 3, 0, 3, 0, 3, 3, 0]   
        // moves = [3, 2, 3, 3, 3, 6, 3, 6, 3, 6, 6, 2, 1, 2, 2, 2, 2, 6, 6, 5, 5, 5, 5, 4, 5, 5, 0, 0, 0, 0, 0, 0, 1, 1, 1, 4, 4, 4, 1, 4]
        // moves = [3, 2, 3, 3, 3, 6, 3, 6, 3, 6, 6, 2, 1, 2, 2, 2, 2, 6, 6, 5, 5, 5, 5, 4, 5, 5, 0, 0, 0, 0, 0, 0, 1, 1, 1, 4, 4, 4]
        // moves = [3, 3, 3, 3, 3, 2, 3, 4, 0, 2, 0, 2, 2, 4, 4, 0, 4, 4, 4, 5, 5, 5, 5, 6]
        // moves = [3, 3, 3, 3, 3, 2, 3, 4, 0, 2, 0, 2, 2, 4, 4, 0, 4, 4, 4, 5, 5, 5, 5, 2]
        // just for test end
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
    if (this.vg.state.board[x] === FieldOccupiedType.human) return 'human'
    if (this.vg.state.board[x] === FieldOccupiedType.ai) return 'ai'
    return ''
  }
}
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, filter } from 'rxjs';
import { GameSettings, ConnectFourModelService } from '../../services/connect4-model.service';
import { DIM, FieldOccupiedType, range } from '../../services/connect4-model-static.service';
import { InfoDialog } from '../info-dialog/info-dialog.component';
import { QuestionDialogComponent } from '../question-dialog/question-dialog.component';
import { SettingsDialogComponent } from '../settings-dialog/settings-dialog.component';

@Component({
  selector: 'app-game-board',
  templateUrl: './game-board.component.html',
  styleUrls: ['./game-board.component.css']
})
export class GameBoardComponent {
  info = 'Bitte klicke in die Spalte, in die du einen Stein einwerfen möchtest.'

  NROW = range(DIM.NROW);
  NCOL = range(DIM.NCOL);

  constructor(private readonly vg: ConnectFourModelService, public dialog: MatDialog) { }

  openInfoDialog = (info: string) => this.dialog.open(InfoDialog, { data: { title: 'Info', info } });
  openQuestionDialog = (question: string): Observable<string> => this.dialog.open(QuestionDialogComponent, { data: { title: 'Frage', question } }).afterClosed()
  openSettingsDialog = (gameSettings: GameSettings): Observable<GameSettings> => this.dialog.open(SettingsDialogComponent, { data: gameSettings }).afterClosed()

  onClick = (c: number) => {
    this.info = ''

    if (this.vg.isDraw()) {
      this.info = 'Das Spiel ist unentschieden ausgegangen.'
      return
    }

    if (this.vg.isMill()) {
      const x = this.vg.state.whoseTurn === 'ai' ? 'Glückwunsch, du hast gewonnen:' : 'Sorry, du hast leider verloren.'
      this.info = 'Das Spiel ist zuende. ' + x
      return
    }

    const idxBoard = c + DIM.NCOL * this.vg.state.heightCols[c]
    if (0 > idxBoard || idxBoard > DIM.NCOL * DIM.NROW) {
      this.info = 'Kein erlaubter Zug';
      return
    }

    if (this.vg.state.whoseTurn === 'human') {
      this.info = `Dein letzter Zug: Spalte ${c + 1}`

      this.vg.move(c)
      if (this.vg.isMill()) this.openInfoDialog('Gratuliere, du hast gewonnen!')
      if (this.vg.isDraw()) this.openInfoDialog('Gratuliere, du hast ein Remis geschafft !');
      if (this.vg.isMill() || this.vg.isDraw()) return

      // AI is drawing
      setTimeout(() => {
        const bestMoves = this.vg.calcBestMoves()
        console.log('SCORES:', bestMoves.reduce((acc, m) => acc + `${m.move + 1}:${m.score} `, ''), this.vg.state.moves.join(','))
        this.vg.move(bestMoves[0].move)
        this.info = `Mein letzter Zug: Spalte ${bestMoves[0].move + 1}`
        if (this.vg.isMill()) this.openInfoDialog('Bedaure, du hast verloren!')
        if (this.vg.isDraw()) this.openInfoDialog('Gratuliere, du hast ein Remis geschafft !');
      }, 100)
    }
  }

  undoMove = () => {
    this.info = ''
    this.vg.undo()
  }

  restartGame = () => {
    let moves: number[] = []
    // just for test begin
    moves = [0, 4, 1, 3, 2, 3, 2, 3, 3, 2, 2, 3, 2, 2, 6, 3, 6, 1, 6, 6, 6], this.vg.gameSettings.maxDepth = 12;
    // moves = [3, 3, 0, 3, 0, 3, 3, 0]   
    // moves = [3, 2, 3, 3, 3, 6, 3, 6, 3, 6, 6, 2, 1, 2, 2, 2, 2, 6, 6, 5, 5, 5, 5, 4, 5, 5, 0, 0, 0, 0, 0, 0, 1, 1, 1, 4, 4, 4, 1, 4]
    // moves = [3, 2, 3, 3, 3, 6, 3, 6, 3, 6, 6, 2, 1, 2, 2, 2, 2, 6, 6, 5, 5, 5, 5, 4, 5, 5, 0, 0, 0, 0, 0, 0, 1, 1, 1, 4, 4, 4]
    // moves = [3, 3, 3, 3, 3, 2, 3, 4, 0, 2, 0, 2, 2, 4, 4, 0, 4, 4, 4, 5, 5, 5, 5, 6]
    // moves = [3, 3, 3, 3, 3, 2, 3, 4, 0, 2, 0, 2, 2, 4, 4, 0, 4, 4, 4, 5, 5, 5, 5, 2]
    // just for test end

    this.info = ''
    this.openQuestionDialog('Wirklich neu starten?')
      .pipe(filter(res => res === 'ja'))
      .subscribe(() => this.vg.restart(moves))
  }

  openSettings = () => this.openSettingsDialog(this.vg.gameSettings)
    .pipe(filter(res => !!res))
    .subscribe(res => this.vg.gameSettings = res)

  getClass = (row: number, col: number): string => {
    const x = col + DIM.NCOL * (DIM.NROW - row - 1);
    if (this.vg.state.board[x] === FieldOccupiedType.human) return 'human'
    if (this.vg.state.board[x] === FieldOccupiedType.ai) return 'ai'
    return ''
  }
}
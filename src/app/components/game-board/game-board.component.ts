import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, filter, tap } from 'rxjs';
import { STATEOFGAME, VgModelService } from '../../services/vg-model.service';
import { DIM, FieldOccupiedType, range } from '../../services/vg-model-static.service';
import { InfoDialog } from '../info-dialog/info-dialog.component';
import { QuestionDialogComponent } from '../question-dialog/question-dialog.component';
import { SettingsDialogComponent, SettingsDialogData } from '../settings-dialog/settings-dialog.component';

@Component({
  selector: 'app-game-board',
  templateUrl: './game-board.component.html',
  styleUrls: ['./game-board.component.css']
})
export class GameBoardComponent {
  info = 'Bitte klicke in die Spalte, in die du einen Stein einwerfen möchtest.'

  NROW = range(DIM.NROW);
  NCOL = range(DIM.NCOL);

  constructor(private readonly vg: VgModelService, public dialog: MatDialog) { }

  openInfoDialog = (info: string) => this.dialog.open(InfoDialog, { data: { title: "Info", info } });
  openQuestionDialog = (question: string): Observable<string> => this.dialog.open(QuestionDialogComponent, { data: { title: "Frage", question } }).afterClosed()
  openSettingsDialog = (stateOfGame: STATEOFGAME): Observable<SettingsDialogData> => this.dialog.open(SettingsDialogComponent, { data: stateOfGame }).afterClosed()

  onClick = (c: number) => {
    this.info = ""

    if (this.vg.isRemis()) {
      this.info = "Das Spiel ist unentschieden ausgegangen."
      return
    }

    if (this.vg.isMill()) {
      const x = this.vg.state.whoseTurn === "ai" ? "Glückwunsch, du hast gewonnen:" : "Sorry, du hast leider verloren."
      this.info = "Das Spiel ist zuende. " + x
      return
    }

    const idxBoard = c + DIM.NCOL * this.vg.state.heightCols[c]
    if (0 > idxBoard || idxBoard > DIM.NCOL * DIM.NROW) {
      this.info = "Kein erlaubter Zug";
      return
    }

    if (this.vg.state.whoseTurn === "human") {
      this.info = `Dein letzter Zug: Spalte ${c + 1}`

      this.vg.move(c)
      if (this.vg.isMill()) this.openInfoDialog("Gratuliere, du hast gewonnen!")
      if (this.vg.isRemis()) this.openInfoDialog("Gratuliere, du hast ein Remis geschafft !");
      if (this.vg.isMill() || this.vg.isRemis()) return

      // Führe Zug für Computer aus:
      setTimeout(() => {
        const bestMove = this.vg.calcBestMove()
        this.vg.move(bestMove.move)
        this.info = `Mein letzter Zug: Spalte ${bestMove.move + 1}`
        if (this.vg.isMill()) this.openInfoDialog("Bedaure, du hast verloren!")
        if (this.vg.isRemis()) this.openInfoDialog("Gratuliere, du hast ein Remis geschafft !");
      }, 1)
    }
  }

  undoMove = () => {
    this.info = ""
    this.vg.undo()
  }

  restartGame = () => {
    const moves: number[] = []
    // const moves:number[] =  [3, 3, 0, 3, 0, 3, 3, 0]    // just for test
    //const moves:number[] = [3, 2, 3, 3, 3, 6, 3, 6, 3, 6, 6, 2, 1, 2, 2, 2, 2, 6, 6, 5, 5, 5, 5, 4, 5, 5, 0, 0, 0, 0, 0, 0, 1, 1, 1, 4, 4, 4, 1, 4]
    //const moves:number[] = [3, 2, 3, 3, 3, 6, 3, 6, 3, 6, 6, 2, 1, 2, 2, 2, 2, 6, 6, 5, 5, 5, 5, 4, 5, 5, 0, 0, 0, 0, 0, 0, 1, 1, 1, 4, 4, 4]
    // const moves: number[] = [3, 3, 3, 3, 3, 2, 3, 4, 0, 2, 0, 2, 2, 4, 4, 0, 4, 4, 4, 5, 5, 5, 5, 6]
    // const moves:number[] = [3, 2, 3, 3, 3, 6, 3, 6, 3, 6, 6, 2, 1, 2, 2, 2, 2, 6, 6, 5, 5, 5, 5, 4, 5, 5, 0, 0, 0, 0, 0, 0, 1, 1, 1, 4, 4, 4]

    this.info = ""
    this.openQuestionDialog("Wirklich neu starten?")
      .pipe(filter((res) => res === "ja"))
      .subscribe(() => this.vg.restart(moves)
      )
  }

  openSettings = () => this.openSettingsDialog(this.vg.stateOfGame)
    .pipe(filter((res) => !!res))
    .subscribe((res: SettingsDialogData) => this.vg.stateOfGame = { whoBegins: res.whoBegins, maxLev: Number(res.maxLev) })

  getClass = (row: number, col: number): string => {
    const x = col + DIM.NCOL * (DIM.NROW - row - 1);
    if (this.vg.state.board[x] === FieldOccupiedType.human) return "human"
    if (this.vg.state.board[x] === FieldOccupiedType.ai) return "computer"
    return ""
  }
}
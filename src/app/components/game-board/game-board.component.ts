import { Component } from '@angular/core';
import { MoveType, STATE, STATEOFGAME, VgModelService } from '../../services/vg-model.service';
import { DIM, FieldOccupiedType, range } from '../../services/vg-model-static.service';
import { InfoDialog } from '../info-dialog/info-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { QuestionDialogComponent } from '../question-dialog/question-dialog.component';
import { Observable, filter } from 'rxjs';
import { SettingsDialogComponent } from '../settings-dialog/settings-dialog.component';

export const doMoves = (vg: VgModelService, moves: number[]) => moves.forEach(v => vg.move(v));

@Component({
  selector: 'app-game-board',
  templateUrl: './game-board.component.html',
  styleUrls: ['./game-board.component.css']
})
export class GameBoardComponent {
  info = 'Bitte klicke in die Spalte, in die du einen Stein einwerfen möchtest.'

  NROW = range(DIM.NROW);
  NCOL = range(DIM.NCOL);

  constructor(private vg: VgModelService, public dialog: MatDialog) {
  }

  openDialog(info: string): void {
    const position = { top: '50%', left: '30%' }
    this.dialog.open(InfoDialog, { position, data: { title: "Info", info } });
  }

  openQuestionDialog(question: string): Observable<any> {
    const position = { top: '50%', left: '30%' }
    const dialogRef = this.dialog.open(QuestionDialogComponent, { position, data: { title: "Frage", question } });
    return dialogRef.afterClosed()
  }

  openSettingsDialog(stateOfGame: STATEOFGAME): Observable<any> {
    const position = { top: '50%', left: '30%' }
    const dialogRef = this.dialog.open(SettingsDialogComponent, { position, data: stateOfGame });
    return dialogRef.afterClosed()
  }

  onClick = (c: number) => {
    this.info = ""
    const isMill = this.vg.state.isMill;
    const isRemis = this.vg.state.moves.length === DIM.NCOL * DIM.NROW

    if (isMill || isRemis) {
      this.info = "Das Spiel ist zuende."
      return 
    }
    if (this.vg.state.whoseTurn === "human") {
      this.vg.move(c)
      if (isMill)  this.openDialog("Gratuliere, du hast gewonnen!")
      if (isRemis) this.openDialog("Gratuliere, du hast ein Remis geschafft !");
      if (isMill || isRemis ) return 

      // Führe Zug für Computer aus:
      const bestMove = this.vg.calcBestMove().move
      this.vg.move(bestMove)
      this.info = `Mein letzter Zug: Spalte ${bestMove + 1}`
      if (isMill) this.openDialog("Bedaure, du hast verloren!")
      if (isRemis) this.openDialog("Gratuliere, du hast ein Remis geschafft !");
    }
  }

  undoMove = () => {
    this.info = ""
    this.vg.undo()
  }

  restartGame = () => {
    this.info = ""
    this.openQuestionDialog("Wirklich neu starten?")
      .pipe(filter(res => res === "ja"))
      .subscribe(() => {
        this.vg.restart()
        // just for test 
        // doMoves(this.vg, [3, 3, 3, 3, 3, 2, 3, 4, 0, 2, 0, 2, 2, 4, 4, 0, 4, 4, 4, 5, 5, 5, 5, 6, 5, 1])
        // doMoves(this.vg,[3, 2, 3, 3, 3, 6, 3, 6, 3, 6, 6, 2, 1, 2, 2, 2, 2, 6, 6, 5, 5, 5, 5, 4, 5, 5, 0, 0, 0, 0, 0, 0, 1, 1, 1, 4, 4, 4])
      })
  }

  openSettings = () => {
    this.openSettingsDialog(this.vg.origStateOfGame)
      .pipe(filter(res => !!res))
      .subscribe(res => this.vg.stateOfGame = res)
  }

  getClass = (row: number, col: number): string => {
    const x = col + DIM.NCOL * (DIM.NROW - row - 1);
    if (this.vg.state.board[x] === FieldOccupiedType.human) return "human"
    if (this.vg.state.board[x] === FieldOccupiedType.computer) return "computer"
    return ""
  }
}
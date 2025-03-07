import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';

export type QuestionDialogData = {
  title: string;
  question: string;
}

@Component({
  selector: 'app-question-dialog',
  templateUrl: './question-dialog.component.html',
})
export class QuestionDialog {
  constructor(
    @Inject(MAT_DIALOG_DATA) public question: QuestionDialogData,
  ) {
  }
}

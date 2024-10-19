import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export type QuestionDialogData =  {
  title: string;
  question: string;
}

@Component({
  selector: 'app-question-dialog',
  templateUrl: './question-dialog.component.html',
})
export class QuestionDialog{
  constructor(
    public dialogRef: MatDialogRef<QuestionDialog>,
    @Inject(MAT_DIALOG_DATA) public question: QuestionDialogData,
  ) { }
}

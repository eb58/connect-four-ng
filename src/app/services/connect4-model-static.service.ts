import { Injectable } from '@angular/core';

export const range = (n: number) => [...Array(n).keys()]
export enum FieldOccupiedType { empty, human, ai, neutral };
export const DIM = { NCOL: 7, NROW: 6 };
export type WinningRow = {
  row?: number[],               // indices of winning row on board
  cnt: number,                  // count of tiles in winning row 
  occupiedBy: FieldOccupiedType // who is occupying winning row 
}

@Injectable({ providedIn: 'root' })
export class ConnectFourModelStaticService {
  allWinningRows: WinningRow[] = []; // winning rows - length should be 69 for DIM (7x6)
  winningRowsForFields: number[][] = []; // list of indices on allWinningRows for each field of board

  constructor() {
    const winningRows:number[][] = range(DIM.NROW).reduce((acc:any, r: number) => range(DIM.NCOL).reduce((acc:any, c: number) => [
      ...acc,
      ...this.computeWinningRows(r, c, 0, 1),
      ...this.computeWinningRows(r, c, 1, 1),
      ...this.computeWinningRows(r, c, 1, 0),
      ...this.computeWinningRows(r, c, -1, 1)
    ], acc), [])
    this.winningRowsForFields = range(DIM.NCOL * DIM.NROW).map(i => winningRows.reduce((acc: number[], r, j) => r.includes(i) ? [...acc, j] : acc, []))
    this.allWinningRows = winningRows.map(() => ({ cnt: 0, occupiedBy:  FieldOccupiedType.empty }))
  }

  computeWinningRows = (r: number, c: number, dr: number, dc: number): number[][] => { // dr = delta row,  dc = delta col
    const row = [];
    while (r >= 0 && r < DIM.NROW && c >= 0 && c < DIM.NCOL && row.length < 4) { row.push(c + DIM.NCOL * r); c += dc; r += dr; }
    return row.length < 4 ? [] : [row];
  }
}

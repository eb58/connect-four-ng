import { TestBed } from '@angular/core/testing';
import { ConnectFourModelStaticService } from '../app/services/connect4-model-static.service';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('VgModelStaticService', () => {
  let service: ConnectFourModelStaticService;

  beforeEach(() => {
    TestBed.configureTestingModule({ schemas: [CUSTOM_ELEMENTS_SCHEMA] });
    service = TestBed.inject(ConnectFourModelStaticService);
  });

  test('should be created', () => expect(service).toBeTruthy());
  test('should be initialized correctly', () => {
    expect(service.allWinningRows.length).toBe(69)
    expect(service.winningRowsForFields.length).toBe(42)
    expect(service.winningRowsForFields[0]).toEqual([0, 1, 2])
    expect(service.winningRowsForFields[1]).toEqual([0, 3, 4, 5])
    expect(service.winningRowsForFields[10]).toEqual([7, 11, 15, 18, 21, 24, 25, 26, 48, 54])
  })
});

import { Component } from '@angular/core';
import { ConnectFourModelService } from './services/connect4-model.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Connect four';
  constructor(private vg: ConnectFourModelService){}
}

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastrModule } from 'ngx-toastr';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastrModule],
  template: '<router-outlet></router-outlet>',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'demo-nested-expandable-table';
}

import { Component } from '@angular/core';
import { TimeService } from '@app/services/time/time.service';

@Component({
    selector: 'app-alert',
    templateUrl: './alert.component.html',
    styleUrls: ['./alert.component.scss'],
})
export class AlertComponent {
    alertSymbol: string;

    constructor(public timeService: TimeService) {}
}

// https://stackblitz.com/edit/3-dots-loader-mvp?file=src%2Fapp%2Fapp.component.html
import { Component, Input } from '@angular/core';
import { PulseLoaderOptions } from '@common/constants/pulse-loader-options';

@Component({
    selector: 'app-pulse-loader',
    templateUrl: './pulse-loader.component.html',
    styleUrls: ['./pulse-loader.component.scss'],
})
export class PulseLoaderComponent {
    @Input() width: number = PulseLoaderOptions.WIDTH;
    @Input() height: number = PulseLoaderOptions.HEIGHT;
    @Input() color: string = PulseLoaderOptions.COLOR;
}

// Inspired by stackoverflow.com/questions/35274028/stop-mouse-event-propagation

import { Directive, HostListener } from '@angular/core';

@Directive({
    selector: '[appClickStopPropagation]',
})
export class ClickStopPropagationDirective {
    @HostListener('click', ['$event'])
    onClick(event: MouseEvent): void {
        event.stopPropagation();
    }
}

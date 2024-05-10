// https://medium.com/ngconf/functional-candeactivate-guards-in-angular-2211f5da78c2

import { Observable } from 'rxjs';

export type CanDeactivateType = Observable<boolean> | boolean;

export interface CanComponentDeactivate {
    canDeactivate: () => CanDeactivateType;
}

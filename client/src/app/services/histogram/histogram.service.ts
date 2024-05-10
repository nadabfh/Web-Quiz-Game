import { Injectable } from '@angular/core';
import { SocketHandlerService } from '@app/services/socket-handler/socket-handler.service';
import { Histogram } from '@common/interfaces/histogram';
import { Observable, Subject } from 'rxjs';
@Injectable({
    providedIn: 'root',
})
export class HistogramService {
    currentHistogram$: Observable<Histogram>;
    histogramHistory$: Observable<Histogram[]>;
    private currentHistogramSource = new Subject<Histogram>();
    private histogramHistorySource = new Subject<Histogram[]>();

    constructor(public socketService: SocketHandlerService) {
        this.currentHistogram$ = this.currentHistogramSource.asObservable();
        this.histogramHistory$ = this.histogramHistorySource.asObservable();
    }

    onCurrentHistogram() {
        this.socketService.on('currentHistogram', (data: Histogram) => {
            this.currentHistogramSource.next(data);
        });
    }

    onHistogramHistory() {
        this.socketService.on('histogramHistory', (data: Histogram[]) => {
            this.histogramHistorySource.next(data);
        });
    }
}

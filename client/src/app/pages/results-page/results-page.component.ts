import { Component, OnDestroy, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { Player } from '@app/interfaces/player';
import { ConfettiService } from '@app/services/confetti/confetti.service';
import { HistogramService } from '@app/services/histogram/histogram.service';
import { MatchRoomService } from '@app/services/match-room/match-room.service';
import { GradesHistogram, Histogram, MultipleChoiceHistogram } from '@common/interfaces/histogram';
import { Subscription } from 'rxjs/internal/Subscription';
@Component({
    selector: 'app-results-page',
    templateUrl: './results-page.component.html',
    styleUrls: ['./results-page.component.scss'],
})
export class ResultsPageComponent implements OnInit, OnDestroy {
    isHost: boolean = true;
    pageEvent: PageEvent;
    players: Player[] = [];
    currentQuestionIndex: number = 0;
    histogramsGame: Histogram[] = [];

    private histogramSubscriptions: Subscription[] = [];
    constructor(
        private readonly matchRoomService: MatchRoomService,
        private readonly histogramService: HistogramService,
        private readonly confettiService: ConfettiService,
    ) {}

    get currentMultipleChoiceHistogram(): MultipleChoiceHistogram {
        return this.histogramsGame[this.currentQuestionIndex] as MultipleChoiceHistogram;
    }

    get currentLongAnswerHistogram(): GradesHistogram {
        return this.histogramsGame[this.currentQuestionIndex] as GradesHistogram;
    }

    isQuestionMultipleChoice(): boolean {
        if (this.histogramsGame[this.currentQuestionIndex]) {
            return this.histogramsGame[this.currentQuestionIndex].type === 'QCM';
        }
        return false;
    }

    isQuestionLongAnswer(): boolean {
        if (this.histogramsGame[this.currentQuestionIndex]) {
            return this.histogramsGame[this.currentQuestionIndex].type === 'QRL';
        }
        return false;
    }

    ngOnInit(): void {
        this.players = this.matchRoomService.players;
        this.players.forEach((player) => {
            player.isChatActive = true;
        });
        this.histogramService.onHistogramHistory();
        this.subscribeToHistogramHistory();
        this.confettiService.onWinner();
    }

    ngOnDestroy(): void {
        this.histogramSubscriptions.forEach((subscription) => subscription.unsubscribe());
        this.histogramSubscriptions = [];
    }

    handlePageEvent(event: PageEvent) {
        this.pageEvent = event;
        this.currentQuestionIndex = event.pageIndex;
    }

    handleDisconnect() {
        this.matchRoomService.disconnect();
    }

    private subscribeToHistogramHistory() {
        const histogramHistorySubscription = this.histogramService.histogramHistory$.subscribe((histograms: Histogram[]) => {
            this.histogramsGame = histograms;
        });
        this.histogramSubscriptions.push(histogramHistorySubscription);
    }
}

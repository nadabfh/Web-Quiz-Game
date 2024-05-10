import { TimerDurationEvents } from '@app/constants/timer-events';
import { MatchRoomService } from '@app/services/match-room/match-room.service';
import { Histogram } from '@common/interfaces/histogram';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { QuestionStrategyContext } from '@app/services/question-strategy-context/question-strategy-context.service';
import { HISTOGRAM_UPDATE_TIME_SECONDS } from '@common/constants/match-constants';
import { MatchRoom } from '@app/model/schema/match-room.schema';
import { TimerInfo } from '@common/interfaces/timer-info';
import { HistogramEvents } from '@common/events/histogram.events';

@Injectable()
export class HistogramService {
    constructor(
        private readonly matchRoomService: MatchRoomService,
        private readonly questionStrategyContext: QuestionStrategyContext,
    ) {}

    @OnEvent(TimerDurationEvents.Timer)
    onTimerTick(roomCode: string, currentTimer: TimerInfo) {
        if (!this.matchRoomService.isGamePlaying(roomCode)) return;
        if (this.questionStrategyContext.getQuestionStrategy(roomCode) !== 'QRL') return;
        if (currentTimer.currentTime % HISTOGRAM_UPDATE_TIME_SECONDS === 0) {
            const matchRoom = this.matchRoomService.getRoom(roomCode);
            this.buildHistogram(matchRoom);
        }
    }

    buildHistogram(matchRoom: MatchRoom, choice?: string, selection?: boolean) {
        const histogram: Histogram = this.questionStrategyContext.buildHistogram(matchRoom, choice, selection);
        this.saveHistogram(histogram, matchRoom);
        this.sendHistogram(histogram, matchRoom);
    }

    saveHistogram(histogram: Histogram, matchRoom: MatchRoom) {
        matchRoom.matchHistograms[matchRoom.currentQuestionIndex] = histogram;
    }

    sendHistogramHistory(matchRoomCode: string) {
        const matchRoom = this.matchRoomService.getRoom(matchRoomCode);
        const histograms: Histogram[] = matchRoom.matchHistograms;
        matchRoom.hostSocket.emit(HistogramEvents.HistogramHistory, histograms);
        return histograms;
    }

    resetChoiceTracker(matchRoomCode: string) {
        const matchRoom = this.matchRoomService.getRoom(matchRoomCode);
        if (matchRoom.game.questions.length) {
            const currentQuestion = matchRoom.game.questions[matchRoom.currentQuestionIndex];
            matchRoom.choiceTracker.resetChoiceTracker(currentQuestion.text, currentQuestion.choices);
        }
    }

    sendHistogram(histogram: Histogram, matchRoom: MatchRoom) {
        matchRoom.hostSocket.emit(HistogramEvents.CurrentHistogram, histogram);
    }

    sendEmptyHistogram(roomCode: string) {
        const matchRoom = this.matchRoomService.getRoom(roomCode);
        const histogram: Histogram = this.questionStrategyContext.buildHistogram(matchRoom);
        this.saveHistogram(histogram, matchRoom);
        matchRoom.hostSocket.emit(HistogramEvents.CurrentHistogram, histogram);
    }
}

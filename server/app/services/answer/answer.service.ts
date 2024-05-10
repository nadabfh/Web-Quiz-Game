import { AnswerEvents } from '@common/events/answer.events';
import { ExpiredTimerEvents } from '@app/constants/expired-timer-events';
import { MatchRoom } from '@app/model/schema/match-room.schema';
import { Player } from '@app/model/schema/player.schema';
import { HistogramService } from '@app/services/histogram/histogram.service';
import { MatchRoomService } from '@app/services/match-room/match-room.service';
import { PlayerRoomService } from '@app/services/player-room/player-room.service';
import { TimeService } from '@app/services/time/time.service';
import { Feedback } from '@common/interfaces/feedback';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { LongAnswerInfo } from '@common/interfaces/long-answer-info';
import { AnswerCorrectness } from '@common/constants/answer-correctness';
import { QuestionStrategyContext } from '@app/services/question-strategy-context/question-strategy-context.service';
import { GradingEvents } from '@app/constants/grading-events';
import { PlayerEvents } from '@app/constants/player-events';

@Injectable()
export class AnswerService {
    // Allow more constructor parameters to decouple services
    // eslint-disable-next-line max-params
    constructor(
        private readonly matchRoomService: MatchRoomService,
        private readonly playerService: PlayerRoomService,
        private readonly timeService: TimeService,
        private readonly histogramService: HistogramService,
        private readonly questionStrategyContext: QuestionStrategyContext,
    ) {}

    @OnEvent(ExpiredTimerEvents.QuestionTimerExpired)
    onQuestionTimerExpired(roomCode: string) {
        const players: Player[] = this.playerService.getPlayers(roomCode);
        const matchRoom = this.getRoom(roomCode);

        this.autoSubmitAnswers(roomCode);
        this.questionStrategyContext.gradeAnswers(matchRoom, players);
    }

    @OnEvent(GradingEvents.GradingComplete)
    onGradingCompleteEvent(roomCode: string) {
        this.sendFeedback(roomCode);
        this.finaliseRound(roomCode);
    }

    @OnEvent(PlayerEvents.Quit)
    onPlayerQuit(roomCode: string) {
        this.handleFinalAnswerSubmitted(this.getRoom(roomCode));
    }

    // permit more parameters to make method reusable
    // eslint-disable-next-line max-params
    updateChoice(choice: string, selection: boolean, username: string, roomCode: string) {
        const matchRoom = this.matchRoomService.getRoom(roomCode);
        const player: Player = this.playerService.getPlayerByUsername(roomCode, username);
        if (!player.answer.isSubmitted) {
            player.answer.updateChoice(choice, selection);
            player.answer.timestamp = Date.now();
            this.histogramService.buildHistogram(matchRoom, choice, selection);
        }
    }

    calculateScore(roomCode: string, grades?: LongAnswerInfo[]) {
        const players: Player[] = this.playerService.getPlayers(roomCode);
        const matchRoom = this.getRoom(roomCode);
        this.questionStrategyContext.calculateScore(matchRoom, players, grades);
    }

    submitAnswer(username: string, roomCode: string) {
        const player: Player = this.playerService.getPlayerByUsername(roomCode, username);
        const matchRoom = this.getRoom(roomCode);

        player.answer.timestamp = Date.now();
        player.answer.isSubmitted = true;
        matchRoom.submittedPlayers++;

        this.handleFinalAnswerSubmitted(matchRoom);
    }

    private handleFinalAnswerSubmitted(matchRoom: MatchRoom) {
        const activePlayers = matchRoom.players.filter((player) => player.isPlaying);
        const areAllAnswersSubmitted = activePlayers.every((player) => player.answer.isSubmitted);
        if (areAllAnswersSubmitted) {
            this.timeService.terminateTimer(matchRoom.code);
            this.onQuestionTimerExpired(matchRoom.code);
        }
    }

    private getRoom(roomCode: string) {
        return this.matchRoomService.getRoom(roomCode);
    }

    private autoSubmitAnswers(roomCode: string) {
        const players: Player[] = this.playerService.getPlayers(roomCode);
        players.forEach((player) => {
            if (!player.answer.isSubmitted) {
                player.answer.isSubmitted = true;
                player.answer.timestamp = Infinity;
            }
        });
    }

    private sendFeedback(roomCode: string) {
        const matchRoom = this.getRoom(roomCode);
        const correctAnswer = matchRoom.currentQuestionAnswer;
        const players: Player[] = this.playerService.getPlayers(roomCode);
        players.forEach((player: Player) => {
            const feedback: Feedback = { score: player.score, answerCorrectness: player.answerCorrectness, correctAnswer };
            player.socket.emit(AnswerEvents.Feedback, feedback);
            player.answerCorrectness = AnswerCorrectness.WRONG;
        });

        matchRoom.hostSocket.emit(AnswerEvents.Feedback);
        if (matchRoom.gameLength === 1 + matchRoom.currentQuestionIndex) matchRoom.hostSocket.emit(AnswerEvents.EndGame);
    }

    private finaliseRound(roomCode: string) {
        this.matchRoomService.resetPlayerSubmissionCount(roomCode);
        this.matchRoomService.incrementCurrentQuestionIndex(roomCode);
    }
}

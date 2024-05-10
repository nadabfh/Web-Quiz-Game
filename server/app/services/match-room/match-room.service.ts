import { ExpiredTimerEvents } from '@app/constants/expired-timer-events';
import { INVALID_CODE, LOCKED_ROOM } from '@app/constants/match-login-errors';
import { Choice } from '@app/model/database/choice';
import { Game } from '@app/model/database/game';
import { Question } from '@app/model/database/question';
import { MatchRoom } from '@app/model/schema/match-room.schema';
import { Player } from '@app/model/schema/player.schema';
import { ChoiceTracker } from '@app/model/tally-trackers/choice-tracker/choice-tracker';
import { QuestionStrategyContext } from '@app/services/question-strategy-context/question-strategy-context.service';
import { TimeService } from '@app/services/time/time.service';
import { COOLDOWN_TIME, COUNTDOWN_TIME, FACTOR, MAXIMUM_CODE_LENGTH } from '@common/constants/match-constants';
import { MatchEvents } from '@common/events/match.events';
import { TimerEvents } from '@common/events/timer.events';
import { GameInfo } from '@common/interfaces/game-info';
import { GameOverInfo } from '@common/interfaces/game-over-info';
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Server, Socket } from 'socket.io';

@Injectable()
export class MatchRoomService {
    matchRooms: MatchRoom[];
    backgroundHostSocket: Socket;

    constructor(
        private readonly eventEmitter: EventEmitter2,
        private readonly timeService: TimeService,
        private readonly questionStrategyService: QuestionStrategyContext,
    ) {
        this.matchRooms = [];
    }

    generateRoomCode(): string {
        let generatedCode: string;
        while (!generatedCode || this.getRoom(generatedCode)) {
            generatedCode = Math.floor(Math.random() * FACTOR).toString();
        }
        while (generatedCode.length < MAXIMUM_CODE_LENGTH) {
            generatedCode = '0' + generatedCode;
        }
        return generatedCode;
    }

    getRoom(code: string): MatchRoom | undefined {
        return this.matchRooms.find((room: MatchRoom) => {
            return room.code === code;
        });
    }

    getRoomIndex(code: string): number {
        return this.matchRooms.findIndex((room: MatchRoom) => {
            return room.code === code;
        });
    }

    // allow more parameters to make method more reusable
    // eslint-disable-next-line max-params
    addRoom(selectedGame: Game, socket: Socket, isTestPage: boolean = false, isRandomMode: boolean = false): MatchRoom {
        const isLocked: boolean = isTestPage && !isRandomMode;
        const isPlaying: boolean = isTestPage && !isRandomMode;

        const newRoom: MatchRoom = {
            code: this.generateRoomCode(),
            hostSocket: socket,
            isLocked,
            isPlaying,
            game: selectedGame,
            gameLength: selectedGame.questions.length,
            questionDuration: 0,
            currentQuestion: selectedGame.questions[0],
            currentQuestionIndex: 0,
            currentQuestionAnswer: [],
            choiceTracker: new ChoiceTracker(),
            matchHistograms: [],
            bannedUsernames: [],
            players: [],
            activePlayers: 0,
            submittedPlayers: 0,
            messages: [],
            isTestRoom: isTestPage || isRandomMode,
            isRandomMode,
            startTime: new Date(),
        };
        this.matchRooms.push(newRoom);
        this.setQuestionStrategy(newRoom);
        return newRoom;
    }

    getRoomCodeByHostSocket(socketId: string): string {
        let matchRoomCode: string;
        this.matchRooms.forEach((matchRoom: MatchRoom) => {
            matchRoomCode = matchRoom.hostSocket.id === socketId ? matchRoom.code : undefined;
        });
        return matchRoomCode;
    }

    toggleLock(matchRoomCode: string): void {
        this.getRoom(matchRoomCode).isLocked = !this.getRoom(matchRoomCode).isLocked;
    }

    deleteRoom(matchRoomCode: string): void {
        this.timeService.terminateTimer(matchRoomCode);
        this.questionStrategyService.deleteRoom(matchRoomCode);
        this.matchRooms = this.matchRooms.filter((room: MatchRoom) => {
            return room.code !== matchRoomCode;
        });
    }

    getRoomCodeErrors(matchRoomCode: string): string {
        let errors = '';
        const room = this.getRoom(matchRoomCode);
        if (!room) {
            errors += INVALID_CODE;
        } else if (room.isLocked) {
            errors += LOCKED_ROOM;
        }
        return errors;
    }

    startMatch(socket: Socket, server: Server, matchRoomCode: string) {
        if (!this.canStartMatch(matchRoomCode)) return;
        const gameTitle = this.getGameTitle(matchRoomCode);
        const gameInfo: GameInfo = { start: true, gameTitle };
        socket.to(matchRoomCode).emit(MatchEvents.MatchStarting, gameInfo);

        const roomIndex = this.getRoomIndex(matchRoomCode);
        this.matchRooms[roomIndex].startTime = new Date();

        this.timeService.startTimer(server, matchRoomCode, COUNTDOWN_TIME, ExpiredTimerEvents.CountdownTimerExpired);
    }

    pauseMatchTimer(server: Server, matchRoomCode: string) {
        this.timeService.pauseTimer(server, matchRoomCode);
    }

    triggerPanicMode(server: Server, matchRoomCode: string) {
        this.timeService.startPanicTimer(server, matchRoomCode);
        server.to(matchRoomCode).emit(TimerEvents.PanicTimer);
    }

    markGameAsPlaying(matchRoomCode: string): void {
        const matchRoom: MatchRoom = this.getRoom(matchRoomCode);
        matchRoom.isPlaying = true;
    }

    isGamePlaying(matchRoomCode: string): boolean {
        return this.getRoom(matchRoomCode).isPlaying;
    }

    sendFirstQuestion(server: Server, matchRoomCode: string): void {
        const matchRoom: MatchRoom = this.getRoom(matchRoomCode);
        const firstQuestion = matchRoom.game.questions[0];
        const gameDuration: number = matchRoom.game.duration;
        const isTestRoom = matchRoom.isTestRoom;
        this.setQuestionStrategy(matchRoom);
        matchRoom.currentQuestionAnswer = this.filterCorrectChoices(firstQuestion);
        this.removeIsCorrectField(firstQuestion);
        if (!isTestRoom) {
            matchRoom.hostSocket.send(MatchEvents.CurrentAnswers, matchRoom.currentQuestionAnswer);
        }
        server.in(matchRoomCode).emit(MatchEvents.BeginQuiz, { firstQuestion, gameDuration, isTestRoom });
        this.timeService.startTimer(server, matchRoomCode, matchRoom.questionDuration, ExpiredTimerEvents.QuestionTimerExpired);
    }

    startNextQuestionCooldown(server: Server, matchRoomCode: string): void {
        server.in(matchRoomCode).emit(MatchEvents.StartCooldown, matchRoomCode);
        this.timeService.startTimer(server, matchRoomCode, COOLDOWN_TIME, ExpiredTimerEvents.CooldownTimerExpired);
    }

    sendNextQuestion(server: Server, matchRoomCode: string): void {
        const matchRoom: MatchRoom = this.getRoom(matchRoomCode);

        if (matchRoom.currentQuestionIndex === matchRoom.gameLength && matchRoom.isRandomMode) {
            this.eventEmitter.emit(MatchEvents.RouteToResultsPage, matchRoomCode);
            return;
        }

        if (matchRoom.currentQuestionIndex === matchRoom.gameLength) {
            const gameOverInfo: GameOverInfo = { isTestRoom: matchRoom.isTestRoom, isRandomMode: matchRoom.isRandomMode };
            server.in(matchRoomCode).emit(MatchEvents.GameOver, gameOverInfo);
            return;
        }
        const nextQuestion = this.getCurrentQuestion(matchRoomCode);
        matchRoom.currentQuestion = nextQuestion;
        matchRoom.currentQuestionAnswer = this.filterCorrectChoices(nextQuestion);
        this.setQuestionStrategy(matchRoom);

        this.removeIsCorrectField(nextQuestion);
        server.in(matchRoomCode).emit(MatchEvents.GoToNextQuestion, nextQuestion);
        matchRoom.hostSocket.send(MatchEvents.CurrentAnswers, matchRoom.currentQuestionAnswer);
        this.timeService.startTimer(server, matchRoomCode, matchRoom.questionDuration, ExpiredTimerEvents.QuestionTimerExpired);
    }

    resetPlayerSubmissionCount(matchRoomCode: string) {
        this.getRoom(matchRoomCode).submittedPlayers = 0;
    }

    incrementCurrentQuestionIndex(matchRoomCode: string) {
        this.getRoom(matchRoomCode).currentQuestionIndex++;
    }

    getGameTitle(matchRoomCode: string): string {
        return this.getRoom(matchRoomCode).game.title;
    }

    canStartMatch(matchRoomCode: string): boolean {
        const room = this.getRoom(matchRoomCode);
        if (!room) {
            return false;
        }
        return (room.isLocked && room.players.length > 0 && !room.isRandomMode) || (room.isLocked && room.isRandomMode);
    }

    getCurrentQuestion(matchRoomCode: string) {
        const matchRoom: MatchRoom = this.getRoom(matchRoomCode);
        return matchRoom.game.questions[matchRoom.currentQuestionIndex];
    }

    declareWinner(matchRoomCode: string) {
        const players: Player[] = this.getRoom(matchRoomCode).players;
        const playingPlayers = players.filter((player) => player.isPlaying);
        const maxScore = Math.max(...playingPlayers.map((player) => player.score));
        const playersWithMaxScore = playingPlayers.filter((player) => player.score === maxScore);
        playersWithMaxScore.forEach((player) => player.socket.emit(MatchEvents.Winner));
    }

    private filterCorrectChoices(question: Question) {
        const correctChoices = [];
        question.choices.forEach((choice) => {
            if (choice.isCorrect) {
                correctChoices.push(choice.text);
            }
        });
        return correctChoices;
    }

    private removeIsCorrectField(question: Question) {
        question.choices.forEach((choice: Choice) => delete choice.isCorrect);
    }

    private setQuestionStrategy(matchRoom: MatchRoom) {
        this.questionStrategyService.setQuestionStrategy(matchRoom);
        this.timeService.currentPanicThresholdTime = this.questionStrategyService.getQuestionPanicThreshold(matchRoom.code);
    }
}

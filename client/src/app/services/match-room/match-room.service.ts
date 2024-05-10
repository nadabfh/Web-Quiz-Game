import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { MatchStatus } from '@app/constants/feedback-messages';
import { MatchContext } from '@app/constants/states';
import { Message } from '@app/interfaces/message';
import { Player } from '@app/interfaces/player';
import { Question } from '@app/interfaces/question';
import { NotificationService } from '@app/services/notification/notification.service';
import { MatchContextService } from '@app/services/question-context/question-context.service';
import { SocketHandlerService } from '@app/services/socket-handler/socket-handler.service';
import { HOST_USERNAME } from '@common/constants/match-constants';
import { PlayerState } from '@common/constants/player-states';
import { ChatEvents } from '@common/events/chat.events';
import { MatchEvents } from '@common/events/match.events';
import { GameOverInfo } from '@common/interfaces/game-over-info';
import { UserInfo } from '@common/interfaces/user-info';

@Injectable({
    providedIn: 'root',
})
export class MatchRoomService {
    players: Player[];
    messages: Message[];
    isMatchStarted: boolean;
    isResults: boolean;
    isWaitOver: boolean;
    isBanned: boolean;
    isPlaying: boolean;
    gameTitle: string;
    gameDuration: number;
    currentQuestion: Question;
    isHostPlaying: boolean;
    isCooldown: boolean;
    isQuitting: boolean;

    private matchRoomCode: string;
    private username: string;

    // Allow more constructor parameters
    // eslint-disable-next-line max-params
    constructor(
        public socketService: SocketHandlerService,
        private readonly router: Router,
        private readonly notificationService: NotificationService,
        private readonly matchContextService: MatchContextService,
    ) {}

    get socketId() {
        return this.socketService.socket.id ? this.socketService.socket.id : '';
    }

    getRoomCode() {
        return this.matchRoomCode;
    }

    getUsername() {
        return this.username;
    }

    connect() {
        if (!this.socketService.isSocketAlive()) {
            this.resetMatchValues();
            this.socketService.connect();
            this.onRedirectAfterDisconnection();
            this.onFetchPlayersData();
            this.onMatchStarted();
            this.onBeginQuiz();
            this.onNextQuestion();
            this.onGameOver();
            this.onStartCooldown();
            this.onHostQuit();
            this.onPlayerKick();
            this.handleError();
            this.onPlayerChatStateToggle();
            this.handleChatStateNotifications();
            this.onRouteToResultsPage();
        }
    }

    disconnect() {
        this.matchContextService.resetContext();
        this.socketService.disconnect();
    }

    createRoom(gameId: string, isTestRoom: boolean = false, isRandomMode: boolean = false) {
        this.socketService.send(MatchEvents.CreateRoom, { gameId, isTestPage: isTestRoom, isRandomMode }, (res: { code: string }) => {
            this.matchRoomCode = res.code;
            this.username = HOST_USERNAME;
            if (isTestRoom) {
                this.players = [
                    { username: this.username, score: 0, bonusCount: 0, isChatActive: true, isPlaying: true, state: PlayerState.default },
                ];
            } else {
                this.sendPlayersData(this.matchRoomCode);
                this.router.navigateByUrl('/match-room');
            }
        });
    }

    getPlayerByUsername(username: string): Player | null {
        const playerToFindByUsername = this.players.find((player) => player.username === username);
        return playerToFindByUsername ? playerToFindByUsername : null;
    }

    onPlayerChatStateToggle() {
        this.socketService.on(ChatEvents.ReturnCurrentChatState, (currentChatState: boolean) => {
            const player = this.getPlayerByUsername(this.username);
            if (player) {
                player.isChatActive = currentChatState;
            }
        });
    }

    joinRoom(roomCode: string, username: string) {
        const sentInfo: UserInfo = { roomCode, username };
        this.socketService.send(MatchEvents.JoinRoom, sentInfo, (res: { code: string; username: string; isRandomMode: boolean }) => {
            if (res.isRandomMode) {
                this.matchContextService.setContext(MatchContext.RandomMode);
            }
            this.matchRoomCode = res.code;
            this.username = res.username;
            this.router.navigateByUrl('/match-room');
        });
        this.sendPlayersData(roomCode);
    }

    sendPlayersData(roomCode: string) {
        this.socketService.send(MatchEvents.SendPlayersData, roomCode);
    }

    toggleLock() {
        if (this.username === HOST_USERNAME) {
            this.socketService.send(MatchEvents.ToggleLock, this.matchRoomCode);
        }
    }

    banUsername(username: string) {
        if (this.username === HOST_USERNAME) {
            const sentInfo: UserInfo = { roomCode: this.matchRoomCode, username };
            this.socketService.send(MatchEvents.BanUsername, sentInfo);
        }
    }

    handleError() {
        this.socketService.on(MatchEvents.Error, (errorMessage: string) => {
            this.notificationService.displayErrorMessage(errorMessage);
        });
    }

    startMatch() {
        this.isMatchStarted = true;
        this.socketService.send(MatchEvents.StartMatch, this.matchRoomCode);
    }

    onMatchStarted() {
        this.socketService.on(MatchEvents.MatchStarting, (data: { start: boolean; gameTitle: string }) => {
            if (data.start) {
                this.isMatchStarted = data.start;
            }
            if (data.gameTitle) {
                this.gameTitle = data.gameTitle;
            }
        });
    }

    onBeginQuiz() {
        this.socketService.on(MatchEvents.BeginQuiz, (data: { firstQuestion: Question; gameDuration: number; isTestRoom: boolean }) => {
            this.isWaitOver = true;
            this.currentQuestion = data.firstQuestion;
            this.gameDuration = data.gameDuration;
            const { firstQuestion, gameDuration } = data;
            this.router.navigate(['/play-match'], { state: { question: firstQuestion, duration: gameDuration } });
        });
    }

    goToNextQuestion() {
        this.socketService.send(MatchEvents.GoToNextQuestion, this.matchRoomCode);
    }

    onStartCooldown() {
        this.socketService.on(MatchEvents.StartCooldown, () => {
            this.isCooldown = true;
            const context = this.matchContextService.getContext();
            if (this.isCooldown && context !== MatchContext.TestPage && context !== MatchContext.RandomMode) {
                this.currentQuestion.text = MatchStatus.PREPARE;
            }
        });
    }

    onGameOver() {
        this.socketService.on(MatchEvents.GameOver, (gameOverInfo: GameOverInfo) => {
            const { isTestRoom, isRandomMode } = gameOverInfo;
            if (isTestRoom && !isRandomMode) {
                this.router.navigateByUrl('/host');
            }
        });
    }

    onNextQuestion() {
        this.socketService.on(MatchEvents.GoToNextQuestion, (question: Question) => {
            this.isCooldown = false;
            this.currentQuestion = question;
        });
    }

    onFetchPlayersData() {
        this.socketService.on(MatchEvents.FetchPlayersData, (res: string) => {
            this.players = JSON.parse(res);
        });
    }

    onHostQuit() {
        this.socketService.on(MatchEvents.HostQuitMatch, () => {
            this.isHostPlaying = false;
        });
    }

    onRedirectAfterDisconnection() {
        this.socketService.on(MatchEvents.Disconnect, () => {
            this.router.navigateByUrl('/home');
            this.resetMatchValues();
        });
    }

    resetMatchValues() {
        this.matchRoomCode = '';
        this.username = '';
        this.players = [];
        this.messages = [];
        this.isResults = false;
        this.isWaitOver = false;
        this.isPlaying = false;
        this.isCooldown = false;
    }

    routeToResultsPage() {
        this.socketService.send(MatchEvents.RouteToResultsPage, this.matchRoomCode);
    }

    onRouteToResultsPage() {
        this.socketService.on(MatchEvents.RouteToResultsPage, () => {
            this.isResults = true;
            this.router.navigateByUrl('/results');
        });
    }

    onPlayerKick() {
        this.socketService.on(MatchEvents.KickPlayer, () => {
            this.isBanned = true;
            this.disconnect();
        });
    }

    handleChatStateNotifications() {
        this.socketService.on(ChatEvents.ChatReactivated, (notificationMessage: string) => {
            this.notificationService.displaySuccessMessage(notificationMessage);
        });
    }
}

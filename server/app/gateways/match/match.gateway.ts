import { CHAT_REACTIVATED } from '@app/constants/chat-state-messages';
import { ExpiredTimerEvents } from '@app/constants/expired-timer-events';
import { BAN_PLAYER, NO_MORE_HOST, NO_MORE_PLAYERS } from '@app/constants/match-errors';
import { PlayerEvents } from '@app/constants/player-events';
import { Game } from '@app/model/database/game';
import { MatchRoom } from '@app/model/schema/match-room.schema';
import { Player } from '@app/model/schema/player.schema';
import { HistogramService } from '@app/services/histogram/histogram.service';
import { HistoryService } from '@app/services/history/history.service';
import { MatchBackupService } from '@app/services/match-backup/match-backup.service';
import { MatchRoomService } from '@app/services/match-room/match-room.service';
import { PlayerRoomService } from '@app/services/player-room/player-room.service';
import { HOST_USERNAME } from '@common/constants/match-constants';
import { PlayerState } from '@common/constants/player-states';
import { ChatEvents } from '@common/events/chat.events';
import { HistogramEvents } from '@common/events/histogram.events';
import { MatchEvents } from '@common/events/match.events';
import { UserInfo } from '@common/interfaces/user-info';
import { Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { ConnectedSocket, MessageBody, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
@Injectable()
export class MatchGateway implements OnGatewayDisconnect {
    @WebSocketServer() private server: Server;

    // permit more params to decouple services
    // eslint-disable-next-line max-params
    constructor(
        private readonly matchRoomService: MatchRoomService,
        private readonly playerRoomService: PlayerRoomService,
        private readonly matchBackupService: MatchBackupService,
        private readonly histogramService: HistogramService,
        private readonly historyService: HistoryService,
        private readonly eventEmitter: EventEmitter2,
    ) {}

    @SubscribeMessage(MatchEvents.JoinRoom)
    joinRoom(@ConnectedSocket() socket: Socket, @MessageBody() data: UserInfo) {
        const codeErrors = this.matchRoomService.getRoomCodeErrors(data.roomCode);
        const usernameErrors = this.playerRoomService.getUsernameErrors(data.roomCode, data.username);
        const errorMessage = codeErrors + usernameErrors;
        if (errorMessage) {
            this.sendError(socket.id, errorMessage);
            this.server.in(socket.id).disconnectSockets();
        } else {
            socket.join(data.roomCode);
            const newPlayer = this.playerRoomService.addPlayer(socket, data.roomCode, data.username);
            return { code: data.roomCode, username: newPlayer.username, isRandomMode: this.matchRoomService.getRoom(data.roomCode).isRandomMode };
        }
    }

    @SubscribeMessage(MatchEvents.CreateRoom)
    async createRoom(@ConnectedSocket() socket: Socket, @MessageBody() data: { gameId: string; isTestPage: boolean; isRandomMode: boolean }) {
        let selectedGame: Game = {} as Game;
        if (!data.isRandomMode) {
            selectedGame = this.matchBackupService.getBackupGame(data.gameId);
        } else {
            selectedGame = await this.matchBackupService.getBackupRandomGame();
        }
        const newMatchRoom: MatchRoom = this.matchRoomService.addRoom(selectedGame, socket, data.isTestPage, data.isRandomMode);
        this.histogramService.resetChoiceTracker(newMatchRoom.code);
        if (data.isTestPage || data.isRandomMode) {
            const playerInfo = { roomCode: newMatchRoom.code, username: HOST_USERNAME };
            socket.join(newMatchRoom.code);

            this.playerRoomService.addPlayer(socket, playerInfo.roomCode, playerInfo.username);

            if (!newMatchRoom.isRandomMode) {
                this.matchRoomService.sendFirstQuestion(this.server, playerInfo.roomCode);
                this.matchRoomService.startMatch(socket, this.server, newMatchRoom.code);
            }

            return { code: newMatchRoom.code };
        }

        socket.join(newMatchRoom.code);
        return { code: newMatchRoom.code };
    }

    @SubscribeMessage(MatchEvents.RouteToResultsPage)
    routeToResultsPage(@ConnectedSocket() socket: Socket, @MessageBody() matchRoomCode: string) {
        const roomIndex = this.matchRoomService.getRoomIndex(matchRoomCode);
        this.matchRoomService.matchRooms[roomIndex].isPlaying = false;

        this.playerRoomService.setStateForAll(matchRoomCode, PlayerState.default);
        this.server.to(matchRoomCode).emit(MatchEvents.RouteToResultsPage);
        this.emitHistogramHistory(matchRoomCode);

        this.matchRoomService.declareWinner(matchRoomCode);
        this.historyService.createHistoryItem(this.matchRoomService.getRoom(matchRoomCode));

        this.matchRoomService.matchRooms[roomIndex].players.forEach((player: Player) => {
            if (!player.isChatActive) {
                player.isChatActive = true;
                this.server.in(player.socket.id).emit(ChatEvents.ChatReactivated, CHAT_REACTIVATED);
            }
        });
    }

    @SubscribeMessage(MatchEvents.ToggleLock)
    toggleLock(@ConnectedSocket() socket: Socket, @MessageBody() matchRoomCode: string) {
        this.matchRoomService.toggleLock(matchRoomCode);
    }

    @SubscribeMessage(MatchEvents.BanUsername)
    banUsername(@ConnectedSocket() socket: Socket, @MessageBody() data: UserInfo) {
        this.playerRoomService.addBannedUsername(data.roomCode, data.username);
        const playerToBan = this.playerRoomService.getPlayerByUsername(data.roomCode, data.username);
        if (playerToBan) {
            this.playerRoomService.deletePlayer(data.roomCode, data.username);
            this.sendError(playerToBan.socket.id, BAN_PLAYER);
            this.server.in(playerToBan.socket.id).emit(MatchEvents.KickPlayer);
            this.server.in(playerToBan.socket.id).disconnectSockets();
        }
        this.sendPlayersData(socket, data.roomCode);
    }

    @SubscribeMessage(MatchEvents.SendPlayersData)
    sendPlayersData(@ConnectedSocket() socket: Socket, @MessageBody() matchRoomCode: string) {
        if (socket.rooms.has(matchRoomCode)) {
            this.handleSendPlayersData(matchRoomCode);
        }
    }

    @SubscribeMessage(MatchEvents.StartMatch)
    startMatch(@ConnectedSocket() socket: Socket, @MessageBody() roomCode: string) {
        this.matchRoomService.markGameAsPlaying(roomCode);
        this.matchRoomService.startMatch(socket, this.server, roomCode);
        this.playerRoomService.setStateForAll(roomCode, PlayerState.noInteraction);
    }

    @SubscribeMessage(MatchEvents.GoToNextQuestion)
    goToNextQuestion(@ConnectedSocket() socket: Socket, @MessageBody() roomCode: string) {
        this.playerRoomService.setStateForAll(roomCode, PlayerState.noInteraction);
        this.matchRoomService.startNextQuestionCooldown(this.server, roomCode);
    }

    @OnEvent(ExpiredTimerEvents.CountdownTimerExpired)
    onCountdownTimerExpired(matchRoomCode: string) {
        this.matchRoomService.sendFirstQuestion(this.server, matchRoomCode);
        this.histogramService.sendEmptyHistogram(matchRoomCode);
    }

    @OnEvent(ExpiredTimerEvents.CooldownTimerExpired)
    onCooldownTimerExpired(matchRoomCode: string) {
        this.matchRoomService.sendNextQuestion(this.server, matchRoomCode);
        if (!this.isTestRoom(matchRoomCode) && !this.isRandomModeRoom(matchRoomCode)) {
            this.histogramService.resetChoiceTracker(matchRoomCode);
            this.histogramService.sendEmptyHistogram(matchRoomCode);
        }
    }

    @OnEvent(MatchEvents.RouteToResultsPage)
    onRouteToResultsPage(matchRoomCode: string) {
        this.routeToResultsPage({} as Socket, matchRoomCode);
    }

    handleDisconnect(@ConnectedSocket() socket: Socket) {
        const isHostDisconnected = this.handleHostDisconnect(socket);
        if (!isHostDisconnected) this.handlePlayersDisconnect(socket);
    }

    handleHostDisconnect(@ConnectedSocket() socket: Socket): boolean {
        const hostRoomCode = this.matchRoomService.getRoomCodeByHostSocket(socket.id);
        if (!hostRoomCode) return false;
        const hostRoom = this.matchRoomService.getRoom(hostRoomCode);
        if ((hostRoom.isPlaying || !hostRoom.currentQuestionIndex) && !hostRoom.isRandomMode) {
            this.sendError(hostRoomCode, NO_MORE_HOST);
            this.deleteRoom(hostRoomCode);
            return true;
        }
        if (this.isRoomEmpty(hostRoom)) {
            this.deleteRoom(hostRoomCode);
            return true;
        }
        return false;
    }

    handlePlayersDisconnect(@ConnectedSocket() socket: Socket) {
        const player = this.playerRoomService.getPlayerBySocket(socket.id);
        const roomCode = this.playerRoomService.deletePlayerBySocket(socket.id);
        if (!roomCode || !player) {
            return;
        }

        this.eventEmitter.emit(PlayerEvents.Quit, roomCode);
        const room = this.matchRoomService.getRoom(roomCode);
        const isRoomEmpty = this.isRoomEmpty(room);
        if (room.isPlaying && isRoomEmpty) {
            this.sendError(roomCode, NO_MORE_PLAYERS);
            this.deleteRoom(roomCode);
            return;
        }
        if (isRoomEmpty && !room.hostSocket.connected) {
            this.deleteRoom(roomCode);
            return;
        }
        this.handleSendPlayersData(roomCode);
        this.sendMessageOnDisconnect(roomCode, player.username);
    }

    deleteRoom(matchRoomCode: string) {
        this.server.to(matchRoomCode).emit(MatchEvents.HostQuitMatch);
        this.server.in(matchRoomCode).disconnectSockets();
        this.matchRoomService.deleteRoom(matchRoomCode);
    }

    handleSendPlayersData(matchRoomCode: string) {
        this.server.to(matchRoomCode).emit(MatchEvents.FetchPlayersData, this.playerRoomService.getPlayersStringified(matchRoomCode));
    }

    sendError(socketId: string, error: string) {
        this.server.to(socketId).emit(MatchEvents.Error, error);
    }

    sendMessageOnDisconnect(roomCode: string, username: string) {
        this.server
            .to(roomCode)
            .emit(ChatEvents.NewMessage, { roomCode, message: { author: '', text: `${username} a quitté la partie.`, date: new Date() } });
    }

    private emitHistogramHistory(matchRoomCode: string) {
        const histograms = this.histogramService.sendHistogramHistory(matchRoomCode);
        this.server.to(matchRoomCode).emit(HistogramEvents.HistogramHistory, histograms);
    }

    private isRoomEmpty(room: MatchRoom) {
        return room.players.every((player) => !player.isPlaying);
    }

    private isTestRoom(matchRoomCode: string) {
        const matchRoom = this.matchRoomService.getRoom(matchRoomCode);
        return matchRoom.isTestRoom && !matchRoom.isRandomMode;
    }

    private isRandomModeRoom(matchRoomCode: string) {
        return this.matchRoomService.getRoom(matchRoomCode).isRandomMode;
    }
}

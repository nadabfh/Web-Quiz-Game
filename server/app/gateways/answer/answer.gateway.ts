import { AnswerService } from '@app/services/answer/answer.service';
import { PlayerRoomService } from '@app/services/player-room/player-room.service';
import { PlayerState } from '@common/constants/player-states';
import { AnswerEvents } from '@common/events/answer.events';
import { ChoiceInfo } from '@common/interfaces/choice-info';
import { UserInfo } from '@common/interfaces/user-info';
import { GradesInfo } from '@common/interfaces/grades-info';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
@WebSocketGateway({ cors: true })
export class AnswerGateway {
    @WebSocketServer() private server: Server;

    constructor(
        private readonly answerService: AnswerService,
        private readonly playerRoomService: PlayerRoomService,
    ) {}

    @SubscribeMessage(AnswerEvents.SelectChoice)
    selectChoice(@ConnectedSocket() socket: Socket, @MessageBody() choice: ChoiceInfo) {
        this.answerService.updateChoice(choice.choice, true, choice.userInfo.username, choice.userInfo.roomCode);
        this.playerRoomService.setState(socket.id, PlayerState.firstInteraction);
    }

    @SubscribeMessage(AnswerEvents.DeselectChoice)
    deselectChoice(@ConnectedSocket() socket: Socket, @MessageBody() choice: ChoiceInfo) {
        this.answerService.updateChoice(choice.choice, false, choice.userInfo.username, choice.userInfo.roomCode);
    }

    @SubscribeMessage(AnswerEvents.SubmitAnswer)
    submitAnswer(@ConnectedSocket() socket: Socket, @MessageBody() userInfo: UserInfo) {
        this.answerService.submitAnswer(userInfo.username, userInfo.roomCode);
        this.playerRoomService.setState(socket.id, PlayerState.finalAnswer);
    }

    @SubscribeMessage(AnswerEvents.Grades)
    calculateScore(@ConnectedSocket() socket: Socket, @MessageBody() gradesInfo: GradesInfo) {
        this.answerService.calculateScore(gradesInfo.matchRoomCode, gradesInfo.grades);
    }

    @SubscribeMessage(AnswerEvents.UpdateLongAnswer)
    updateLongAnswer(@ConnectedSocket() socket: Socket, @MessageBody() choice: ChoiceInfo) {
        this.answerService.updateChoice(choice.choice, true, choice.userInfo.username, choice.userInfo.roomCode);
        this.playerRoomService.setState(socket.id, PlayerState.firstInteraction);
    }
}

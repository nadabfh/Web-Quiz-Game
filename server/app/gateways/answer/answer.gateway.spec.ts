import { MOCK_ROOM_CODE } from '@app/constants/match-mocks';
import { AnswerService } from '@app/services/answer/answer.service';
import { PlayerRoomService } from '@app/services/player-room/player-room.service';
import { PlayerState } from '@common/constants/player-states';
import { ChoiceInfo } from '@common/interfaces/choice-info';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance, stub } from 'sinon';
import { Server, Socket } from 'socket.io';
import { AnswerGateway } from './answer.gateway';
import { GradesInfo } from '@common/interfaces/grades-info';
import { LongAnswerInfo } from '@common/interfaces/long-answer-info';

describe('AnwserGateway', () => {
    let gateway: AnswerGateway;
    let answerServiceSpy: SinonStubbedInstance<AnswerService>;
    let playerSpy: SinonStubbedInstance<PlayerRoomService>;
    let server: SinonStubbedInstance<Server>;
    let socket: SinonStubbedInstance<Socket>;
    let choice: ChoiceInfo;
    beforeEach(async () => {
        answerServiceSpy = createStubInstance(AnswerService);
        socket = createStubInstance<Socket>(Socket);
        server = createStubInstance<Server>(Server);
        playerSpy = createStubInstance(PlayerRoomService);

        const module: TestingModule = await Test.createTestingModule({
            providers: [AnswerGateway, { provide: AnswerService, useValue: answerServiceSpy }, { provide: PlayerRoomService, useValue: playerSpy }],
        }).compile();

        gateway = module.get<AnswerGateway>(AnswerGateway);
        gateway['server'] = server;

        choice = { choice: 'choice', userInfo: { roomCode: MOCK_ROOM_CODE, username: 'player1' } };
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    it('selectChoice() should delegate selection of choice to answer service', () => {
        const updateChoiceSpy = jest.spyOn(answerServiceSpy, 'updateChoice').mockReturnThis();
        const stateSpy = jest.spyOn(playerSpy, 'setState').mockReturnThis();
        stub(socket, 'rooms').value(new Set([MOCK_ROOM_CODE]));
        gateway.selectChoice(socket, choice);
        expect(updateChoiceSpy).toHaveBeenCalledWith(choice.choice, true, choice.userInfo.username, choice.userInfo.roomCode);
        expect(stateSpy).toHaveBeenCalledWith(socket.id, PlayerState.firstInteraction);
    });

    it('deselectChoice() should delegate deselection of choice to answer service', () => {
        const updateChoiceSpy = jest.spyOn(answerServiceSpy, 'updateChoice').mockReturnThis();
        stub(socket, 'rooms').value(new Set([MOCK_ROOM_CODE]));
        gateway.deselectChoice(socket, choice);
        expect(updateChoiceSpy).toHaveBeenCalledWith(choice.choice, false, choice.userInfo.username, choice.userInfo.roomCode);
    });

    it('submitAnswer() should delegate submitting of answer to answer service', () => {
        const submitAnswerSpy = jest.spyOn(answerServiceSpy, 'submitAnswer').mockReturnThis();
        stub(socket, 'rooms').value(new Set([MOCK_ROOM_CODE]));
        const stateSpy = jest.spyOn(playerSpy, 'setState').mockReturnThis();
        gateway.submitAnswer(socket, choice.userInfo);
        expect(submitAnswerSpy).toHaveBeenCalledWith(choice.userInfo.username, choice.userInfo.roomCode);
        expect(stateSpy).toHaveBeenCalledWith(socket.id, PlayerState.finalAnswer);
    });

    it('calculateScore() should delegate calculating the score to answer service', () => {
        const grades: LongAnswerInfo[] = [{ username: 'player1', answer: 'answer', score: '100' }];
        const gradesInfo: GradesInfo = { matchRoomCode: MOCK_ROOM_CODE, grades };
        const calculateScoreSpy = jest.spyOn(answerServiceSpy, 'calculateScore').mockReturnThis();
        stub(socket, 'rooms').value(new Set([MOCK_ROOM_CODE]));
        gateway.calculateScore(socket, gradesInfo);
        expect(calculateScoreSpy).toHaveBeenCalledWith(gradesInfo.matchRoomCode, gradesInfo.grades);
    });

    it('updateLongAnswer() should delegate updating long answer to answer service', () => {
        const updateChoiceSpy = jest.spyOn(answerServiceSpy, 'updateChoice').mockReturnThis();
        const stateSpy = jest.spyOn(playerSpy, 'setState').mockReturnThis();

        stub(socket, 'rooms').value(new Set([MOCK_ROOM_CODE]));
        gateway.updateLongAnswer(socket, choice);
        expect(updateChoiceSpy).toHaveBeenCalledWith(choice.choice, true, choice.userInfo.username, choice.userInfo.roomCode);
        expect(stateSpy).toHaveBeenCalledWith(socket.id, PlayerState.firstInteraction);
    });
});

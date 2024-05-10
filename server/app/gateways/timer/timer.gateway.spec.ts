import { Test, TestingModule } from '@nestjs/testing';
import { TimerGateway } from './timer.gateway';
import { TimeService } from '@app/services/time/time.service';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { Server, Socket } from 'socket.io';
import { MOCK_ROOM_CODE } from '@app/constants/match-mocks';

describe('TimerGateway', () => {
    let gateway: TimerGateway;
    let timeServiceSpy: SinonStubbedInstance<TimeService>;
    let socket: SinonStubbedInstance<Socket>;
    let server: SinonStubbedInstance<Server>;

    beforeEach(async () => {
        timeServiceSpy = createStubInstance(TimeService);
        socket = createStubInstance<Socket>(Socket);
        server = createStubInstance<Server>(Server);

        const module: TestingModule = await Test.createTestingModule({
            providers: [TimerGateway, { provide: TimeService, useValue: timeServiceSpy }],
        }).compile();

        gateway = module.get<TimerGateway>(TimerGateway);
        gateway['server'] = server;
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    it('should call matchRoomService.pauseMatchTimer when pauseTimer message is detected', () => {
        const spy = jest.spyOn(timeServiceSpy, 'pauseTimer');
        gateway.pauseTimer(socket, MOCK_ROOM_CODE);
        expect(spy).toHaveBeenCalled();
    });

    it('should call matchRoomService.panicMatchTimer when panicTimer message is detected', () => {
        const spy = jest.spyOn(timeServiceSpy, 'startPanicTimer');
        gateway.triggerPanicTimer(socket, MOCK_ROOM_CODE);
        expect(spy).toHaveBeenCalled();
    });
});

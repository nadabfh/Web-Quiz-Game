import { AuthenticationService } from '@app/services/authentication/authentication.service';
import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { AuthenticationController } from './authentication.controller';

describe('AuthenticationController', () => {
    let controller: AuthenticationController;
    let authService: SinonStubbedInstance<AuthenticationService>;

    beforeEach(async () => {
        authService = createStubInstance(AuthenticationService);
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthenticationController],
            providers: [
                {
                    provide: AuthenticationService,
                    useValue: authService,
                },
            ],
        }).compile();

        controller = module.get<AuthenticationController>(AuthenticationController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('signIn() should return Http Status OK if the password validation service is resolved.', () => {
        authService.isValidPassword.returns(true);
        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.send = () => res;
        controller.signIn({ password: '' }, res);
        expect(authService.isValidPassword.calledOnce).toBe(true);
    });

    it('signIn() should return Http Status UNAUTHORIZED if the password validation service is not resolved.', () => {
        authService.isValidPassword.returns(false);
        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.UNAUTHORIZED);
            return res;
        };
        res.send = () => res;
        controller.signIn({ password: '' }, res);
        expect(authService.isValidPassword.calledOnce).toBe(true);
    });
});

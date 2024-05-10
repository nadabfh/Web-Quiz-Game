import { ADMIN_PASSWORD } from '@app/constants/admin-auth-info';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticationService } from './authentication.service';

describe('AuthenticationService', () => {
    let service: AuthenticationService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [AuthenticationService],
        }).compile();

        service = module.get<AuthenticationService>(AuthenticationService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('isValidPassword() should return true if the password in parameter is the right one, else false', () => {
        const WRONG_CASE_PASSWORD = 'LOG2990-305';
        expect(service.isValidPassword(ADMIN_PASSWORD)).toBeTruthy();
        expect(service.isValidPassword(WRONG_CASE_PASSWORD)).toBeFalsy();
    });
});

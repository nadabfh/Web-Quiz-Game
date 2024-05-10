import { ADMIN_PASSWORD } from '@app/constants/admin-auth-info';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthenticationService {
    isValidPassword(password: string): boolean {
        return password === ADMIN_PASSWORD;
    }
}

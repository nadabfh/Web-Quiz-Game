import { AuthenticationService } from '@app/services/authentication/authentication.service';
import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';
import { Response } from 'express';

interface AuthentificationInfo {
    password: string;
}

@Controller('/login')
export class AuthenticationController {
    constructor(private readonly authService: AuthenticationService) {}

    @Post('/')
    signIn(@Body() signInInfo: AuthentificationInfo, @Res() response: Response) {
        if (this.authService.isValidPassword(signInInfo.password)) {
            response.status(HttpStatus.OK).send();
        } else {
            response.status(HttpStatus.UNAUTHORIZED).send();
        }
    }
}

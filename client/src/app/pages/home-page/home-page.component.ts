import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogAdminPasswordComponent } from '@app/components/dialog-admin-password/dialog-admin-password.component';
import { DialogTextInputComponent } from '@app/components/dialog-text-input/dialog-text-input.component';
import { AdminLoginService } from '@app/services/admin-login/admin-login.service';
import { JoinMatchService } from '@app/services/join-match/join-match.service';
import { NotificationService } from '@app/services/notification/notification.service';

@Component({
    selector: 'app-home-page',
    templateUrl: './home-page.component.html',
    styleUrls: ['./home-page.component.scss'],
})
export class HomePageComponent {
    password: string;
    input: string;
    // Services are required to decouple logic
    // eslint-disable-next-line max-params
    constructor(
        private readonly dialog: MatDialog,
        private readonly adminLoginService: AdminLoginService,
        private readonly joinMatchService: JoinMatchService,
        private readonly notificationService: NotificationService,
    ) {}

    openAdminDialog(): void {
        const dialogRef = this.dialog.open(DialogAdminPasswordComponent, {
            data: { password: this.password },
        });

        dialogRef.afterClosed().subscribe((result: string) => {
            if (result) {
                this.submitPassword(result);
            }
        });
    }

    openJoinDialog(): void {
        const dialogRef = this.dialog.open(DialogTextInputComponent, {
            data: { input: this.input, title: 'Joindre une partie', placeholder: "Code d'accès" },
        });

        dialogRef.afterClosed().subscribe((result: string) => {
            if (result) {
                this.submitCode(result);
            }
        });
    }

    submitPassword(password: string): void {
        this.adminLoginService.validatePassword(password);
        this.password = '';
    }

    submitCode(roomCode: string): void {
        this.input = '';
        this.joinMatchService.matchRoomCode = '';
        this.joinMatchService.validateMatchRoomCode(roomCode).subscribe({
            next: () => {
                this.joinMatchService.matchRoomCode = roomCode;
                this.openUsernameDialog();
            },
            error: (error: HttpErrorResponse) => {
                this.notificationService.displayErrorMessage(`${JSON.parse(error.error)['message']}`);
                this.joinMatchService.matchRoomCode = '';
            },
        });
    }

    openUsernameDialog(): void {
        const dialogRef = this.dialog.open(DialogTextInputComponent, {
            data: { input: this.input, title: "Veillez saisir un nom d'utilisateur", placeholder: 'Nom' },
        });

        dialogRef.afterClosed().subscribe((result: string) => {
            if (result) {
                this.joinMatchService.validateUsername(result);
            }
        });
    }
}

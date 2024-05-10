import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatchRoomService } from '@app/services/match-room/match-room.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class JoinMatchService {
    matchRoomCode: string;
    constructor(
        private readonly matchRoomService: MatchRoomService,
        private readonly http: HttpClient,
        private readonly notificationService: NotificationService,
    ) {
        this.matchRoomCode = '';
    }

    validateMatchRoomCode(matchRoomCode: string) {
        return this.http.post(
            `${environment.serverUrl}/match/validate-code`,
            { matchRoomCode },
            {
                headers: new HttpHeaders({
                    contentType: 'application/json',
                }),
                observe: 'response' as const,
                responseType: 'text' as const,
            },
        );
    }

    postUsername(username: string) {
        return this.http.post(
            `${environment.serverUrl}/match/validate-username`,
            { matchRoomCode: this.matchRoomCode, username },
            {
                headers: new HttpHeaders({
                    contentType: 'application/json',
                }),
                observe: 'response' as const,
                responseType: 'text' as const,
            },
        );
    }

    validateUsername(username: string): void {
        this.postUsername(username).subscribe({
            next: () => {
                const matchRoomCode = this.matchRoomCode;
                this.matchRoomCode = '';
                this.addPlayerToMatchRoom(matchRoomCode, username);
            },
            error: (error: HttpErrorResponse) => {
                this.notificationService.displayErrorMessage(`${JSON.parse(error.error)['message']}`);
            },
        });
    }

    addPlayerToMatchRoom(matchRoomCode: string, username: string): void {
        this.matchRoomService.connect();
        this.matchRoomService.joinRoom(matchRoomCode, username);
    }
}

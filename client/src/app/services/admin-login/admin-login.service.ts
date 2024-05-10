import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from '@app/services/notification/notification.service';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class AdminLoginService {
    private isAuthenticated: boolean;
    constructor(
        private readonly http: HttpClient,
        private readonly router: Router,
        private readonly notificationService: NotificationService,
    ) {
        this.isAuthenticated = false;
    }

    validatePassword(password: string): void {
        this.http
            .post(
                `${environment.serverUrl}/login`,
                { password },
                {
                    headers: new HttpHeaders({
                        contentType: 'application/json',
                    }),
                    observe: 'response' as const,
                    responseType: 'text' as const,
                },
            )
            .subscribe({
                next: () => {
                    this.isAuthenticated = true;
                    this.router.navigateByUrl('/admin/games');
                },
                error: () => {
                    this.isAuthenticated = false;
                    this.notificationService.displayErrorMessage('Le mot de passe est invalide.');
                },
            });
    }

    getIsAuthenticated() {
        return this.isAuthenticated;
    }
}

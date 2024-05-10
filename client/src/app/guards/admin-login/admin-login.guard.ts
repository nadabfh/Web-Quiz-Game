import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AdminLoginService } from '@app/services/admin-login/admin-login.service';
import { NotificationService } from '@app/services/notification/notification.service';

export const adminLoginGuard = (): boolean => {
    const adminLoginService = inject(AdminLoginService);
    const router = inject(Router);
    const notificationService = inject(NotificationService);

    if (!adminLoginService.getIsAuthenticated()) {
        router.navigateByUrl('/home');
        notificationService.displayErrorMessage('Accès refusé: Veillez vous connecter avec le bon mot de passe.');
        return false;
    }
    return true;
};

import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AdminLoginService } from '@app/services/admin-login/admin-login.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { adminLoginGuard } from './admin-login.guard';
import SpyObj = jasmine.SpyObj;
describe('adminLoginGuard', () => {
    let authenticationSpy: SpyObj<AdminLoginService>;
    let routerSpy: SpyObj<Router>;
    let notificationSpy: SpyObj<NotificationService>;

    beforeEach(() => {
        authenticationSpy = jasmine.createSpyObj('AdminLoginService', ['getIsAuthenticated']);
        routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);
        notificationSpy = jasmine.createSpyObj('NotificationService', ['displayErrorMessage']);
        TestBed.configureTestingModule({
            providers: [
                { provide: AdminLoginService, useValue: authenticationSpy },
                { provide: Router, useValue: routerSpy },
                { provide: NotificationService, useValue: notificationSpy },
            ],
        });
    });

    it('should redirect to home page if user is not authenticated as admin', () => {
        authenticationSpy.getIsAuthenticated.and.returnValue(false);
        TestBed.runInInjectionContext(adminLoginGuard);
        expect(authenticationSpy.getIsAuthenticated).toHaveBeenCalled();
        expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/home');
        expect(notificationSpy.displayErrorMessage).toHaveBeenCalled();
    });

    it('should not redirect to home page if user is authenticated as admin', () => {
        authenticationSpy.getIsAuthenticated.and.returnValue(true);
        TestBed.runInInjectionContext(adminLoginGuard);
        expect(authenticationSpy.getIsAuthenticated).toHaveBeenCalled();
        expect(routerSpy.navigateByUrl).not.toHaveBeenCalled();
        expect(notificationSpy.displayErrorMessage).not.toHaveBeenCalled();
    });
});

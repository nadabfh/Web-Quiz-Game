import { HttpClientModule, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { By } from '@angular/platform-browser';
import { DialogAdminPasswordComponent } from '@app/components/dialog-admin-password/dialog-admin-password.component';
import { AdminLoginService } from '@app/services/admin-login/admin-login.service';
import { JoinMatchService } from '@app/services/join-match/join-match.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { of, throwError } from 'rxjs';
import { HomePageComponent } from './home-page.component';
import SpyObj = jasmine.SpyObj;

const mockHttpResponse: HttpResponse<string> = new HttpResponse({ status: 200, statusText: 'OK', body: JSON.stringify(true) });

describe('HomePageComponent', () => {
    let component: HomePageComponent;
    let fixture: ComponentFixture<HomePageComponent>;
    let dialogMock: SpyObj<MatDialog>;
    let adminLoginSpy: SpyObj<AdminLoginService>;
    let joinMatchSpy: SpyObj<JoinMatchService>;
    let notificationSpy: SpyObj<NotificationService>;

    beforeEach(() => {
        dialogMock = jasmine.createSpyObj({
            open: jasmine.createSpyObj({
                afterClosed: of('mockResult'),
            }),
        });
        adminLoginSpy = jasmine.createSpyObj('AdminLoginService', ['validatePassword']);
        joinMatchSpy = jasmine.createSpyObj('JoinMatchService', ['validateMatchRoomCode', 'validateUsername']);
        joinMatchSpy.matchRoomCode = '';
        notificationSpy = jasmine.createSpyObj('NotificationService', ['displayErrorMessage']);
        TestBed.configureTestingModule({
            imports: [HttpClientModule, MatSnackBarModule, MatIconModule],
            providers: [
                { provide: MatDialog, useValue: dialogMock },
                { provide: AdminLoginService, useValue: adminLoginSpy },
                { provide: JoinMatchService, useValue: joinMatchSpy },
                { provide: NotificationService, useValue: notificationSpy },
            ],
            declarations: [HomePageComponent],
        });
        fixture = TestBed.createComponent(HomePageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should display the application title and logo', () => {
        const dom = fixture.nativeElement;
        expect(dom.textContent).toContain('Hoot Hoot');
        expect(fixture.debugElement.query(By.css('#game-logo'))).toBeTruthy();
    });

    it('should contain buttons to join a match, create a match, and administrate games', () => {
        expect(fixture.debugElement.query(By.css('#join-button'))).toBeTruthy();
        expect(fixture.debugElement.query(By.css('#host-button'))).toBeTruthy();
        expect(fixture.debugElement.query(By.css('#admin-button'))).toBeTruthy();
    });

    it('should display the team number and the members names', () => {
        const dom = fixture.nativeElement;
        expect(dom.textContent).toContain('Équipe 305');
        expect(dom.textContent).toContain('Ikram Arroud');
        expect(dom.textContent).toContain('Nada Benelfellah');
        expect(dom.textContent).toContain('Victoria-Mae Carrière');
        expect(dom.textContent).toContain('Abdul-Wahab Chaarani');
        expect(dom.textContent).toContain('Hiba Chaarani');
        expect(dom.textContent).toContain('Adam Kassi-Lahlou');
    });

    it('host button should direct to "/host"', () => {
        const href = fixture.debugElement.query(By.css('#host-button')).nativeElement.getAttribute('routerLink');
        expect(href).toEqual('/host');
    });

    it('openAdminDialog() should open a dialog and allow to submit password', () => {
        const submitPasswordSpy = spyOn(component, 'submitPassword');
        component.password = 'mock';
        component.openAdminDialog();
        expect(dialogMock.open).toHaveBeenCalledWith(DialogAdminPasswordComponent, { data: { password: 'mock' } });
        const closeDialog = () => {
            return dialogMock.closeAll;
        };
        closeDialog();
        expect(submitPasswordSpy).toHaveBeenCalled();
    });

    it('openJoinDialog() should open a dialog and allow to submit code', () => {
        const submitCodeSpy = spyOn(component, 'submitCode');
        component.input = 'mock';
        component.openJoinDialog();
        expect(dialogMock.open).toHaveBeenCalled();
        const closeDialog = () => {
            return dialogMock.closeAll;
        };
        closeDialog();
        expect(submitCodeSpy).toHaveBeenCalled();
    });

    it('submitPassword() should call validatePassword and reset the input password', () => {
        const mockPassword = 'mockPassword';
        component.submitPassword(mockPassword);
        expect(adminLoginSpy.validatePassword).toHaveBeenCalledWith(mockPassword);
        expect(component.password).toEqual('');
    });

    it('submitCode() should call validateMatchRoomCode and open a new dialog if code is valid', () => {
        joinMatchSpy.validateMatchRoomCode.and.returnValue(of(mockHttpResponse));
        const openSpy = spyOn(component, 'openUsernameDialog');
        component.submitCode('mock');
        expect(joinMatchSpy.validateMatchRoomCode).toHaveBeenCalled();
        expect(openSpy).toHaveBeenCalled();
    });

    it('submitCode() should call validateMatchRoomCode and not open a new dialog if code is invalid', () => {
        const httpError = new HttpErrorResponse({
            status: 409,
            error: { code: '409', message: 'mock' },
        });
        joinMatchSpy.validateMatchRoomCode.and.returnValue(throwError(() => httpError));
        const openSpy = spyOn(component, 'openUsernameDialog');
        spyOn(JSON, 'parse').and.returnValue(httpError.error);
        component.submitCode('mock');
        expect(joinMatchSpy.validateMatchRoomCode).toHaveBeenCalled();
        expect(openSpy).not.toHaveBeenCalled();
        expect(notificationSpy.displayErrorMessage).toHaveBeenCalled();
    });

    it('openUsernameDialog() should open a new dialog and validate username', () => {
        component.input = 'mock';
        component.openUsernameDialog();
        expect(dialogMock.open).toHaveBeenCalled();
        const closeDialog = () => {
            return dialogMock.closeAll;
        };
        closeDialog();
        expect(joinMatchSpy.validateUsername).toHaveBeenCalled();
    });
});

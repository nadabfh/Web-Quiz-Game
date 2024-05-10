// To let the tests run without errors, mock classes are needed
/* eslint-disable max-classes-per-file */
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DialogAdminPasswordComponent } from './dialog-admin-password.component';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
    selector: 'app-chat',
    template: '',
})
class MockChatComponent {}

@Component({
    selector: 'app-histogram',
    template: '',
})
class MockAppHistogramComponent {}

@Component({
    // Angular Material Mock: Provided selector does not start by app
    /* eslint-disable @angular-eslint/component-selector */
    selector: 'mat-icon',
    template: '',
})
class MockMatIconComponent {}

@Component({
    selector: 'app-players-list',
    template: '',
})
class MockAppPlayersListComponent {}

describe('DialogAdminPasswordComponent', () => {
    let component: DialogAdminPasswordComponent;
    let fixture: ComponentFixture<DialogAdminPasswordComponent>;
    const matDialogSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                MatDialogModule,
                FormsModule,
                MatFormFieldModule,
                MatInputModule,
                BrowserAnimationsModule,
                MatExpansionModule,
                MatTooltipModule,
            ],
            declarations: [
                DialogAdminPasswordComponent,
                MockChatComponent,
                MockAppHistogramComponent,
                MockAppPlayersListComponent,
                MockMatIconComponent,
            ],
            providers: [
                {
                    provide: MatDialogRef,
                    useValue: matDialogSpy,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: {},
                },
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(DialogAdminPasswordComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('onNoClick() should close the dialog component', () => {
        component.onNoClick();
        expect(matDialogSpy.close).toHaveBeenCalled();
    });

    it('should submit password on Keyboard Enter', () => {
        const eventData: KeyboardEventInit = { key: 'Enter' };
        const keyboardEvent = new KeyboardEvent('keyup', eventData);
        window.dispatchEvent(keyboardEvent);
        expect(matDialogSpy.close).toHaveBeenCalled();
    });
});

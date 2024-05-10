// To let the tests run without errors, mock classes are needed
/* eslint-disable max-classes-per-file */
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { DialogTextInputComponent } from './dialog-text-input.component';

describe('DialogTextInputComponent', () => {
    let component: DialogTextInputComponent;
    let fixture: ComponentFixture<DialogTextInputComponent>;
    const matDialogSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [DialogTextInputComponent, MockDialogTextInputComponent, MockMatFormFieldComponent, MockMatLabelComponent],
            imports: [FormsModule, MatDialogModule],
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
        fixture = TestBed.createComponent(DialogTextInputComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    @Component({
        selector: 'app-dialog-text-input',
        template: '',
    })
    class MockDialogTextInputComponent {}

    @Component({
        // Angular Material Mock: Provided selector does not start by app
        /* eslint-disable @angular-eslint/component-selector */
        selector: 'mat-form-field',
        template: '',
    })
    class MockMatFormFieldComponent {}

    @Component({
        // Angular Material Mock: Provided selector does not start by app
        /* eslint-disable @angular-eslint/component-selector */
        selector: 'mat-label',
        template: '',
    })
    class MockMatLabelComponent {}

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should close the dialog when on enter press', () => {
        component.onEnterPress();
        expect(matDialogSpy.close).toHaveBeenCalled();
    });

    it('should close the dialog on no click', () => {
        component.onNoClick();
        expect(matDialogSpy.close).toHaveBeenCalledWith(null);
    });
});

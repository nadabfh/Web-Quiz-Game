import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { DialogConfirmComponent } from './dialog-confirm.component';
import { of } from 'rxjs';

const mockData = { icon: 'warning', title: 'Title', text: 'Confirmation message', disableClose: true };

describe('DialogConfrimComponent', () => {
    let component: DialogConfirmComponent;
    let fixture: ComponentFixture<DialogConfirmComponent>;
    let dialogRef: MatDialogRef<DialogConfirmComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [MatDialogModule, MatIconModule],
            declarations: [DialogConfirmComponent],
            providers: [
                {
                    provide: MatDialogRef,
                    useValue: { close: () => of(true) },
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: mockData,
                },
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(DialogConfirmComponent);
        component = fixture.componentInstance;
        dialogRef = TestBed.inject(MatDialogRef);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize dialog with correct data', () => {
        expect(component.data).toEqual(mockData);
    });

    it('onCancel should close dialog with false', () => {
        const closeSpy = spyOn(dialogRef, 'close').and.stub();
        component.onCancel();
        expect(closeSpy).toHaveBeenCalledWith(false);
    });

    it('onConfirm should close dialog with true', () => {
        const closeSpy = spyOn(dialogRef, 'close').and.stub();
        component.onConfirm();
        expect(closeSpy).toHaveBeenCalledWith(true);
    });
});

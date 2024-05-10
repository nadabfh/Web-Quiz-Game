import { Component, HostListener, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TextDialogData } from '@app/interfaces/dialog-data/text-dialog-data';

@Component({
    selector: 'app-dialog-text-input',
    templateUrl: './dialog-text-input.component.html',
    styleUrls: ['./dialog-text-input.component.scss'],
})
export class DialogTextInputComponent {
    constructor(
        private dialogRef: MatDialogRef<unknown>,
        @Inject(MAT_DIALOG_DATA) public data: TextDialogData,
    ) {}

    @HostListener('window:keyup.Enter', ['$event'])
    onEnterPress(): void {
        this.dialogRef.close(this.data.input);
    }

    onNoClick(): void {
        this.dialogRef.close(null);
    }
}

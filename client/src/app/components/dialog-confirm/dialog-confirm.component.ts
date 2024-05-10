import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ConfirmDialogData } from '@app/interfaces/dialog-data/confirm-dialog-data';
import { AdminQuestionsListComponent } from '@app/pages/admin-page/admin-questions-list/admin-questions-list.component';

@Component({
    selector: 'app-dialog-confirm',
    templateUrl: './dialog-confirm.component.html',
    styleUrls: ['./dialog-confirm.component.scss'],
})
export class DialogConfirmComponent {
    constructor(
        private readonly dialogRef: MatDialogRef<AdminQuestionsListComponent>,
        @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData,
    ) {
        dialogRef.disableClose = true;
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }

    onConfirm(): void {
        this.dialogRef.close(true);
    }
}

import { Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarConfig, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';
import { DialogConfirmComponent } from '@app/components/dialog-confirm/dialog-confirm.component';
import { NOTFICATION_DURATION } from '@app/constants/feedback-messages';
import { ConfirmDialogData } from '@app/interfaces/dialog-data/confirm-dialog-data';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class NotificationService {
    constructor(
        public snackBar: MatSnackBar,
        public dialog: MatDialog,
    ) {}

    displayErrorMessage(errorMessage: string): MatSnackBarRef<TextOnlySnackBar> {
        return this.openSnackBar(errorMessage, '✖', {
            duration: NOTFICATION_DURATION,
            panelClass: ['error-snackbar'],
        });
    }

    displaySuccessMessage(successMessage: string): MatSnackBarRef<TextOnlySnackBar> {
        return this.openSnackBar(successMessage, '✔', {
            duration: NOTFICATION_DURATION,
            panelClass: ['success-snackbar'],
        });
    }

    displayErrorMessageAction(errorMessage: string, action: string): MatSnackBarRef<TextOnlySnackBar> {
        return this.openSnackBar(errorMessage, action);
    }

    openWarningDialog(warningText: string): Observable<boolean> {
        const warningConfig: MatDialogConfig<ConfirmDialogData> = {
            data: {
                icon: 'warning',
                title: 'Attention',
                text: warningText,
            },
        };
        return this.openConfirmDialog(warningConfig);
    }

    confirmBankUpload(questionTitle: string) {
        const bankUploadConfig: MatDialogConfig<ConfirmDialogData> = {
            data: {
                icon: 'info_outline',
                title: 'Êtes-vous certain de vouloir ajouter cette question à la banque de questions?',
                text: questionTitle,
            },
        };
        return this.openConfirmDialog(bankUploadConfig);
    }

    private openSnackBar(message: string, action: string, options?: MatSnackBarConfig): MatSnackBarRef<TextOnlySnackBar> {
        return this.snackBar.open(message, action, options);
    }

    private openConfirmDialog(config: MatDialogConfig<ConfirmDialogData>): Observable<boolean> {
        const dialogRef = this.dialog.open(DialogConfirmComponent, config);
        return dialogRef.afterClosed().pipe((confirm) => confirm);
    }
}

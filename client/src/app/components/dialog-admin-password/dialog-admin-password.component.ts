import { Component, HostListener, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PasswordDialogData } from '@app/interfaces/dialog-data/password-dialog-data';
import { HomePageComponent } from '@app/pages/home-page/home-page.component';

@Component({
    selector: 'app-dialog-admin-password',
    templateUrl: './dialog-admin-password.component.html',
    styleUrls: ['./dialog-admin-password.component.scss'],
})
export class DialogAdminPasswordComponent {
    isHiddenPassword: boolean;
    constructor(
        private readonly dialogRef: MatDialogRef<HomePageComponent>,
        @Inject(MAT_DIALOG_DATA) public data: PasswordDialogData,
    ) {
        this.isHiddenPassword = true;
    }

    @HostListener('window:keyup.Enter', ['$event'])
    onEnterPress(): void {
        this.dialogRef.close(this.data.password);
    }

    onNoClick(): void {
        this.dialogRef.close();
    }
}

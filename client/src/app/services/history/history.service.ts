import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HistoryItem } from '@app/interfaces/history-item';
import { CommunicationService } from '@app/services/communication/communication.service';

@Injectable({
    providedIn: 'root',
})
export class HistoryService extends CommunicationService<HistoryItem> {
    historyItems: HistoryItem[];
    isLoadingHistory: boolean;

    constructor(http: HttpClient) {
        super(http, 'history');
        this.historyItems = [];
        this.isLoadingHistory = false;
    }

    getHistory(): void {
        this.isLoadingHistory = true;
        this.getAll().subscribe({
            next: (data: HistoryItem[]) => {
                this.historyItems = [...data];
                this.isLoadingHistory = false;
            },
        });
    }

    deleteHistory(): void {
        this.delete('').subscribe({
            next: () => (this.historyItems = []),
        });
    }
}

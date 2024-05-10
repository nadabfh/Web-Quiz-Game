import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CommunicationService } from '@app/services/communication/communication.service';

interface SelectedChoices {
    selected: string[];
}

@Injectable({
    providedIn: 'root',
})
export class ChoiceValidationService extends CommunicationService<SelectedChoices> {
    constructor(http: HttpClient) {
        super(http, 'match/backups');
    }

    validateChoices(selectedChoices: SelectedChoices, currentGameId: string, questionId: string) {
        return this.add(selectedChoices, `${currentGameId}/questions/${questionId}/validate-choice`);
    }
}

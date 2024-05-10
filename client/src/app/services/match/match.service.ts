import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatchContext } from '@app/constants/states';
import { Game } from '@app/interfaces/game';
import { CommunicationService } from '@app/services/communication/communication.service';
import { MatchRoomService } from '@app/services/match-room/match-room.service';
import { MatchContextService } from '@app/services/question-context/question-context.service';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class MatchService extends CommunicationService<Game> {
    questionAdvanced: Subject<void>;
    currentGame: Game;

    questionId: string;
    private questionAdvanceSubject = new Subject<void>();

    constructor(
        http: HttpClient,
        private readonly matchRoomService: MatchRoomService,
        private readonly matchContextService: MatchContextService,
    ) {
        super(http, 'match');
    }

    get questionAdvanced$() {
        return this.questionAdvanceSubject.asObservable();
    }

    getAllGames() {
        return this.getAll('games');
    }

    advanceQuestion() {
        this.questionAdvanceSubject.next();
    }

    getBackupGame(id: string) {
        return this.getById(id, 'backups');
    }

    saveBackupGame(id: string) {
        return this.add(this.currentGame, `backups/${id}`);
    }

    deleteBackupGame(id: string) {
        return this.delete(`backups/${id}`);
    }

    createMatch() {
        const isTestPage = this.matchContextService.getContext() === MatchContext.TestPage;
        const isRandomMode = this.matchContextService.getContext() === MatchContext.RandomMode;
        this.matchRoomService.connect();
        this.matchRoomService.createRoom(this.currentGame.id, isTestPage, isRandomMode);
    }
}

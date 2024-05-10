import { ScrollingModule } from '@angular/cdk/scrolling';
import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { getMockGame } from '@app/constants/game-mocks';
import { DownloadGameService } from '@app/services/download-game/download-game.service';
import { GameService } from '@app/services/game/game.service';
import { of } from 'rxjs';
import { GameListItemComponent } from './game-list-item.component';
import SpyObj = jasmine.SpyObj;

const MOCK_GAME = getMockGame();

describe('GameListItemComponent', () => {
    let component: GameListItemComponent;
    let fixture: ComponentFixture<GameListItemComponent>;
    let gameServiceSpy: SpyObj<GameService>;
    let downloadSpy: SpyObj<DownloadGameService>;

    beforeEach(waitForAsync(() => {
        gameServiceSpy = jasmine.createSpyObj('GameService', ['getGames', 'getGameById', 'toggleGameVisibility', 'deleteGame', 'uploadGame']);
        downloadSpy = jasmine.createSpyObj('DownloadGameService', ['downloadGameAsJson']);

        gameServiceSpy.toggleGameVisibility.and.returnValue(of());

        TestBed.configureTestingModule({
            imports: [MatCardModule, HttpClientModule, MatIconModule, RouterModule, RouterTestingModule, ScrollingModule, MatTooltipModule],
            declarations: [GameListItemComponent],
            providers: [
                { provide: GameService, useValue: gameServiceSpy },
                { provide: DownloadGameService, useValue: downloadSpy },
            ],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(GameListItemComponent);
        component = fixture.componentInstance;
        component.game = MOCK_GAME;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should emit deleteGameFromList Event when deleteGame is called', () => {
        const spy = spyOn(component.deleteGameFromList, 'emit').and.callThrough();
        component.isAdminMode = true;
        component.deleteGame();
        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith(MOCK_GAME.id);
    });

    it('should do nothing if not in admin mode when trying to delete', () => {
        component.isAdminMode = false;
        component.deleteGame();
    });

    it('should display admin buttons if in admin mode', () => {
        component.isAdminMode = true;
        fixture.detectChanges();
        expect(fixture.debugElement.query(By.css('#icons-container'))).toBeTruthy();
    });

    it('should not display edit, export, and delete buttons if not in admin mode', () => {
        component.isAdminMode = false;
        fixture.detectChanges();
        expect(fixture.debugElement.query(By.css('#icons-container'))).toBeNull();
    });

    it('toggleGameVisibility() should call the service to toggle game visibility', () => {
        component.isAdminMode = true;
        component.toggleGameVisibility();
        expect(gameServiceSpy.toggleGameVisibility).toHaveBeenCalledWith(component.game);
    });

    it('toggleGameVisibility() should not call the service to toggle game visibility if not in admin mode', () => {
        component.isAdminMode = false;
        component.toggleGameVisibility();
        expect(gameServiceSpy.toggleGameVisibility).not.toHaveBeenCalled();
    });

    it('downloadGameAsJson() should call the service to download the game as json', () => {
        component.isAdminMode = true;
        component.downloadGameAsJson();
        expect(downloadSpy.downloadGameAsJson).toHaveBeenCalledWith(component.game);
    });

    it('downloadGameAsJson() should not call the service to download the game as json if not in admin mode', () => {
        component.isAdminMode = false;
        component.downloadGameAsJson();
        expect(downloadSpy.downloadGameAsJson).not.toHaveBeenCalled();
    });
});

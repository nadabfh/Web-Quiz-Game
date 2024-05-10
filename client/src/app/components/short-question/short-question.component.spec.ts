import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShortQuestionComponent } from './short-question.component';
import { getMockQuestion } from '@app/constants/question-mocks';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

describe('ShortQuestionComponent', () => {
    let component: ShortQuestionComponent;
    let fixture: ComponentFixture<ShortQuestionComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [MatCardModule, MatIconModule],
            declarations: [ShortQuestionComponent],
        });

        fixture = TestBed.createComponent(ShortQuestionComponent);
        component = fixture.componentInstance;

        component.question = getMockQuestion();
        component.question.lastModification = '5000';
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

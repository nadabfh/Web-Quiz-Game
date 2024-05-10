import { Component, Input } from '@angular/core';
import { Question } from '@app/interfaces/question';

@Component({
    selector: 'app-short-question',
    templateUrl: './short-question.component.html',
    styleUrls: ['./short-question.component.scss'],
})
export class ShortQuestionComponent {
    @Input() question: Question;
}

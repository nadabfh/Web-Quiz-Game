import { Pipe, PipeTransform } from '@angular/core';
import { Question } from '@app/interfaces/question';
import { QuestionType } from '@common/constants/question-types';

@Pipe({
    name: 'filterByQuestionType',
    pure: false,
})
export class FilterByQuestionTypePipe implements PipeTransform {
    transform(questions: Question[], filter: string): Question[] {
        if (filter === QuestionType.MultipleChoice) {
            return questions.filter((question: Question) => question.type === QuestionType.MultipleChoice);
        } else if (filter === QuestionType.LongAnswer) {
            return questions.filter((question: Question) => question.type === QuestionType.LongAnswer);
        }
        return questions;
    }
}

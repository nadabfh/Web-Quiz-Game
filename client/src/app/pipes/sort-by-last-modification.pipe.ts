import { Pipe, PipeTransform } from '@angular/core';
import { Question } from '@app/interfaces/question';

@Pipe({
    name: 'sortByLastModification',
})
export class SortByLastModificationPipe implements PipeTransform {
    transform(questionList: Question[], sortDirection: string) {
        if (sortDirection !== 'ascending' && sortDirection !== 'descending') return questionList;

        return questionList.sort((a: Question, b: Question) => {
            if (sortDirection === 'ascending') return Date.parse(b.lastModification) - Date.parse(a.lastModification);
            else return Date.parse(a.lastModification) - Date.parse(b.lastModification);
        });
    }
}

import { Pipe, PipeTransform } from '@angular/core';
import { LongAnswerInfo } from '@common/interfaces/long-answer-info';

@Pipe({
    name: 'sortAnswers',
})
export class SortAnswersPipe implements PipeTransform {
    transform(info: LongAnswerInfo[]): LongAnswerInfo[] {
        return info.sort((firstInfo: LongAnswerInfo, secondInfo: LongAnswerInfo) => firstInfo.username.localeCompare(secondInfo.username));
    }
}

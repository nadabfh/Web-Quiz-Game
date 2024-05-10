import { Choice } from '@app/model/database/choice';
import { ChoiceTally } from '@common/interfaces/choice-tally';
import { Tracker } from '@app/model/tally-trackers/base-tracker/tracker';

export class ChoiceTracker extends Tracker<ChoiceTally> {
    resetChoiceTracker(questionText: string, newChoices: Choice[]): void {
        super.resetTracker(questionText);
        newChoices.forEach((choice) => {
            this.items[choice.text] = { text: choice.text, isCorrect: choice.isCorrect, tally: 0 };
        });
    }
}

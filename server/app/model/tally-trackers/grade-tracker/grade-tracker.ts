import { Tracker } from '@app/model/tally-trackers/base-tracker/tracker';
import { Grade, GradeTally } from '@common/interfaces/choice-tally';

export class GradeTracker extends Tracker<GradeTally> {
    constructor(questionText: string, possibleGrades: Grade[]) {
        super();
        this.resetGradeTracker(questionText, possibleGrades);
    }

    resetGradeTracker(questionText: string, possibleGrades: Grade[]): void {
        super.resetTracker(questionText);
        possibleGrades.forEach((grade) => {
            this.items[grade.score] = { score: grade.score, tally: 0 };
        });
    }
}

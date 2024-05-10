import { GradeTracker } from './grade-tracker';

describe('GradeTracker', () => {
    let gradeTracker: GradeTracker;
    const possibleGrades = [{ score: '0' }, { score: '50' }, { score: '100' }];

    beforeEach(() => {
        gradeTracker = new GradeTracker('mockQuestion', possibleGrades);
    });

    it('should be defined', () => {
        expect(gradeTracker).toBeDefined();
    });

    it('incrementCount() should increment the count for the specified grade', () => {
        gradeTracker.incrementCount('0');
        gradeTracker.incrementCount('0');
        gradeTracker.incrementCount('50');

        expect(gradeTracker.items['0'].tally).toBe(2);
        expect(gradeTracker.items['50'].tally).toBe(1);
    });

    it('decrementCount() should decrement the count for the specified grade if count is greater than 0', () => {
        gradeTracker.items['0'].tally = 3;
        gradeTracker.items['50'].tally = 1;

        gradeTracker.decrementCount('0');
        gradeTracker.decrementCount('50');

        expect(gradeTracker.items['0'].tally).toBe(2);
        expect(gradeTracker.items['50'].tally).toBe(0);
    });

    it('decrementCount() should not decrement the count if it is already 0', () => {
        gradeTracker.items['0'].tally = 0;

        gradeTracker.decrementCount('0');

        expect(gradeTracker.items['0'].tally).toBe(0);
    });

    it('resetGradeTracker() should reset all counts to 0 based on provided grades', () => {
        gradeTracker.items['0'].tally = 2;
        gradeTracker.items['50'].tally = 3;
        gradeTracker.items['100'].tally = 4;

        gradeTracker.resetGradeTracker('mockQuestion', possibleGrades);

        expect(gradeTracker.items['0'].tally).toBe(0);
        expect(gradeTracker.items['50'].tally).toBe(0);
        expect(gradeTracker.items['100'].tally).toBe(0);
    });
});

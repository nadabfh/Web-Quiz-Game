import { ChoiceTracker } from './choice-tracker';

describe('choiceTracker', () => {
    let choiceTracker: ChoiceTracker;

    beforeEach(() => {
        choiceTracker = new ChoiceTracker();
        choiceTracker.resetChoiceTracker('mockQuestion', [{ text: 'choice1' }, { text: 'choice2' }]);
    });

    it('should be defined', () => {
        expect(choiceTracker).toBeDefined();
    });

    it('incrementCount() should increment the count for the specified choice', () => {
        choiceTracker.incrementCount('choice1');
        choiceTracker.incrementCount('choice1');
        choiceTracker.incrementCount('choice2');

        expect(choiceTracker.items['choice1'].tally).toBe(2);
        expect(choiceTracker.items['choice2'].tally).toBe(1);
    });

    it('decrementCount() should decrement the count for the specified key if count is greater than 0', () => {
        choiceTracker.items['choice1'].tally = 3;
        choiceTracker.items['choice2'].tally = 1;

        choiceTracker.decrementCount('choice1');
        choiceTracker.decrementCount('choice2');

        expect(choiceTracker.items['choice1'].tally).toBe(2);
        expect(choiceTracker.items['choice2'].tally).toBe(0);
    });

    it('decrementCount() should not decrement the count if it is already 0', () => {
        choiceTracker.items['choice1'].tally = 0;

        choiceTracker.decrementCount('choice1');

        expect(choiceTracker.items['choice1'].tally).toBe(0);
    });

    it('resetChoiceTracker() should reset all counts to 0 based on provided choices', () => {
        choiceTracker.items['choice1'].tally = 2;
        choiceTracker.items['choice2'].tally = 3;

        expect(choiceTracker.items['choice3']).toBeUndefined();
        const choices = [{ text: 'choice1' }, { text: 'choice2' }, { text: 'choice3' }];
        choiceTracker.resetChoiceTracker('caca', choices);

        expect(choiceTracker.items['choice1'].tally).toBe(0);
        expect(choiceTracker.items['choice2'].tally).toBe(0);
        expect(choiceTracker.items['choice3']).toBeDefined();
    });
});

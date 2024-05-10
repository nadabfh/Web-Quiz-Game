import { LongAnswer } from './long-answer';

describe('LongAnswer', () => {
    let longAnswer: LongAnswer;

    beforeEach(() => {
        longAnswer = new LongAnswer();
    });

    it('should be defined', () => {
        expect(longAnswer).toBeDefined();
    });

    it('should reset answer correctly', () => {
        longAnswer.isSubmitted = true;
        longAnswer.timestamp = 12345;
        longAnswer.answer = 'Long answer';

        longAnswer.resetAnswer();

        expect(longAnswer.isSubmitted).toBe(false);
        expect(longAnswer.timestamp).toBeUndefined();
        expect(longAnswer.answer).toBe('');
    });

    it('should update answer correctly', () => {
        longAnswer.updateChoice('New answer');
        expect(longAnswer.answer).toBe('New answer');
    });
});

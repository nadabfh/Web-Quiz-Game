import { MultipleChoiceAnswer } from './multiple-choice-answer';

describe('MultipleChoiceAnswer', () => {
    let multipleChoiceAnswer: MultipleChoiceAnswer;

    beforeEach(() => {
        multipleChoiceAnswer = new MultipleChoiceAnswer();
    });

    it('should be defined', () => {
        expect(multipleChoiceAnswer).toBeDefined();
    });

    it('should reset answer correctly', () => {
        multipleChoiceAnswer.isSubmitted = true;
        multipleChoiceAnswer.timestamp = 12345;
        multipleChoiceAnswer.selectedChoices.set('choice1', true);
        multipleChoiceAnswer.selectedChoices.set('choice2', false);

        multipleChoiceAnswer.resetAnswer();

        expect(multipleChoiceAnswer.isSubmitted).toBe(false);
        expect(multipleChoiceAnswer.timestamp).toBeUndefined();
        expect(multipleChoiceAnswer.selectedChoices.size).toBe(0);
    });

    it('should update choice correctly', () => {
        multipleChoiceAnswer.updateChoice('choice1', true);
        multipleChoiceAnswer.updateChoice('choice2', false);

        expect(multipleChoiceAnswer.selectedChoices.size).toBe(2);
        expect(multipleChoiceAnswer.selectedChoices.get('choice1')).toBe(true);
        expect(multipleChoiceAnswer.selectedChoices.get('choice2')).toBe(false);
    });
});

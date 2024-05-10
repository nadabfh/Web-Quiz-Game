import {
    MAX_CHOICES_NUMBER,
    MAX_DURATION,
    MAX_POINTS,
    MIN_CHOICES_NUMBER,
    MIN_DURATION,
    MIN_POINTS,
    MIN_QUESTIONS_NUMBER,
    STEP_POINTS,
} from '@app/constants/game-validation-constraints';
import {
    ERROR_CHOICES_NUMBER,
    ERROR_CHOICES_RATIO,
    ERROR_DURATION,
    ERROR_EMPTY_DESCRIPTION,
    ERROR_EMPTY_QUESTION,
    ERROR_EMPTY_TITLE,
    ERROR_POINTS,
    ERROR_QUESTIONS_NUMBER,
    ERROR_QUESTION_TYPE,
    ERROR_REPEAT_CHOICES,
} from '@app/constants/game-validation-errors';
import { QuestionType } from '@app/constants/question-types';
import { Choice } from '@app/model/database/choice';
import { Game } from '@app/model/database/game';
import { Question } from '@app/model/database/question';
import { CreateQuestionDto } from '@app/model/dto/question/create-question-dto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GameValidationService {
    isValidString(text: string): boolean {
        return text && text.trim() !== '';
    }

    isValidChoicesRatio(question: CreateQuestionDto): boolean {
        const hasValidRightChoice = question.choices.some((choice: Choice) => choice.isCorrect && this.isValidString(choice.text));
        const hasValidWrongChoice = question.choices.some((choice: Choice) => !choice.isCorrect && this.isValidString(choice.text));
        return hasValidRightChoice && hasValidWrongChoice;
    }

    isValidRange(quantity: number, firstBound: number, secondBound: number) {
        const min = Math.min(firstBound, secondBound);
        const max = Math.max(firstBound, secondBound);
        return quantity >= min && quantity <= max;
    }

    isUniqueChoices(choices: Choice[]): boolean {
        const choicesTexts = [];
        choices.forEach((choice) => {
            choicesTexts.push(choice.text);
        });
        return new Set(choicesTexts).size === choicesTexts.length;
    }

    checkErrors(errorConditions: Map<string, boolean>, errorMessages: string[]) {
        errorConditions.forEach((hasError: boolean, message: string) => {
            if (hasError) errorMessages.push(message);
        });
        return errorMessages;
    }

    findGeneralQuestionErrors(question: CreateQuestionDto): string[] {
        const errorConditions: Map<string, boolean> = new Map([
            [ERROR_POINTS, !this.isValidRange(question.points, MIN_POINTS, MAX_POINTS) || question.points % STEP_POINTS !== 0],
            [ERROR_EMPTY_QUESTION, !this.isValidString(question.text)],
            [ERROR_QUESTION_TYPE, question.type !== QuestionType.MultipleChoice && question.type !== QuestionType.LongAnswer],
        ]);
        return this.checkErrors(errorConditions, []);
    }

    findChoicesQuestionErrors(question: CreateQuestionDto): string[] {
        const errorMessages: string[] = this.findGeneralQuestionErrors(question);
        const errorConditions: Map<string, boolean> = new Map([
            [ERROR_CHOICES_NUMBER, !this.isValidRange(question.choices.length, MIN_CHOICES_NUMBER, MAX_CHOICES_NUMBER)],
            [ERROR_REPEAT_CHOICES, !this.isUniqueChoices(question.choices)],
            [ERROR_CHOICES_RATIO, !this.isValidChoicesRatio(question)],
        ]);
        return this.checkErrors(errorConditions, errorMessages);
    }

    findGameErrors(game: Game): string[] {
        const errorConditions: Map<string, boolean> = new Map([
            [ERROR_EMPTY_TITLE, !this.isValidString(game.title)],
            [ERROR_EMPTY_DESCRIPTION, !this.isValidString(game.description)],
            [ERROR_DURATION, !this.isValidRange(game.duration, MIN_DURATION, MAX_DURATION)],
            [ERROR_QUESTIONS_NUMBER, game.questions.length < MIN_QUESTIONS_NUMBER],
        ]);

        const errorMessages = this.checkErrors(errorConditions, []);

        game.questions.forEach((question: CreateQuestionDto, index: number) => {
            const questionErrorMessages = this.findQuestionErrors(question);
            if (questionErrorMessages.length) {
                errorMessages.push(`La question ${index + 1} est invalide:`);
                questionErrorMessages.forEach((message: string) => errorMessages.push(message));
            }
        });
        return errorMessages;
    }

    findQuestionErrors(question: Question): string[] {
        return question.type === QuestionType.MultipleChoice ? this.findChoicesQuestionErrors(question) : this.findGeneralQuestionErrors(question);
    }
}

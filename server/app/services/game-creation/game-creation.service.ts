import { QuestionType } from '@app/constants/question-types';
import { Choice } from '@app/model/database/choice';
import { Game } from '@app/model/database/game';
import { Question } from '@app/model/database/question';
import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class GameCreationService {
    updateDateAndVisibility(game: Game): Game {
        const currentDate = new Date();
        game.isVisible = false;
        game.lastModification = currentDate;
        game.questions.forEach((question) => (question.lastModification = currentDate));
        return game;
    }

    generateId(game: Game): Game {
        game.id = uuidv4();
        game.questions.forEach((question) => (question.id = uuidv4()));
        return game;
    }

    completeIsCorrectField(game: Game): Game {
        game.questions.forEach((question: Question) => {
            this.completeIsCorrectChoice(question);
        });
        return game;
    }

    completeIsCorrectChoice(question: Question): Question {
        if (question.type !== QuestionType.LongAnswer) {
            question.choices.forEach((choice: Choice) => {
                choice.isCorrect = !!choice.isCorrect;
            });
        }
        return question;
    }
}

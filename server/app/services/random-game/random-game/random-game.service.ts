import { QuestionType } from '@app/constants/question-types';
import { MINIMUM_QUESTIONS, RANDOM_GAME } from '@app/constants/random-game-constants';
import { Game } from '@app/model/database/game';
import { Question } from '@app/model/database/question';
import { GameCreationService } from '@app/services/game-creation/game-creation.service';
import { QuestionService } from '@app/services/question/question.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RandomGameService {
    allBankQuestions: Question[] = [];
    constructor(
        private readonly questionService: QuestionService,
        private gameCreationService: GameCreationService,
    ) {
        this.initializeService();
    }

    async initializeService() {
        await this.fetchAllQuestions();
    }

    async fetchAllQuestions() {
        try {
            const questions = await this.questionService.getAllQuestions();
            this.allBankQuestions = questions.filter((question) => question.type === QuestionType.MultipleChoice);
        } catch (error) {
            this.allBankQuestions = [];
        }
    }

    isRandomGameAvailable(): boolean {
        return this.allBankQuestions.length >= MINIMUM_QUESTIONS;
    }

    getRandomQuestions(): Question[] {
        if (this.isRandomGameAvailable()) {
            const randomQuestions: Question[] = [];
            while (randomQuestions.length < MINIMUM_QUESTIONS) {
                const randomIndex: number = Math.floor(Math.random() * this.allBankQuestions.length);
                const randomQuestion: Question = this.allBankQuestions[randomIndex];
                if (!randomQuestions.includes(randomQuestion)) {
                    randomQuestions.push(randomQuestion);
                }
            }
            return randomQuestions;
        }
        return [];
    }

    generateRandomGame(): Game {
        const questions: Question[] = this.getRandomQuestions();
        const game: Game = { ...RANDOM_GAME };
        game.questions = questions;
        const newRandomGame = this.gameCreationService.generateId(game);
        return newRandomGame;
    }
}

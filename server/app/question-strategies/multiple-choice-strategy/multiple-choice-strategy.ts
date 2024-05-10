import { GradingEvents } from '@app/constants/grading-events';
import { MatchRoom } from '@app/model/schema/match-room.schema';
import { Player } from '@app/model/schema/player.schema';
import { AnswerCorrectness } from '@common/constants/answer-correctness';
import { BONUS_FACTOR } from '@common/constants/match-constants';
import { AnswerEvents } from '@common/events/answer.events';
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { QuestionStrategy } from '@app/question-strategies/question-strategy';
import { MultipleChoiceAnswer } from '@app/model/answer-types/multiple-choice-answer/multiple-choice-answer';
import { ChoiceTracker } from '@app/model/tally-trackers/choice-tracker/choice-tracker';
import { MultipleChoiceHistogram } from '@common/interfaces/histogram';
import { QuestionType } from '@app/constants/question-types';
import { PanicThresholdTime } from '@app/constants/panic-threasholds-time';

@Injectable()
export class MultipleChoiceStrategy extends QuestionStrategy {
    constructor(private readonly eventEmitter: EventEmitter2) {
        super(QuestionType.MultipleChoice, PanicThresholdTime.MultipleChoice);
    }

    gradeAnswers(matchRoom: MatchRoom, players: Player[]): void {
        this.calculateScore(matchRoom, players);
        this.eventEmitter.emit(GradingEvents.GradingComplete, matchRoom.code);
    }

    calculateScore(matchRoom: MatchRoom, players: Player[]) {
        const currentQuestionPoints = matchRoom.currentQuestion.points;
        const correctPlayers: Player[] = [];
        let fastestTime: number;
        const correctAnswer: string[] = matchRoom.currentQuestionAnswer;
        players.forEach((player) => {
            if (this.isCorrectAnswer(player.answer as MultipleChoiceAnswer, correctAnswer)) {
                player.answerCorrectness = AnswerCorrectness.GOOD;
                player.score += currentQuestionPoints;
                correctPlayers.push(player);
                if ((!fastestTime || player.answer.timestamp < fastestTime) && player.answer.timestamp !== Infinity)
                    fastestTime = player.answer.timestamp;
            }
        });

        if ((fastestTime && !matchRoom.isTestRoom) || matchRoom.isTestRoom)
            this.computeFastestPlayerBonus(currentQuestionPoints, fastestTime, correctPlayers);
    }

    buildHistogram(matchRoom: MatchRoom, choice: string, selection: boolean): MultipleChoiceHistogram {
        const choiceTracker = matchRoom.choiceTracker;
        if (selection) choiceTracker.incrementCount(choice);
        else choiceTracker.decrementCount(choice);
        return this.convertToHistogram(choiceTracker);
    }

    private isCorrectAnswer(playerAnswer: MultipleChoiceAnswer, correctAnswer: string[]) {
        const playerChoices = this.filterSelectedChoices(playerAnswer);
        return playerChoices.sort().toString() === correctAnswer.sort().toString();
    }

    private filterSelectedChoices(playerAnswer: MultipleChoiceAnswer) {
        const selectedChoices: string[] = [];
        for (const [choice, selection] of playerAnswer.selectedChoices) {
            if (selection) selectedChoices.push(choice);
        }
        return selectedChoices;
    }

    private computeFastestPlayerBonus(points: number, fastestTime: number, correctPlayers: Player[]) {
        const fastestPlayers = correctPlayers.filter((player) => player.answer.timestamp === fastestTime);
        if (fastestPlayers.length !== 1) return;
        const fastestPlayer = fastestPlayers[0];
        const bonus = points * BONUS_FACTOR;
        fastestPlayer.score += bonus;
        fastestPlayer.bonusCount++;
        fastestPlayer.socket.emit(AnswerEvents.Bonus, bonus);
    }

    private convertToHistogram(choiceTracker: ChoiceTracker): MultipleChoiceHistogram {
        return { question: choiceTracker.question, type: QuestionType.MultipleChoice, choiceTallies: Object.values(choiceTracker.items) };
    }
}

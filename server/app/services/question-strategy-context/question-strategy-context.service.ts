import { MultipleChoiceAnswer } from '@app/model/answer-types/multiple-choice-answer/multiple-choice-answer';
import { LongAnswer } from '@app/model/answer-types/long-answer/long-answer';
import { MatchRoom } from '@app/model/schema/match-room.schema';
import { Player } from '@app/model/schema/player.schema';
import { LongAnswerStrategy } from '@app/question-strategies/long-answer-strategy/long-answer-strategy';
import { MultipleChoiceStrategy } from '@app/question-strategies/multiple-choice-strategy/multiple-choice-strategy';
import { QuestionStrategy } from '@app/question-strategies/question-strategy';
import { LONG_ANSWER_TIME } from '@common/constants/match-constants';
import { Histogram } from '@common/interfaces/histogram';
import { LongAnswerInfo } from '@common/interfaces/long-answer-info';
import { Injectable } from '@nestjs/common';

@Injectable()
export class QuestionStrategyContext {
    private questionStrategies: Map<string, QuestionStrategy>;

    constructor(
        private readonly multipleChoiceStrategy: MultipleChoiceStrategy,
        private readonly longAnswerStrategy: LongAnswerStrategy,
    ) {
        this.questionStrategies = new Map<string, QuestionStrategy>();
    }

    getQuestionStrategy(matchRoomCode: string): string {
        return this.questionStrategies.get(matchRoomCode).type;
    }

    getQuestionPanicThreshold(matchRoomCode: string): number {
        return this.questionStrategies.get(matchRoomCode).panicThresholdTime;
    }

    setQuestionStrategy(matchRoom: MatchRoom) {
        const currentQuestionType = matchRoom.currentQuestion.type;

        switch (currentQuestionType) {
            case 'QCM':
                this.setMultipleChoiceStrategy(matchRoom.code);
                matchRoom.players.forEach((player) => (player.answer = new MultipleChoiceAnswer()));
                matchRoom.questionDuration = matchRoom.game.duration;
                break;

            case 'QRL':
                this.setLongAnswerStrategy(matchRoom.code);
                matchRoom.players.forEach((player) => (player.answer = new LongAnswer()));
                matchRoom.questionDuration = LONG_ANSWER_TIME;
                break;
        }
    }

    gradeAnswers(matchRoom: MatchRoom, players: Player[]) {
        this.questionStrategies.get(matchRoom.code).gradeAnswers(matchRoom, players);
    }

    calculateScore(matchRoom: MatchRoom, players: Player[], grades?: LongAnswerInfo[]) {
        this.questionStrategies.get(matchRoom.code).calculateScore(matchRoom, players, grades);
    }

    buildHistogram(matchRoom: MatchRoom, choice?: string, selection?: boolean): Histogram {
        return this.questionStrategies.get(matchRoom.code).buildHistogram(matchRoom, choice, selection);
    }

    deleteRoom(matchRoomCode: string) {
        this.questionStrategies.delete(matchRoomCode);
    }

    private setMultipleChoiceStrategy(matchRoomCode: string) {
        this.questionStrategies.set(matchRoomCode, this.multipleChoiceStrategy);
    }

    private setLongAnswerStrategy(matchRoomCode: string) {
        this.questionStrategies.set(matchRoomCode, this.longAnswerStrategy);
    }
}

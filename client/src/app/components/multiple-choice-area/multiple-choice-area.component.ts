import { Component, HostListener, OnInit } from '@angular/core';
import { MatchContext } from '@app/constants/states';
import { Choice } from '@app/interfaces/choice';
import { AnswerService } from '@app/services/answer/answer.service';
import { MatchRoomService } from '@app/services/match-room/match-room.service';
import { MatchContextService } from '@app/services/question-context/question-context.service';

@Component({
    selector: 'app-multiple-choice-area',
    templateUrl: './multiple-choice-area.component.html',
    styleUrls: ['./multiple-choice-area.component.scss'],
})
export class MultipleChoiceAreaComponent implements OnInit {
    selectedAnswers: Choice[];

    constructor(
        public matchRoomService: MatchRoomService,
        public matchContextService: MatchContextService,
        public answerService: AnswerService,
    ) {}

    get contextOptions(): typeof MatchContext {
        return MatchContext;
    }

    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        if (document?.activeElement?.id === 'chat-input') return;

        const numKey = parseInt(event.key, 5);
        if (!numKey || !this.matchRoomService.currentQuestion.choices) return;

        if (numKey >= 1 && numKey <= this.matchRoomService.currentQuestion.choices.length) {
            const choiceIndex = numKey - 1;
            const choice = this.matchRoomService.currentQuestion.choices[choiceIndex];
            if (choice) {
                this.selectChoice(choice);
            }
        }
    }

    ngOnInit(): void {
        this.resetStateForNewQuestion();
    }

    selectChoice(choice: Choice): void {
        if (this.answerService.isSelectionEnabled) {
            this.answerService.showFeedback = false;
            if (!this.selectedAnswers.includes(choice)) {
                this.selectedAnswers.push(choice);
                this.answerService.selectChoice(choice.text, {
                    username: this.matchRoomService.getUsername(),
                    roomCode: this.matchRoomService.getRoomCode(),
                });
            } else {
                this.selectedAnswers = this.selectedAnswers.filter((answer) => answer !== choice);
                this.answerService.deselectChoice(choice.text, {
                    username: this.matchRoomService.getUsername(),
                    roomCode: this.matchRoomService.getRoomCode(),
                });
            }
        }
    }

    isSelected(choice: Choice): boolean {
        return this.selectedAnswers.includes(choice);
    }

    isCorrectAnswer(choice: Choice): boolean {
        return this.answerService.correctAnswer.includes(choice.text);
    }

    private resetStateForNewQuestion(): void {
        this.answerService.showFeedback = false;
        this.selectedAnswers = [];
        this.answerService.resetStateForNewQuestion();
    }
}

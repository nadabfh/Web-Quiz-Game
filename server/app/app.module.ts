import { AuthenticationController } from '@app/controllers/authentication/authentication.controller';
import { GameController } from '@app/controllers/game/game.controller';
import { MatchController } from '@app/controllers/match/match.controller';
import { QuestionController } from '@app/controllers/question/question.controller';
import { AnswerGateway } from '@app/gateways/answer/answer.gateway';
import { ChatGateway } from '@app/gateways/chat/chat.gateway';
import { MatchGateway } from '@app/gateways/match/match.gateway';
import { Game, gameSchema } from '@app/model/database/game';
import { Question, questionSchema } from '@app/model/database/question';
import { AnswerService } from '@app/services/answer/answer.service';
import { AuthenticationService } from '@app/services/authentication/authentication.service';
import { ChatService } from '@app/services/chat/chat.service';
import { GameCreationService } from '@app/services/game-creation/game-creation.service';
import { GameValidationService } from '@app/services/game-validation/game-validation.service';
import { GameService } from '@app/services/game/game.service';
import { HistogramService } from '@app/services/histogram/histogram.service';
import { MatchBackupService } from '@app/services/match-backup/match-backup.service';
import { QuestionService } from '@app/services/question/question.service';
import { TimeService } from '@app/services/time/time.service';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { BackupController } from './controllers/backup/backup.controller';
import { HistoryController } from './controllers/history/history.controller';
import { HistoryItem, historyItemSchema } from './model/database/history-item';
import { HistoryService } from './services/history/history.service';
import { MatchRoomService } from './services/match-room/match-room.service';
import { PlayerRoomService } from './services/player-room/player-room.service';
import { QuestionStrategyContext } from './services/question-strategy-context/question-strategy-context.service';
import { LongAnswerStrategy } from '@app/question-strategies/long-answer-strategy/long-answer-strategy';
import { MultipleChoiceStrategy } from '@app/question-strategies/multiple-choice-strategy/multiple-choice-strategy';
import { RandomGameService } from './services/random-game/random-game/random-game.service';
import { TimerGateway } from './gateways/timer/timer.gateway';
@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (config: ConfigService) => ({
                uri: config.get<string>('DATABASE_CONNECTION_STRING'),
            }),
        }),
        MongooseModule.forFeature([{ name: Game.name, schema: gameSchema }]),
        MongooseModule.forFeature([{ name: Question.name, schema: questionSchema }]),
        MongooseModule.forFeature([{ name: HistoryItem.name, schema: historyItemSchema }]),
        EventEmitterModule.forRoot(),
    ],
    controllers: [QuestionController, GameController, MatchController, AuthenticationController, BackupController, HistoryController],
    providers: [
        MatchGateway,
        Logger,
        QuestionService,
        GameService,
        GameValidationService,
        MatchBackupService,
        AuthenticationService,
        GameCreationService,
        MatchRoomService,
        TimeService,
        PlayerRoomService,
        ChatService,
        AnswerGateway,
        AnswerService,
        HistogramService,
        ChatGateway,
        HistoryService,
        RandomGameService,
        QuestionStrategyContext,
        MultipleChoiceStrategy,
        LongAnswerStrategy,
        TimerGateway,
    ],
})
export class AppModule {}

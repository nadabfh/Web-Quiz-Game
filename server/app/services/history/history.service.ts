import { HistoryItem, HistoryItemDocument } from '@app/model/database/history-item';
import { MatchRoom } from '@app/model/schema/match-room.schema';
import { Player } from '@app/model/schema/player.schema';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class HistoryService {
    constructor(@InjectModel(HistoryItem.name) public historyModel: Model<HistoryItemDocument>) {}

    async getHistory(): Promise<HistoryItem[]> {
        return await this.historyModel.find({});
    }

    async deleteHistory(): Promise<void> {
        await this.historyModel.deleteMany({});
    }

    computeBestScore(players: Player[]): number {
        return players.reduce((previous, current) => (previous && previous.score > current.score ? previous : current)).score;
    }

    createHistoryItem(matchRoom: MatchRoom): void {
        const newHistoryItem: HistoryItem = {
            title: matchRoom.game.title,
            date: matchRoom.startTime,
            playersCount: matchRoom.players.length,
            bestScore: this.computeBestScore(matchRoom.players),
        };
        this.addHistoryItem(newHistoryItem);
    }

    async addHistoryItem(historyItem: HistoryItem): Promise<void> {
        await this.historyModel.create(historyItem);
    }
}

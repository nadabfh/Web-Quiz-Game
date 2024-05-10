import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type HistoryItemDocument = HistoryItem & Document;

@Schema()
export class HistoryItem {
    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    date: Date;

    @Prop({ required: true })
    playersCount: number;

    @Prop({ required: true })
    bestScore: number;
}

export const historyItemSchema = SchemaFactory.createForClass(HistoryItem);

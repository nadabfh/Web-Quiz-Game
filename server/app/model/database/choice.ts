import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsString } from 'class-validator';
import { Document } from 'mongoose';

export type ChoiceDocument = Choice & Document;

@Schema()
export class Choice {
    @Prop({ required: true })
    @IsString()
    text: string;

    @Prop({ required: false, default: false })
    isCorrect?: boolean;
}

export const choiceSchema = SchemaFactory.createForClass(Choice);

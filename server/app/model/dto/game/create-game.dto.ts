import { Question } from '@app/model/database/question';
import { Prop } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateGameDto {
    @ApiProperty()
    @IsString()
    @IsOptional()
    id: string;

    @ApiProperty()
    @IsString()
    @Prop({ required: true })
    title: string;

    @ApiProperty()
    @IsString()
    @Prop({ required: true })
    description: string;

    @ApiProperty()
    @IsNumber()
    @Prop({ required: true })
    duration: number;

    @ApiProperty()
    @IsOptional()
    lastModification: Date;

    @ApiProperty()
    @IsOptional()
    @Prop({ required: false })
    isVisible: boolean;

    @ApiProperty()
    @Prop({ required: true })
    questions: Question[];
}

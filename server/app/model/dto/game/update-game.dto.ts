import { Question } from '@app/model/database/question';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class UpdateGameDto {
    @ApiProperty()
    @IsString()
    id: string;

    @ApiProperty()
    @IsString()
    title: string;

    @ApiProperty()
    @IsString()
    description: string;

    @ApiProperty()
    @IsNumber()
    duration: number;

    @ApiProperty()
    lastModification: Date;

    @ApiProperty()
    isVisible: boolean;

    @ApiProperty()
    questions: Question[];
}

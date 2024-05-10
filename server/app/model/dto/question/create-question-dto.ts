import { Choice } from '@app/model/database/choice';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateQuestionDto {
    @ApiProperty()
    @IsString()
    @IsOptional()
    id: string;

    @ApiProperty()
    @IsString()
    type: string;

    @ApiProperty()
    @IsString()
    text: string;

    @ApiProperty()
    @IsNumber()
    points: number;

    @ApiProperty()
    choices: Choice[];

    @ApiProperty()
    lastModification: Date;
}

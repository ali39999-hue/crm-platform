import { IsNotEmpty, IsString } from 'class-validator';

export class ScheduleNextActionDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  dueAt!: string;
}

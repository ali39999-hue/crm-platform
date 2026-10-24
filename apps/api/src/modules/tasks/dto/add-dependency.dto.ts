import { IsNotEmpty, IsUUID } from 'class-validator';

export class AddDependencyDto {
  @IsUUID()
  @IsNotEmpty()
  dependsOnId!: string;
}

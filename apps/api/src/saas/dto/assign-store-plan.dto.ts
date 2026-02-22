import { IsIn, IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

const SUBSCRIPTION_STATUSES = ['trialing', 'active', 'past_due', 'canceled', 'suspended'] as const;

export class AssignStorePlanDto {
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  planCode!: string;

  @IsOptional()
  @IsIn(SUBSCRIPTION_STATUSES)
  status?: (typeof SUBSCRIPTION_STATUSES)[number];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  trialDays?: number;
}

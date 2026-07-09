import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { IsArray, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { AuthGuard, Roles, RolesGuard } from '../auth/auth.guard';
import { IncentivesService } from './incentives.service';

class IssueIncentiveDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  recipientIds!: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  honorValue?: number;
}

@Controller('incentives')
@UseGuards(AuthGuard, RolesGuard)
export class IncentivesController {
  constructor(private readonly incentives: IncentivesService) {}

  @Post()
  @Roles('super_admin', 'supervisor')
  issue(@Req() req: { user: { id: string } }, @Body() dto: IssueIncentiveDto) {
    return this.incentives.issue(req.user.id, dto);
  }

  @Get()
  list(@Req() req: { user: { id: string; role: string } }) {
    return this.incentives.list(req.user);
  }
}

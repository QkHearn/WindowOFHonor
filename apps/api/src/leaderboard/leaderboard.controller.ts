import { Controller, Get, Query } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboard: LeaderboardService) {}

  @Get('personal')
  personal(
    @Query('scope') scope?: string,
    @Query('period') period?: string,
    @Query('limit') limit?: string,
  ) {
    return this.leaderboard.personal(scope ?? 'team', period ?? 'all', Number(limit ?? 10));
  }

  @Get('team')
  team(@Query('period') period?: string, @Query('limit') limit?: string) {
    return this.leaderboard.team(period ?? 'all', Number(limit ?? 10));
  }

  @Get('partners')
  partners(@Query('limit') limit?: string) {
    return this.leaderboard.partners(Number(limit ?? 20));
  }
}

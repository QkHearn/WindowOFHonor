import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { QueriesService } from './queries.service';
import { ServiceTokenGuard } from './service-token.guard';

@Controller('queries')
@UseGuards(ServiceTokenGuard)
export class QueriesController {
  constructor(private readonly queries: QueriesService) {}

  /** 查询全部荣誉（激励记录） */
  @Get('honors')
  allHonors(@Query('limit') limit?: string) {
    return this.queries.listAllHonors(limit ? Number(limit) : 200);
  }

  /** 查询全部任务令 */
  @Get('tasks')
  allTasks(@Query('limit') limit?: string) {
    return this.queries.listAllTasks(limit ? Number(limit) : 200);
  }

  /** 查询最新一条荣誉 */
  @Get('honors/latest')
  latestHonor() {
    return this.queries.latestHonor();
  }

  /** 查询最新一条任务令 */
  @Get('tasks/latest')
  latestTask() {
    return this.queries.latestTask();
  }

  /** 查询今日新增荣誉与任务令（含定义说明） */
  @Get('today')
  today() {
    return this.queries.todaySummary();
  }
}

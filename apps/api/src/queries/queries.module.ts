import { Module } from '@nestjs/common';
import { QueriesController } from './queries.controller';
import { QueriesService } from './queries.service';
import { ServiceTokenGuard } from './service-token.guard';

@Module({
  controllers: [QueriesController],
  providers: [QueriesService, ServiceTokenGuard],
  exports: [QueriesService],
})
export class QueriesModule {}

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TasksController } from './tasks.controller';
import { TasksSupervisorController } from './tasks-supervisor.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [AuthModule],
  controllers: [TasksController, TasksSupervisorController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}

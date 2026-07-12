import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { TasksController } from './tasks.controller';
import { TaskStatusController } from './task-status.controller';
import { TasksSupervisorController } from './tasks-supervisor.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [TasksController, TasksSupervisorController, TaskStatusController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}

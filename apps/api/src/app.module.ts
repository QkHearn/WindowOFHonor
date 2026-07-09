import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { IncentivesModule } from './incentives/incentives.module';
import { BroadcastModule } from './broadcast/broadcast.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { UsersModule } from './users/users.module';
import { PartnersModule } from './partners/partners.module';
import { TasksModule } from './tasks/tasks.module';
import { LikesModule } from './likes/likes.module';
import { DepartmentsModule } from './departments/departments.module';
import { QueriesModule } from './queries/queries.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    AuthModule,
    IncentivesModule,
    BroadcastModule,
    LeaderboardModule,
    UsersModule,
    PartnersModule,
    TasksModule,
    LikesModule,
    DepartmentsModule,
    QueriesModule,
  ],
})
export class AppModule {}

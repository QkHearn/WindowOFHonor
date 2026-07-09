import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export const QUERY_DEFINITIONS = {
  honor: '荣誉（激励记录）：主管向员工发放的表彰，含标题、说明、荣誉分值、接收人与呈递时间，会计入排行榜与荣誉展播。',
  taskOrder:
    '任务令：主管分配给员工的任务或挑战，含标题、说明、接收人、截止时间与执行状态（待开始/进行中/已完成/已过期）。',
} as const;

function todayRangeShanghai() {
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  return {
    date,
    start: new Date(`${date}T00:00:00+08:00`),
    end: new Date(`${date}T23:59:59.999+08:00`),
  };
}

@Injectable()
export class QueriesService {
  constructor(private readonly prisma: PrismaService) {}

  private honorInclude() {
    return {
      recipients: { include: { user: { select: { id: true, displayName: true } } } },
      issuedBy: { select: { id: true, displayName: true } },
    } as const;
  }

  private taskInclude() {
    return {
      assignee: { select: { id: true, displayName: true } },
      assignedBy: { select: { id: true, displayName: true } },
    } as const;
  }

  private mapHonor(r: {
    id: string;
    title: string;
    description: string | null;
    honorValue: number;
    issuedAt: Date;
    issuedBy: { id: string; displayName: string };
    recipients: { user: { id: string; displayName: string } }[];
  }) {
    return {
      id: r.id,
      title: r.title,
      description: r.description,
      honorValue: r.honorValue,
      issuedAt: r.issuedAt.toISOString(),
      issuedBy: r.issuedBy.displayName,
      recipients: r.recipients.map((x) => ({
        id: x.user.id,
        displayName: x.user.displayName,
      })),
    };
  }

  private mapTask(t: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    dueAt: Date | null;
    createdAt: Date;
    assignee: { id: string; displayName: string };
    assignedBy: { id: string; displayName: string };
  }) {
    return {
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      dueAt: t.dueAt?.toISOString() ?? null,
      createdAt: t.createdAt.toISOString(),
      assignee: t.assignee,
      assignedBy: t.assignedBy.displayName,
    };
  }

  async listAllHonors(limit = 200) {
    const rows = await this.prisma.incentiveRecord.findMany({
      orderBy: { issuedAt: 'desc' },
      take: Math.min(limit, 500),
      include: this.honorInclude(),
    });
    return {
      total: rows.length,
      definition: QUERY_DEFINITIONS.honor,
      honors: rows.map((r) => this.mapHonor(r)),
    };
  }

  async listAllTasks(limit = 200) {
    const rows = await this.prisma.taskOrder.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 500),
      include: this.taskInclude(),
    });
    return {
      total: rows.length,
      definition: QUERY_DEFINITIONS.taskOrder,
      tasks: rows.map((t) => this.mapTask(t)),
    };
  }

  async latestHonor() {
    const row = await this.prisma.incentiveRecord.findFirst({
      orderBy: { issuedAt: 'desc' },
      include: this.honorInclude(),
    });
    return {
      definition: QUERY_DEFINITIONS.honor,
      honor: row ? this.mapHonor(row) : null,
    };
  }

  async latestTask() {
    const row = await this.prisma.taskOrder.findFirst({
      orderBy: { createdAt: 'desc' },
      include: this.taskInclude(),
    });
    return {
      definition: QUERY_DEFINITIONS.taskOrder,
      task: row ? this.mapTask(row) : null,
    };
  }

  async todaySummary() {
    const { date, start, end } = todayRangeShanghai();

    const [honors, tasks] = await Promise.all([
      this.prisma.incentiveRecord.findMany({
        where: { issuedAt: { gte: start, lte: end } },
        orderBy: { issuedAt: 'desc' },
        include: this.honorInclude(),
      }),
      this.prisma.taskOrder.findMany({
        where: { createdAt: { gte: start, lte: end } },
        orderBy: { createdAt: 'desc' },
        include: this.taskInclude(),
      }),
    ]);

    const mappedHonors = honors.map((r) => this.mapHonor(r));
    const mappedTasks = tasks.map((t) => this.mapTask(t));

    return {
      date,
      timezone: 'Asia/Shanghai',
      definitions: QUERY_DEFINITIONS,
      hasNewHonors: honors.length > 0,
      hasNewTasks: tasks.length > 0,
      honorCount: honors.length,
      taskCount: tasks.length,
      honors: mappedHonors,
      tasks: mappedTasks,
      summary: {
        honors:
          honors.length === 0
            ? `今天（${date}）暂无新增荣誉。`
            : `今天（${date}）新增 ${honors.length} 条荣誉：` +
              mappedHonors
                .map(
                  (h) =>
                    `「${h.title}」→ ${h.recipients.map((r) => r.displayName).join('、')}（+${h.honorValue}）`,
                )
                .join('；'),
        tasks:
          tasks.length === 0
            ? `今天（${date}）暂无新增任务令。`
            : `今天（${date}）新增 ${tasks.length} 条任务令：` +
              mappedTasks
                .map((t) => `「${t.title}」→ ${t.assignee.displayName}（${t.status}）`)
                .join('；'),
      },
    };
  }
}

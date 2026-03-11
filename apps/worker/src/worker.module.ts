import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { PriorityProcessor } from './processors/priority.processor';
import { BulkProcessor } from './processors/bulk.processor';
import { RetryProcessor } from './processors/retry.processor';
import { PrismaService } from './prisma.service';
import { PRIORITY_QUEUE, BULK_QUEUE, RETRY_QUEUE } from '@maildora/queue';

const defaultJobOptions = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 5000 },
  removeOnComplete: 100,
  removeOnFail: 50,
};

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST', 'redis'),
          port: configService.get<number>('REDIS_PORT', 6379),
        },
        defaultJobOptions,
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({ name: PRIORITY_QUEUE }),
    BullModule.registerQueue({ name: BULK_QUEUE }),
    BullModule.registerQueue({ name: RETRY_QUEUE }),
  ],
  providers: [PriorityProcessor, BulkProcessor, RetryProcessor, PrismaService],
})
export class WorkerModule {}

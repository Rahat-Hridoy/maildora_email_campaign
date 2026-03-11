import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { PrismaService } from '../../prisma.service';
import { PRIORITY_QUEUE, BULK_QUEUE, RETRY_QUEUE } from '@maildora/queue';

const defaultJobOptions = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 5000 },
  removeOnComplete: 100,
  removeOnFail: 50,
};

@Module({
  imports: [
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
    BullBoardModule.forRoot({
      route: '/admin/queues',
      adapter: ExpressAdapter,
    }),
    BullModule.registerQueue({ name: PRIORITY_QUEUE }),
    BullModule.registerQueue({ name: BULK_QUEUE }),
    BullModule.registerQueue({ name: RETRY_QUEUE }),
    BullBoardModule.forFeature({ name: PRIORITY_QUEUE, adapter: BullMQAdapter }),
    BullBoardModule.forFeature({ name: BULK_QUEUE, adapter: BullMQAdapter }),
    BullBoardModule.forFeature({ name: RETRY_QUEUE, adapter: BullMQAdapter }),
  ],
  providers: [PrismaService],
  exports: [BullModule],
})
export class QueueModule {}

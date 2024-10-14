import { Module} from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { OrderService } from './order.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envs } from '../config/env';
import { OrderController } from './order.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderToBillingRepository } from './repositories/order-to-billing.repository';
@Module({
  imports: [
    HttpModule,
    ClientsModule.register([
      {
        name: envs.tcp_service,
        transport: Transport.TCP,
        options: {
          host: envs.host,
          port: envs.port,
        },
      },
    ]),
    TypeOrmModule.forFeature([OrderToBillingRepository])
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
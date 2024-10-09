import { Module } from '@nestjs/common';
import { BillingModule } from './billing/billing.module';
import { HttpModule } from '@nestjs/axios';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AppController } from './app.controller';
import { envs } from './config/env';
import config from './config';
import validationSchema from './config/validation';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: config,
      validationSchema: validationSchema,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        configService.get<TypeOrmModuleOptions>('database'),
      inject: [ConfigService],
    }),
    BillingModule,
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
  ],
  controllers: [AppController],
  providers: [],
})

export class AppModule {}

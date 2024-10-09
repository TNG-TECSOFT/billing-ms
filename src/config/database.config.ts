import { registerAs } from '@nestjs/config';
import { envs } from './env';

export default registerAs('database', () => ({
  type: 'postgres',
  entities: [envs.typeorm_entities || 'src/**/*.entity{.ts,.js}'],
  replication: {
    master: {
      host: envs.typeorm_host || 'localhost',
      port: Number(envs.typeorm_port) || 5432,
      username: envs.typeorm_username || 'postgres',
      password: envs.typeorm_password || 'postgres',
      database: envs.typeorm_database || 'urbano-core',
    },
    slaves: [
      {
        host: envs.typeorm_host_ro || 'localhost',
        port: Number(envs.typeorm_port) || 5432,
        username: envs.typeorm_username || 'postgres',
        password: envs.typeorm_password || 'postgres',
        database: envs.typeorm_database || 'urbano-core',
      },
    ],
  },
  autoLoadEntities: true,
  logging: ['error'],
  maxQueryExecutionTime: 3000,
  subscribers: [], // No need for subscribers here
}));

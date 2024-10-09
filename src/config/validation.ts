import * as Joi from 'joi';

export default Joi.object({
  NODE_ENV: Joi.string()
    .valid(
      'local',
      'development',
      'production',
      'staging',
      'performance',
      'preprod',
    )
    .default('development'),
  PORT: Joi.number().default(3000),
  TYPEORM_HOST: Joi.string().default('localhost'),
  TYPEORM_PORT: Joi.number().default(5432),
  TYPEORM_USERNAME: Joi.string().default('postgres'),
  TYPEORM_PASSWORD: Joi.string().default('postgres'),
  TYPEORM_DATABASE: Joi.string().default('urbano-core'),
});

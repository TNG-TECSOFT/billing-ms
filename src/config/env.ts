import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
  PORT: number,
  HOST: string,
  TCP_SERVICE: string;
  TYPEORM_ENTITIES: string;
  TYPEORM_HOST: string;
  TYPEORM_PORT: number;
  TYPEORM_USERNAME: string;
  TYPEORM_PASSWORD: string;
  TYPEORM_DATABASE: string;
  TYPEORM_HOST_RO: string;
  SECRET_KEY: string;
}

const envsSchema = joi.object({
  PORT: joi.number().required(),
  HOST: joi.string().required(),
  TCP_SERVICE: joi.string().required(),
  TYPEORM_ENTITIES: joi.string().required(),
  TYPEORM_HOST: joi.string().required(),
  TYPEORM_PORT: joi.number().required(),
  TYPEORM_USERNAME: joi.string().required(),
  TYPEORM_PASSWORD: joi.string().required(),
  TYPEORM_DATABASE: joi.string().required(),
  TYPEORM_HOST_RO: joi.string().required(),
  SECRET_KEY: joi.string().required(),
})
.unknown(true);

const { error, value } = envsSchema.validate({ 
  ...process.env
});


if ( error ) {
  throw new Error(`Config validation error: ${ error.message }`);
}

const envVars:EnvVars = value;


export const envs = {
  port: envVars.PORT,
  host: envVars.HOST,
  tcp_service: envVars.TCP_SERVICE,
  typeorm_entities: envVars.TYPEORM_ENTITIES,
  typeorm_host: envVars.TYPEORM_HOST,
  typeorm_port: envVars.TYPEORM_PORT,
  typeorm_username: envVars.TYPEORM_USERNAME,
  typeorm_password: envVars.TYPEORM_PASSWORD,
  typeorm_database: envVars.TYPEORM_DATABASE,
  typeorm_host_ro: envVars.TYPEORM_HOST_RO,
  secret_key: envVars.SECRET_KEY,
};
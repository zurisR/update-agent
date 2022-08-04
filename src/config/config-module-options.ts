import * as Joi from '@hapi/joi';
import { ConfigModuleOptions } from '@nestjs/config/dist/interfaces';
import gitConfig from './configs/git.config';

export const configModuleOptions: ConfigModuleOptions = {
  validationSchema: Joi.object({
    GIT_REPOSITORY: Joi.string().default('test-app'),
    GIT_REPOSITORY_OWNER: Joi.string().default('zurisR'),
    GIT_BRANCH: Joi.string().default('master'),
    GIT_ACCESS_TOKEN: Joi.string().default(null)
  }),
  isGlobal: true,
  load: [
    gitConfig
  ]
}
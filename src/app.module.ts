import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Pm2Module } from './pm2/pm2.module';
import { GitModule } from './git/git.module';
import { ConfigModule } from '@nestjs/config/dist/config.module';
import { configModuleOptions } from "./config/config-module-options";
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AgentModule } from './agent/agent.module';

@Module({
  imports: [
    ConfigModule.forRoot(configModuleOptions),
    Pm2Module,
    GitModule,
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    AgentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { AgentService } from './agent.service';
import { GitModule } from "../git/git.module";
import { Pm2Module } from "../pm2/pm2.module";

@Module({
  imports: [
    GitModule,
    Pm2Module
  ],
  providers: [AgentService]
})
export class AgentModule {}

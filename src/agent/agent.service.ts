import { Injectable } from '@nestjs/common';
import { GitService } from "../git/git.service";
import { join } from "path";
import * as fs from "fs";
import * as cp from "child_process";
const { promises: { readdir } } = require('fs');
import * as targz from 'targz';
import { CronExpression } from '@nestjs/schedule';
import { Cron } from '@nestjs/schedule';
import { Pm2Service } from "../pm2/pm2.service";

@Injectable()
export class AgentService {
  private readonly BUILDS_PATH = join(__dirname, '..', '..', '..', 'builds');
  private readonly APPS_PATH = join(__dirname, '..', '..', '..', 'apps');
  private currentCommitSha: string;
  private currentAppBuildPath: string;
  private readyForProcessing = false;

  constructor(
    private readonly gitService: GitService,
    private readonly pm2Service: Pm2Service
  ) {}

  async onApplicationBootstrap() {
    await this.clearAppBuildsDir();
    this.readyForProcessing = true;
  }

  async onModuleDestroy() {
    if (this.currentCommitSha && this.currentAppBuildPath) {
      await this.pm2Service.deleteApp(this.currentCommitSha);
    }
  }

  private async getLatestBuildAppDir(source): Promise<string> {
    const dirsNames = (await readdir(source, { withFileTypes: true }))
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    return dirsNames.length ? dirsNames[0] : '';
  }

  private async prepareNewBuild() {
    console.log('Downloading new build...');
    const buildData = await this.gitService.downloadLatestBuild();
    if (!buildData) {
      console.log('Unable to download the latest build from Git repository');
      return;
    }
    // @ts-ignore
    const buffer = Buffer.from(buildData);
    const filepath = `${this.BUILDS_PATH}/${this.currentCommitSha}.tar.gz`;

    await new Promise((resolve, reject) => {
      fs.createWriteStream(filepath).write(buffer, err => {
        if (err) {
          reject(err);
        }

        return resolve(true);
      });
    });

    await new Promise((resolve, reject) => {
      targz.decompress({
        src: filepath,
        dest: `${this.APPS_PATH}/${this.currentCommitSha}`
      }, function(err){
        if(err) {
          reject(err);
        }

        return resolve(true);
      });
    });

    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const buildAppDir = await this.getLatestBuildAppDir(`${this.APPS_PATH}/${this.currentCommitSha}`);
    if (!buildAppDir) {
      return;
    }
    this.currentAppBuildPath = `${this.APPS_PATH}/${this.currentCommitSha}/${buildAppDir}`;
    console.log('Installing dependencies...');
    cp.spawnSync(npm, ['install'], {
      cwd: this.currentAppBuildPath
    });
    console.log('Building...');
    cp.spawnSync(npm, ['run', 'build'], {
      cwd: this.currentAppBuildPath
    }); //нужен для сборки nest js приложения перед стартом - заменить на нужный
    // для воркера или убрать

    fs.unlink(filepath, _ => console.log);

    console.log(`Build for commit ${this.currentCommitSha} is ready to start!`);
  }

  private clearOldAppBuildPath(path: string) {
    fs.rm(path, {
      recursive: true,
      force: true
    },err => {});
  }

  private async clearAppBuildsDir() {
    const dirsNames = (await readdir(this.APPS_PATH, { withFileTypes: true }))
      .filter(dirent => dirent.isDirectory());

    return Promise.all(dirsNames.map(async dir => {
      return new Promise(resolve => {
        fs.rm(`${this.APPS_PATH}/${dir.name}`, {
          recursive: true,
          force: true
        }, err => {
          if (err) {
            return resolve(false);
          }
          return resolve(true);
        })
      });
    }));
  }

  @Cron(CronExpression.EVERY_MINUTE)
  private async processing() {
    if (!this.readyForProcessing) {
      return;
    }
    const lastCommit = await this.gitService.getLastCommit();
    if (!lastCommit) {
      console.log('Unable to fetch info about the latest commit of repository.');
      return;
    }

    if (lastCommit.sha === this.currentCommitSha) {
      return;
    }
    console.log('New build found!');
    const prevCommitSha = this.currentCommitSha;
    const prevAppBuildPath = this.currentAppBuildPath;

    this.currentCommitSha = lastCommit.sha;
    this.currentAppBuildPath = null;
    await this.prepareNewBuild();
    if (this.currentAppBuildPath) {
      if (prevCommitSha) {
        const res = await this.pm2Service.deleteApp(prevCommitSha);
        if (!res) {
          console.log('Unable to stop and delete current version of app.');
          return;
        }
      }
      const appStarted = await this.pm2Service.startNewApp({
        appName: this.currentCommitSha,
        appNamePath: this.currentAppBuildPath,
        script: 'npm run start:prod'
      });
      if (appStarted) {
        console.log('New build started!');
        if (prevCommitSha) {
          this.clearOldAppBuildPath(`${this.APPS_PATH}/${prevCommitSha}`);
        }
        return;
      }

      //если при попытке стартануть новый билд что-то пошло не так,
      // то пытаемся запустить предыдущий билд
      if (prevCommitSha && prevAppBuildPath) {
        this.clearOldAppBuildPath(`${this.APPS_PATH}/${this.currentCommitSha}`);
        this.currentCommitSha = prevCommitSha;
        this.currentAppBuildPath = prevAppBuildPath;
        await this.pm2Service.startNewApp({
          appName: prevCommitSha,
          appNamePath: prevAppBuildPath,
          script: 'npm run start:prod'
        });
      }
    }
  }
}

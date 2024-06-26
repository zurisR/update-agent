import { Injectable } from '@nestjs/common';
import * as pm2 from 'pm2';
import { IPm2StartNewAppOptions } from "./interfaces/pm2-start-new-app-options.interface";

@Injectable()
export class Pm2Service {
  async deleteApp(appName: string) {
    return new Promise((resolve) => {
      pm2.connect(async err => {
        if (err) {
          console.log(err);
          return resolve(false);
        }

        pm2.delete(appName, err => {
          if (err) {
            console.log(err);
            return resolve(false);
          }
          return resolve(true);
        });
      });
    });
  }

  async startNewApp(options: IPm2StartNewAppOptions) {
    return new Promise((resolve) => {
      pm2.connect(async err => {
        if (err) {
          console.log(err);
          return resolve(false);
        }

        pm2.start({
          name: options.appName,
          cwd: options.appNamePath,
          script: options.script,
          node_args: '-r dotenv/config'
        }, err => {
          if (err) {
            console.log(err);
            return resolve(false);
          }
          return resolve(true);
        });
      })
    });
  }
}

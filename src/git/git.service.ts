import { Injectable } from '@nestjs/common';
import { Octokit } from '@octokit/core';
import { ConfigService } from "@nestjs/config";
import { IGitConfig } from "../config/interfaces/git-config.interface";

@Injectable()
export class GitService {
  private octokit: Octokit;
  private gitConfig: IGitConfig;

  constructor(
    private readonly configService: ConfigService
  ) {
    this.gitConfig = configService.get<IGitConfig>('git');
    this.octokit = new Octokit();
  }

  async getLastCommit() {
    try {
      const res = await this.octokit.request('GET /repos/{owner}/{repo}/commits/{ref}', {
        owner: this.gitConfig.repositoryOwner,
        repo: this.gitConfig.repository,
        ref: this.gitConfig.branch
      });
      return res.data;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async downloadLatestBuild() {
    try {
      const res = await this.octokit.request('GET /repos/{owner}/{repo}/tarball/{ref}', {
        owner: this.gitConfig.repositoryOwner,
        repo: this.gitConfig.repository,
        ref: this.gitConfig.branch
      });

      return res.data;
    } catch (err) {
      console.error(err);
      return null;
    }
  }
}

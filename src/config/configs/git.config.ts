export default () => ({
  git: {
    repository: process.env.GIT_REPOSITORY,
    repositoryOwner: process.env.GIT_REPOSITORY_OWNER,
    branch: process.env.GIT_BRANCH,
    accessToken: process.env.GIT_ACCESS_TOKEN
  }
});
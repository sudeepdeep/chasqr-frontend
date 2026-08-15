import api from './axios';

export interface GithubRepoSummary {
  installationId: number;
  id: number;
  name: string;
  fullName: string;
  owner: string;
  private: boolean;
  defaultBranch: string;
  updatedAt: string;
}

export const githubStatusAPI = () =>
  api.get('/api/github/status');

export const githubReposAPI = () =>
  api.get('/api/github/repos');

export const githubBranchesAPI = (installationId: number, owner: string, repo: string) =>
  api.get('/api/github/branches', { params: { installationId, owner, repo } });

export const githubDetectAPI = (installationId: number, owner: string, repo: string, ref: string) =>
  api.get('/api/github/detect', { params: { installationId, owner, repo, ref } });

export const githubUnlinkAPI = (installationId: number) =>
  api.delete(`/api/github/installations/${installationId}`);

export const importGithubSiteAPI = (data: {
  installationId: number;
  owner: string;
  repo: string;
  branch: string;
  dir: string;
  name: string;
  slug?: string;
  keepInteractive: boolean;
  autoDeploy: boolean;
}) => api.post('/api/sites/import-github', data);

export const redeployFromGitAPI = (siteId: string) =>
  api.post(`/api/sites/${siteId}/redeploy-git`);

export const updateGitSettingsAPI = (
  siteId: string,
  data: { autoDeploy?: boolean; branch?: string; dir?: string; disconnect?: boolean },
) => api.put(`/api/sites/${siteId}/git`, data);

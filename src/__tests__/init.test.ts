import { init, initContextEnv, getPushDescription } from '../init';
import { GITHUB_PUSH_DESCRIPTION_MOCK, GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_PREFIX, GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME } from './__mocks__/github-entities.mock';
import {getInput} from '@actions/core';

jest.mock('@actions/core');
jest.mock('@actions/github', () => ({
  context: require('./__mocks__/github-entities.mock').GITHUB_CONTEXT_MOCK,
  getOctokit: jest.fn(() => 'octokit'),
}))
jest.mock('../merge-to-release', () => ({
  getBranchNameReleaseSerialNumber: jest.fn(jest.requireActual('../merge-to-release').getBranchNameReleaseSerialNumber)
}));

describe('init module', () => {
  beforeEach(() => {
    (getInput as any).mockImplementation((k: string) => {
      if (k === 'releaseBranchPrfix') {
        return GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_PREFIX;
      }
      if (k === 'releaseBranchTaskPrefix') {
        return GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME;
      }
      return k;
    });
  });

  it('check getInput', () => {
    expect(getInput('releaseBranchPrfix')).toEqual(GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_PREFIX);
    expect(getInput('releaseBranchTaskPrefix')).toEqual(GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME);
    expect(getInput('any_value')).toEqual('any_value');
    expect(getInput('remoteName')).toEqual('remoteName');
    expect(getInput('token')).toEqual('token');
    expect(getInput('mainBranchName')).toEqual('mainBranchName');
    expect(getInput('branchFetchingStrategy')).toEqual('branchFetchingStrategy');
    expect(getInput('automergePrLabel')).toEqual('automergePrLabel');
  })

  describe('initContextEnv', () => {
    it('Should return all values described in IContextEnv', () => {
      expect(initContextEnv()).toEqual({
        token: 'token',
        releaseBranchTaskPrefix: GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME,
        mainBranchName: 'mainBranchName',
        branchFetchingStrategy: 'branchFetchingStrategy',
        releaseBranchPrfix: GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_PREFIX,
        remoteName: 'remoteName',
        automergePrLabel: 'automergePrLabel'
      })
    })
  })

  describe('getPushDescription', () => {
    const contextPushEventMock = {
      payload: {
        ref: 'context.ref',
        repository: {
          full_name: 'context.payload.repository.full_name',
          owner: {
            login: 'context.payload.repository.owner.login',
          }
        }
      }
    } as any;
    it('Should reutrn instance of pull request if the wokflow triggered by a pull request merged', () => {
      const pullRequestSourceBranchRef = 'source_ref'
      const pullRequestDescription = {
        ...GITHUB_PUSH_DESCRIPTION_MOCK,
        head: {
          ...GITHUB_PUSH_DESCRIPTION_MOCK.head,
          ref: pullRequestSourceBranchRef
        }
      };
      const contextpushDescriptionEventMock = {
        ...contextPushEventMock,
        payload: {
          ...contextPushEventMock.payload,
          pull_request: pullRequestDescription
        }
      } as any;
      expect(getPushDescription(contextpushDescriptionEventMock)).toBe(pullRequestDescription);
    })
    it('Should reutrn values according to the push event payload', () => {
      expect(getPushDescription(contextPushEventMock)).toEqual({
        base: {
          ref: contextPushEventMock.payload.ref,
          repo: {
            name: contextPushEventMock.payload.repository.full_name,
            owner: {
              login: contextPushEventMock.payload.repository!.owner.login,
            },
          },
        },
        head: {
          ref: contextPushEventMock.payload.ref,
        },
      });
    })
    it('Should throw if no context', () => {
      expect(() => getPushDescription({} as any)).toThrow();
    })
  })

  describe('init', () => {
    it('init should not throw', () => {
      expect(() => init()).not.toThrow();
    })
    it('init should return nothing if the branch not prefixed with values from inputs config', () => {
      (getInput as any).mockImplementation((k:string) => k);
      expect(getInput('releaseBranchPrfix')).toEqual('releaseBranchPrfix');
      expect(getInput('releaseBranchTaskPrefix')).toEqual('releaseBranchTaskPrefix');
      expect(init()).toEqual(undefined);
    })
    it('init should return values expected', () => {
      expect(init()).toEqual(expect.objectContaining({
        pushDescription: expect.objectContaining(GITHUB_PUSH_DESCRIPTION_MOCK),
        octokit: 'octokit',
        contextEnv: expect.objectContaining({}),
      }));
    })
    it('init should return undefined if a pull request is not related to the workflow', () => {
      const {getBranchNameReleaseSerialNumber} = require('../merge-to-release');
      getBranchNameReleaseSerialNumber.mockReturnValue(undefined);
      expect(init()).toEqual(undefined);
    })
  })
})

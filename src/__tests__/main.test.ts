import { TGitHubPullRequest, TGitHubOctokit } from '../types/github';
import { BRANCHES_REFS_LIST_MOCK, GITHUB_PULL_REQUEST_MOCK, GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME, GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_PREFIX } from './__mocks__/github-entities.mock';
import { IContextEnv } from '../types/context';
import {run} from '../workflow';

jest.mock('../workflow', () => ({
    run: jest.fn(jest.requireActual('../workflow').run)
}))
jest.mock('../init')
jest.mock('../lib/repo-api')
jest.mock('../merge-to-release')

describe('main', () => {
    let octokit: TGitHubOctokit;
    let pullRequest: TGitHubPullRequest;
    let contextEnv: IContextEnv;
    let branchesRelatedList: string[];

    beforeEach(() => {
      const {init} = require('../init');
      octokit = {
        git: {
          listMatchingRefs: jest.fn(() => ({...BRANCHES_REFS_LIST_MOCK}))
        },
        repos: {
          merge: jest.fn(() => ({ status: 201 }))
        },
        pulls: {
          list: jest.fn(() => ({ status: 200, data: [] })),
          create: jest.fn(() => ({ status: 201, data: { number: 11 } }))
        },
        issues: {
          addLabels: jest.fn(() => ({ status: 200 }))
        }
      } as unknown as TGitHubOctokit
      pullRequest = {...GITHUB_PULL_REQUEST_MOCK} as unknown as TGitHubPullRequest
      contextEnv = {
        token: 'token',
        releaseBranchTaskPrefix: GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME,
        mainBranchName: 'mainBranchName',
        branchFetchingStrategy: 'branchFetchingStrategy',
        releaseBranchPrfix: GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_PREFIX,
        remoteName: 'remoteName',
        automergePrLabel: 'automergePrLabel'
      }
      branchesRelatedList = [
        `${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_PREFIX}/${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_PREFIX}9999`,
        `${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_PREFIX}/${GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_PREFIX}99999`, 
      ]
      init.mockReturnValue({
            pullRequest,
            octokit,
            contextEnv,
        });
    })

    afterEach(() => {
        jest.clearAllMocks();
    })

    it('should call set workflow failed with error message if throw during the execution', async () => {
        const {init} = require('../init')

        init.mockImplementation(() => {
            throw new Error(errorMessageExpected)
        })
        expect(() => init()).toThrow();
        expect(run).toBeCalledTimes(0);

        const setFailedSpy = jest.spyOn(require('@actions/core'), 'setFailed');
        const errorMessageExpected = 'errorMessageExpected';

        await expect(run()).resolves.toBe(undefined);
        expect(setFailedSpy).toBeCalledWith(errorMessageExpected);
    })
    it('should stop execution if a PR handled by the workflow is not related', async () => {
        const {init} = require('../init')

        init.mockReturnValue(undefined);

        const {fetchReleaseBranchesNamesByAPI} = require('../lib/repo-api')        
        const setFailedSpy = jest.spyOn(require('@actions/core'), 'setFailed');

        expect(run).toBeCalledTimes(0);
        await expect(run()).resolves.toBe(undefined);
        expect(setFailedSpy).not.toBeCalled();
        expect(init).toBeCalledTimes(1);
        expect(fetchReleaseBranchesNamesByAPI).toBeCalledTimes(0);
    })
    it('should set workflow failed if the branches related list is empty', async () => {
        const {fetchReleaseBranchesNamesByAPI} = require('../lib/repo-api')
        
        fetchReleaseBranchesNamesByAPI.mockReturnValue([])
        expect(fetchReleaseBranchesNamesByAPI).not.toBeCalled();

        const setFailedSpy = jest.spyOn(require('@actions/core'), 'setFailed');
        
        expect(setFailedSpy).not.toBeCalled();        
        expect(run).not.toBeCalled();
        await run();
        expect(run).toBeCalledTimes(1);
        expect(fetchReleaseBranchesNamesByAPI).toBeCalledTimes(1);
        expect(setFailedSpy).toBeCalledWith('No branches were found');
    })
    it('should merge PR branch to the main branch provided', async () => {
        const {mergeSourceToBranch} = require('../merge-to-release')
        mergeSourceToBranch.mockReturnValue(undefined)
        expect(mergeSourceToBranch).not.toBeCalled();

        const {fetchReleaseBranchesNamesByAPI} = require('../lib/repo-api')
        
        fetchReleaseBranchesNamesByAPI.mockReturnValue(branchesRelatedList);
        expect(fetchReleaseBranchesNamesByAPI).not.toBeCalled();

        await run();
        expect(fetchReleaseBranchesNamesByAPI).toBeCalledTimes(1);
        expect(fetchReleaseBranchesNamesByAPI).toBeCalledWith(
            octokit,
            pullRequest,
            contextEnv
        );
        expect(mergeSourceToBranch).toBeCalledTimes(1);
        expect(mergeSourceToBranch).toBeCalledWith(
            octokit,
            pullRequest,
            contextEnv,
            contextEnv.mainBranchName,
        );
    })
    it('should catches right after rejected on merging PR source branch to the main branch', async () => {
        const expectedErrorMessage = 'expectedErrorMessage';
        const {mergeSourceToBranch, mergeToRelated} = require('../merge-to-release')

        expect(mergeToRelated).not.toBeCalled();
        mergeSourceToBranch.mockImplementation(() => {
            throw new Error(expectedErrorMessage);
        })
        expect(mergeSourceToBranch).not.toBeCalled();
        expect(() => mergeSourceToBranch()).toThrow();
        expect(mergeSourceToBranch).toBeCalledTimes(1);

        const {fetchReleaseBranchesNamesByAPI} = require('../lib/repo-api')
        
        fetchReleaseBranchesNamesByAPI.mockReturnValue(branchesRelatedList);
        expect(fetchReleaseBranchesNamesByAPI).not.toBeCalled();

        const setFailedSpy = jest.spyOn(require('@actions/core'), 'setFailed');
        
        expect(setFailedSpy).not.toBeCalled();
        await expect(run()).resolves.toBe(undefined);
        expect(fetchReleaseBranchesNamesByAPI).toBeCalledTimes(1);
        expect(fetchReleaseBranchesNamesByAPI).toBeCalledWith(
            octokit,
            pullRequest,
            contextEnv
        );
        expect(mergeSourceToBranch).toBeCalledTimes(2);
        expect(mergeSourceToBranch).toHaveBeenLastCalledWith(
            octokit,
            pullRequest,
            contextEnv,
            contextEnv.mainBranchName,
        );
        expect(setFailedSpy).toBeCalledWith(expectedErrorMessage);
        expect(mergeToRelated).not.toBeCalled();
    })
    it('should merge to related branches after merged to the main branch', async () => {
        const {mergeSourceToBranch, mergeToRelated} = require('../merge-to-release')

        mergeToRelated.mockReturnValue(undefined);
        expect(mergeToRelated).not.toBeCalled();
        mergeSourceToBranch.mockReturnValue(undefined);
        expect(mergeSourceToBranch).not.toBeCalled();

        const {fetchReleaseBranchesNamesByAPI} = require('../lib/repo-api')
        
        fetchReleaseBranchesNamesByAPI.mockReturnValue(branchesRelatedList);
        expect(fetchReleaseBranchesNamesByAPI).not.toBeCalled();

        const setFailedSpy = jest.spyOn(require('@actions/core'), 'setFailed');
        
        expect(setFailedSpy).not.toBeCalled();
        await expect(run()).resolves.toBe(undefined);
        expect(fetchReleaseBranchesNamesByAPI).toBeCalledTimes(1);
        expect(fetchReleaseBranchesNamesByAPI).toBeCalledWith(
            octokit,
            pullRequest,
            contextEnv
        );
        expect(mergeSourceToBranch).toBeCalledTimes(1);
        expect(mergeSourceToBranch).toHaveBeenLastCalledWith(
            octokit,
            pullRequest,
            contextEnv,
            contextEnv.mainBranchName,
        );
        expect(mergeToRelated).toBeCalledWith(
            octokit,
            pullRequest,
            contextEnv,
            branchesRelatedList
        );
        expect(setFailedSpy).not.toBeCalled();
    })
    it('should catch if failed while merging to related branches', async () => {
        const expectedErrorMessage = 'expectedErrorMessage';
        const {mergeSourceToBranch, mergeToRelated} = require('../merge-to-release')

        mergeToRelated.mockImplementation(() => {
            throw new Error(expectedErrorMessage)
        });
        expect(mergeToRelated).not.toBeCalled();
        mergeSourceToBranch.mockReturnValue(undefined);
        expect(mergeSourceToBranch).not.toBeCalled();

        const {fetchReleaseBranchesNamesByAPI} = require('../lib/repo-api')
        
        fetchReleaseBranchesNamesByAPI.mockReturnValue(branchesRelatedList);
        expect(fetchReleaseBranchesNamesByAPI).not.toBeCalled();

        const setFailedSpy = jest.spyOn(require('@actions/core'), 'setFailed');
        
        expect(setFailedSpy).not.toBeCalled();
        await expect(run()).resolves.toBe(undefined);
        expect(fetchReleaseBranchesNamesByAPI).toBeCalledWith(
            octokit,
            pullRequest,
            contextEnv
        );
        expect(mergeSourceToBranch).toBeCalledTimes(1);
        expect(mergeSourceToBranch).toHaveBeenLastCalledWith(
            octokit,
            pullRequest,
            contextEnv,
            contextEnv.mainBranchName,
        );
        expect(mergeToRelated).toBeCalledWith(
            octokit,
            pullRequest,
            contextEnv,
            branchesRelatedList
        );
        expect(setFailedSpy).toBeCalledWith(expectedErrorMessage);
    })
})

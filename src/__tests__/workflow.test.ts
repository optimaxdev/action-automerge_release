import { IGitHubPushDescription, TGitHubOctokit } from '../types/github';
import { BRANCHES_REFS_LIST_MOCK, GITHUB_PUSH_DESCRIPTION_MOCK, GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_NAME, GITHUB_BRANCH_REF_DESCRIPTION_MOCK_BRANCH_PREFIX } from './__mocks__/github-entities.mock';
import { IContextEnv } from '../types/context';
import {run} from '../workflow';

jest.mock('../workflow', () => ({
    run: jest.fn(jest.requireActual('../workflow').run)
}))
jest.mock('../init')
jest.mock('../lib/repo-api')
jest.mock('../merge-to-release')

describe('workflow', () => {
    let octokit: TGitHubOctokit;
    let pushDescription: IGitHubPushDescription;
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
      pushDescription = {...GITHUB_PUSH_DESCRIPTION_MOCK} as unknown as IGitHubPushDescription
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
            pushDescription,
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
    it('should merge PR branch to the main branch provided if no related branches', async () => {
        const {mergeSourceToBranch, getBranchesRelatedToPD, getTargetBranchesNames} = require('../merge-to-release')
        getBranchesRelatedToPD.mockReturnValue([]);
        getTargetBranchesNames.mockReturnValue([]);
        mergeSourceToBranch.mockReturnValue(undefined)
        expect(mergeSourceToBranch).not.toBeCalled();

        const {fetchReleaseBranchesNamesByAPI} = require('../lib/repo-api')
        
        fetchReleaseBranchesNamesByAPI.mockReturnValue(branchesRelatedList);
        expect(fetchReleaseBranchesNamesByAPI).not.toBeCalled();

        await run();
        expect(fetchReleaseBranchesNamesByAPI).toBeCalledTimes(1);
        expect(fetchReleaseBranchesNamesByAPI).toBeCalledWith(
            octokit,
            pushDescription,
            contextEnv
        );
        expect(getBranchesRelatedToPD).toBeCalledTimes(1);
        expect(getBranchesRelatedToPD).toBeCalledWith(
            pushDescription,
            contextEnv,
            branchesRelatedList
        );
        expect(getTargetBranchesNames).toBeCalledTimes(1);
        expect(getTargetBranchesNames).toBeCalledWith([]);
        expect(mergeSourceToBranch).toBeCalledTimes(1);
        expect(mergeSourceToBranch).toBeCalledWith(
            octokit,
            pushDescription,
            contextEnv,
            contextEnv.mainBranchName,
        );
    })
    it('should catches right after rejected on merging PR source branch to the main branch', async () => {
        const expectedErrorMessage = 'expectedErrorMessage';
        const {mergeSourceToBranch, mergeToBranches, getBranchesRelatedToPD, getTargetBranchesNames} = require('../merge-to-release')
        getBranchesRelatedToPD.mockReturnValue([]);
        getTargetBranchesNames.mockReturnValue([]);
        expect(mergeToBranches).not.toBeCalled();
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
            pushDescription,
            contextEnv
        );
        expect(getBranchesRelatedToPD).toBeCalledTimes(1);
        expect(getBranchesRelatedToPD).toBeCalledWith(
            pushDescription,
            contextEnv,
            branchesRelatedList
        );
        expect(getTargetBranchesNames).toBeCalledTimes(1);
        expect(getTargetBranchesNames).toBeCalledWith([]);
        expect(mergeSourceToBranch).toBeCalledTimes(2);
        expect(mergeSourceToBranch).toHaveBeenLastCalledWith(
            octokit,
            pushDescription,
            contextEnv,
            contextEnv.mainBranchName,
        );
        expect(setFailedSpy).toBeCalledWith(expectedErrorMessage);
        expect(mergeToBranches).not.toBeCalled();
    })
    // TODO
    it('should merge to related branches before be merged to the main branch', async () => {
        const {mergeSourceToBranch, mergeToBranches, getBranchesRelatedToPD, getTargetBranchesNames} = require('../merge-to-release')
        const targetBranches = [branchesRelatedList[0]];

        getBranchesRelatedToPD.mockReturnValue(branchesRelatedList);
        getTargetBranchesNames.mockReturnValue(targetBranches);
        mergeToBranches.mockReturnValue(undefined);
        expect(mergeToBranches).not.toBeCalled();
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
            pushDescription,
            contextEnv
        );
        expect(mergeSourceToBranch).not.toHaveBeenLastCalledWith(
            expect.anything(),
            expect.anything(),
            expect.anything(),
            contextEnv.mainBranchName,
        );
        expect(mergeToBranches).toBeCalledWith(
            octokit,
            pushDescription,
            contextEnv,
            targetBranches
        );
        expect(setFailedSpy).not.toBeCalled();
    })
    it('should catch if failed while merging to related branches', async () => {
        const expectedErrorMessage = 'expectedErrorMessage';
        const {mergeSourceToBranch, mergeToBranches, getBranchesRelatedToPD, getTargetBranchesNames} = require('../merge-to-release')
        const targetBranches = [branchesRelatedList[0]];

        mergeToBranches.mockImplementation(() => {
            throw new Error(expectedErrorMessage)
        });
        expect(mergeToBranches).not.toBeCalled();
        getBranchesRelatedToPD.mockReturnValue(branchesRelatedList);
        getTargetBranchesNames.mockReturnValue(targetBranches);
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
            pushDescription,
            contextEnv
        );
        expect(mergeSourceToBranch).not.toHaveBeenLastCalledWith(
            expect.anything(),
            expect.anything(),
            expect.anything(),
            contextEnv.mainBranchName,
        );
        expect(mergeToBranches).toBeCalledWith(
            octokit,
            pushDescription,
            contextEnv,
            targetBranches
        );
        expect(setFailedSpy).toBeCalledWith(expectedErrorMessage);
    })
    it('should catch if failed while merging to the main branch', async () => {
        const expectedErrorMessage = 'expectedErrorMessage';
        const {mergeSourceToBranch, mergeToBranches, getBranchesRelatedToPD, getTargetBranchesNames} = require('../merge-to-release')
        
        mergeSourceToBranch.mockImplementation(() => {
            throw new Error(expectedErrorMessage)
        });
        expect(mergeSourceToBranch).not.toBeCalled();
        getBranchesRelatedToPD.mockReturnValue([]);
        getTargetBranchesNames.mockReturnValue([]);
        expect(mergeToBranches).not.toBeCalled();

        const {fetchReleaseBranchesNamesByAPI} = require('../lib/repo-api')
        
        fetchReleaseBranchesNamesByAPI.mockReturnValue(branchesRelatedList);
        expect(fetchReleaseBranchesNamesByAPI).not.toBeCalled();

        const setFailedSpy = jest.spyOn(require('@actions/core'), 'setFailed');
        
        expect(setFailedSpy).not.toBeCalled();
        await expect(run()).resolves.toBe(undefined);
        expect(fetchReleaseBranchesNamesByAPI).toBeCalledTimes(1);
        expect(fetchReleaseBranchesNamesByAPI).toBeCalledWith(
            octokit,
            pushDescription,
            contextEnv
        );
        expect(mergeSourceToBranch).toHaveBeenLastCalledWith(
            expect.anything(),
            expect.anything(),
            expect.anything(),
            contextEnv.mainBranchName,
        );
        expect(mergeToBranches).not.toBeCalled();
        expect(setFailedSpy).toBeCalledWith(expectedErrorMessage);
    })
})

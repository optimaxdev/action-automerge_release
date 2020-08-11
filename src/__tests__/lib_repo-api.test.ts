import {
  checkActivePRExists,
  createNewPR,
  fetchBranchesList,
  fetchReleaseBranchesNamesByAPI,
  mergeBranchTo,
  addLabelForPr, 
  createBranch,
  fetchBranchesListGraphQL, fetchRelatedBranchesListGraphQL
} from '../lib/repo-api'
import {
  GITHUB_PUSH_DESCRIPTION_MOCK,
  BRANCHES_REFS_LIST_MOCK,
} from './__mocks__/github-entities.mock'

jest.mock('../lib/github-common', () => ({
  getBranchNameByRefDescription: jest.fn(() => 'getBranchNameByRefDescription'),
  getBranchRefPrefix: jest.fn(() => 'getBranchRefPrefix'),
  getPRRepo: jest.fn(() => 'getPRRepo'),
  getPRRepoOwner: jest.fn(() => 'getPRRepoOwner'),
  getBranchRef: jest.fn(() => 'getBranchRef'),
  getBranchHeadsRefPrefix: jest.fn(() => 'getBranchHeadsRefPref'),
}))

describe('lib repo-api', () => {
  let octokit: any
  let pushDescription: any
  let contextEnv: any

  beforeEach(() => {
    octokit = {
      graphql: jest.fn(() => Promise.resolve('octokit.graphql')),
      git: {
        listMatchingRefs: jest.fn(() => ({...BRANCHES_REFS_LIST_MOCK})),
        createRef: jest.fn(() => ({ status: 201 })), 
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
    }
    pushDescription = {...GITHUB_PUSH_DESCRIPTION_MOCK}
    contextEnv = {
      releaseBranchPrfix: 'branch_prefix'
    }
  })

  describe('fetchBranchesList', () => {
    it('should return branches refs list', async () => {
      const branchesList = await fetchBranchesList(octokit, pushDescription, 'branch_prefix');
      expect(branchesList).toEqual(expect.arrayContaining(BRANCHES_REFS_LIST_MOCK.data));
    })
  })
  describe('fetchReleaseBranchesNamesByAPI', () => {
    it('should return list with a branches', async () => {
      const branchesList = await fetchReleaseBranchesNamesByAPI(octokit, pushDescription, contextEnv);
      expect(branchesList).toEqual(expect.arrayContaining(BRANCHES_REFS_LIST_MOCK.data.map(() => 'getBranchNameByRefDescription')));
    })
    it('should call getBranchNameByRefDescription with a branches refs list items', async () => {
      const {getBranchNameByRefDescription} = require('../lib/github-common');
      getBranchNameByRefDescription.mockClear();
      await fetchReleaseBranchesNamesByAPI(octokit, pushDescription, contextEnv);
      BRANCHES_REFS_LIST_MOCK.data.forEach((branchRefDescription) => {
        expect(getBranchNameByRefDescription).toBeCalledWith(branchRefDescription, expect.anything(), expect.anything())
      })
    })
  })

  describe('mergeBranchTo', () => {
    it('should resolves with undefined for "Succesfully merged" status code', async () => {
      const octokitWithRepos = {
        repos: {
          merge: jest.fn(() => ({ status: 201 }))
        }
      }
      await expect(mergeBranchTo(
        octokitWithRepos as any,
        pushDescription,
        'target',
        'source',
      )).resolves.toBe(undefined);
    })
    it('should resolves with undefined for "Nothing to merge" status code', async () => {
      const octokitWithRepos = {
        repos: {
          merge: jest.fn(() => ({ status: 204 }))
        }
      }
      await expect(mergeBranchTo(
        octokitWithRepos as any,
        pushDescription,
        'target',
        'source',
      )).resolves.toBe(undefined);
      expect(octokitWithRepos.repos.merge).toBeCalledTimes(1);
    })
    it('should resolves with false for "Merge conflict" status code', async () => {
      const octokitWithRepos = {
        repos: {
          merge: jest.fn(() => ({ status: 409 }))
        }
      }
      await expect(mergeBranchTo(
        octokitWithRepos as any,
        pushDescription,
        'target',
        'source',
      )).resolves.toBe(false);
      expect(octokitWithRepos.repos.merge).toBeCalledTimes(1);
    })
    it.each([200, 300, 400])('should rejects for unknown status code %s', async (status) => {
      const octokitWithRepos = {
        repos: {
          merge: jest.fn(() => ({ status }))
        }
      }
      await expect(mergeBranchTo(
        octokitWithRepos as any,
        pushDescription,
        'target',
        'source',
      )).rejects.toThrow();
      expect(octokitWithRepos.repos.merge).toBeCalledTimes(1);
    })

    it('should resolves with false if octokit throws with "Merge conflict" HttpError', async () => {
      const octokitWithRepos = {
        repos: {
          merge: jest.fn(() => {
            const httpError = new Error('Failed');
            (httpError as any).status = 409;
            throw httpError;
          })
        }
      }
      await expect(mergeBranchTo(
        octokitWithRepos as any,
        pushDescription,
        'branch_a',
        'branch_b',
      )).resolves.toBe(false);
      expect(octokitWithRepos.repos.merge).toBeCalledTimes(1);
    })
    it('should rejects if octokit throws with non "Merge conflict" HttpError', async () => {
      const octokitWithRepos = {
        repos: {
          merge: jest.fn(() => {
            const httpError = new Error('Failed');
            (httpError as any).status = 0;
            throw httpError;
          })
        }
      }
      await expect(mergeBranchTo(
        octokitWithRepos as any,
        pushDescription,
        'branch_a',
        'branch_b',
      )).rejects.toThrow();
      expect(octokitWithRepos.repos.merge).toBeCalledTimes(1);
    })
  })

  describe('checkActivePRExists', () => {
    it('should return false if response status "No errors" (=200) and data is empty', async () => {
      const octokitPulls = {
        pulls: {
          list: jest.fn(() => ({ status: 200, data: [] }))
        }
      }
      await expect(checkActivePRExists(
        octokitPulls as any,
        pushDescription,
        'branch_a',
        'branch_b',
      )).resolves.toBe(false);
      expect(octokitPulls.pulls.list).toBeCalledTimes(1);
    })
    it('should return true if response "No errors" (=200) and data is not empty', async () => {
      const octokitPulls = {
        pulls: {
          list: jest.fn(() => ({ status: 200, data: ['something'] }))
        }
      }
      await expect(checkActivePRExists(
        octokitPulls as any,
        pushDescription,
        'branch_a',
        'branch_b',
      )).resolves.toBe(true);
      expect(octokitPulls.pulls.list).toBeCalledTimes(1);
    })
    it('should throw if response status != 200', async () => {
      const octokitPulls = {
        pulls: {
          list: jest.fn(() => ({ status: 201, data: [] }))
        }
      }
      await expect(checkActivePRExists(
        octokitPulls as any,
        pushDescription,
        'branch_a',
        'branch_b',
      )).rejects.toThrow();
      expect(octokitPulls.pulls.list).toBeCalledTimes(1);
    })
    it('should throw if octokit throws', async () => {
      const octokitPulls = {
        pulls: {
          list: jest.fn(() => {
            throw new Error('Failed');
          })
        }
      }
      await expect(checkActivePRExists(
        octokitPulls as any,
        pushDescription,
        'branch_a',
        'branch_b',
      )).rejects.toThrow();
      expect(octokitPulls.pulls.list).toBeCalledTimes(1);
    })
  })

  describe('createNewPR', () => {
    it('should return pull request number on success', async () => {
      const expectedValue = 200;
      const octokitPulls = {
        pulls: {
          create: jest.fn(() => ({ status: 201, data: { number: expectedValue } }))
        }
      }
      await expect(createNewPR(
        octokitPulls as any,
        pushDescription,
        'branch_a',
        'branch_b',
      )).resolves.toBe(expectedValue);
      expect(octokitPulls.pulls.create).toBeCalledTimes(1);
    })
    it('should throw if unknown response status (not 201)', async () => {
      const octokitPulls = {
        pulls: {
          create: jest.fn(() => ({ status: 200, data: { number: 1 } }))
        }
      }
      await expect(createNewPR(
        octokitPulls as any,
        pushDescription,
        'branch_a',
        'branch_b',
      )).rejects.toThrow();
      expect(octokitPulls.pulls.create).toBeCalledTimes(1);
    })
    it('should throw if octokit throws', async () => {
      const octokitPulls = {
        pulls: {
          create: jest.fn(() => {
            throw new Error('Failed');
          })
        }
      }
      await expect(createNewPR(
        octokitPulls as any,
        pushDescription,
        'branch_a',
        'branch_b',
      )).rejects.toThrow();
      expect(octokitPulls.pulls.create).toBeCalledTimes(1);
    })
  })

  describe('addLabelForPr', () => {
    it('should accept label as string and call API with array', async () => {
      const octokitIssues = {
        issues: {
          addLabels: jest.fn(() => ({ status: 200 }))
        }
      }
      const testLabel = 'label'
      await addLabelForPr(
        octokitIssues as any,
        pushDescription,
        11,
        testLabel
      );
      expect(octokitIssues.issues.addLabels).toBeCalledWith(expect.objectContaining({
        labels: [testLabel]
      }));
    })
    it('should resolves with undefined on success', async () => {
      const octokitIssues = {
        issues: {
          addLabels: jest.fn(() => ({ status: 200 }))
        }
      }
      await expect(addLabelForPr(
        octokitIssues as any,
        pushDescription,
        11,
        'label'
      )).resolves.toBe(undefined);
      expect(octokitIssues.issues.addLabels).toBeCalledTimes(1);
    })
    it('should rejected if response have an unknown status', async () => {
      const octokitIssues = {
        issues: {
          addLabels: jest.fn(() => ({ status: 201 }))
        }
      }
      await expect(addLabelForPr(
        octokitIssues as any,
        pushDescription,
        11,
        'label'
      )).rejects.toThrow();
      expect(octokitIssues.issues.addLabels).toBeCalledTimes(1);
    })
    it('should rejected if api throws', async () => {
      const octokitIssues = {
        issues: {
          addLabels: jest.fn(() => {
            throw new Error('Failed');
          })
        }
      }
      await expect(addLabelForPr(
        octokitIssues as any,
        pushDescription,
        11,
        'label'
      )).rejects.toThrow();
      expect(octokitIssues.issues.addLabels).toBeCalledTimes(1);
    })
  })

  describe('createBranch', () => {
    let BRANCHES_REFS_CREATED_MOCK = ({
      data: {
        ref: "refs/heads/feature/featureA",
        node_id: "MDM6UmVmcmVmcy9oZWFkcy9mZWF0dXJlQQ==",
        url: "https://api.github.com/repos/octocat/Hello-World/git/refs/heads/feature/featureA",
        object: {
          type: "commit",
          sha: "aa218f56b14c9653891f9e74264a383fa43fefbd",
          url: "https://api.github.com/repos/octocat/Hello-World/git/commits/aa218f56b14c9653891f9e74264a383fa43fefbd"
        }
      },
      code: 201
    })

    it('Should returns a branch name', () => {
      expect(createBranch(
        {
          ...octokit,
          git: {
            ...octokit.git,
            createRef: jest.fn(() => ({
              ...BRANCHES_REFS_CREATED_MOCK,
            }))
          }
        },
        pushDescription,
        'newBranchName',
        'commitSha',
      )).resolves.toBe('feature/featureA')
    })
    it('Should throw if a response code is not equals to the 201', () => {
      expect(createBranch(
        {
          ...octokit,
          git: {
            ...octokit.git,
            createRef: jest.fn(() => ({
              ...BRANCHES_REFS_CREATED_MOCK,
              code: 200
            }))
          }
        },
        pushDescription,
        'newBranchName',
        'commitSha',
      )).rejects.toThrowError('Unknown status code returned from the server')
    })
  })

  describe('fetchBranchesListGraphQL', () => {
    it('should call the octokit.graphql with query containing all the arguments', async () => {
      await fetchBranchesListGraphQL(
        octokit,
        'repoName',
        'repoOwner',
        'releaseBranchRefPrfix',
        'releaseBranchTaskPrefix',
        100,
      );
      expect(octokit.graphql).lastCalledWith(expect.stringContaining('repoName'))
      expect(octokit.graphql).lastCalledWith(expect.stringContaining('repoOwner'))
      expect(octokit.graphql).lastCalledWith(expect.stringContaining('releaseBranchRefPrfix'))
      expect(octokit.graphql).lastCalledWith(expect.stringContaining('releaseBranchTaskPrefix'))
      expect(octokit.graphql).lastCalledWith(expect.stringContaining('100'))
    });
    it('should return result of octokit.graphql', async () => {
      await expect(fetchBranchesListGraphQL(
        octokit,
        'repoName',
        'repoOwner',
        'releaseBranchRefPrfix',
        'releaseBranchTaskPrefix',
        100,
      )).resolves.toBe('octokit.graphql');
    });
    it('should throw if octokit,graphql thrown', async () => {
      const octokitThrow = {
        ...octokit,
        graphql: jest.fn(() => {throw new Error('Error octokit')})
      }
      await expect(fetchBranchesListGraphQL(
        octokitThrow,
        'repoName',
        'repoOwner',
        'releaseBranchRefPrfix',
        'releaseBranchTaskPrefix',
        100,
      )).rejects.toThrow('Error octokit');
    })
  })
  describe('fetchBranchesListGraphQL', () => {
    it('should return array of strings', async () => {
      const branchesNames = ['name1', 'name2'];
      const octokitWithGraphQLResult = {
        ...octokit,
        graphql: jest.fn(() => {
          return {
            repository: {
              refs: {
                edges: [
                  { node: { name: branchesNames[0] } },
                  { node: { name: branchesNames[1] } },
                ]
              }
            }
          }
        })
      }
      await expect(fetchRelatedBranchesListGraphQL(
        octokitWithGraphQLResult,
        pushDescription,
        contextEnv,
      )).resolves.toEqual(branchesNames.map(branchName => `${contextEnv.releaseBranchPrfix}/${branchName}`));
    });
  })
})


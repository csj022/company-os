/**
 * GitHub GraphQL Queries
 * Optimized queries for fetching detailed PR information
 */

/**
 * Get detailed pull request information including commits, reviews, and files
 */
export const GET_PULL_REQUEST_DETAILS = `
  query GetPullRequestDetails($owner: String!, $name: String!, $number: Int!) {
    repository(owner: $owner, name: $name) {
      pullRequest(number: $number) {
        id
        title
        body
        state
        createdAt
        updatedAt
        mergedAt
        closedAt
        url
        author {
          login
          avatarUrl
          ... on User {
            name
            email
          }
        }
        baseRefName
        headRefName
        commits(last: 10) {
          totalCount
          nodes {
            commit {
              oid
              message
              messageHeadline
              messageBody
              additions
              deletions
              committedDate
              author {
                name
                email
                date
              }
            }
          }
        }
        reviews(last: 10) {
          totalCount
          nodes {
            id
            state
            body
            submittedAt
            author {
              login
              avatarUrl
            }
          }
        }
        reviewRequests(first: 10) {
          nodes {
            requestedReviewer {
              ... on User {
                login
                name
              }
            }
          }
        }
        files(first: 100) {
          totalCount
          nodes {
            path
            additions
            deletions
          }
        }
        labels(first: 10) {
          nodes {
            name
            color
          }
        }
        assignees(first: 10) {
          nodes {
            login
            name
          }
        }
        milestone {
          title
          dueOn
        }
        isDraft
        mergeable
        additions
        deletions
        changedFiles
      }
    }
  }
`;

/**
 * Get repository information with recent pull requests
 */
export const GET_REPOSITORY_WITH_PRS = `
  query GetRepositoryWithPRs($owner: String!, $name: String!, $prCount: Int = 20) {
    repository(owner: $owner, name: $name) {
      id
      name
      nameWithOwner
      description
      url
      defaultBranchRef {
        name
      }
      isPrivate
      stargazerCount
      forkCount
      primaryLanguage {
        name
        color
      }
      pullRequests(first: $prCount, states: OPEN, orderBy: {field: CREATED_AT, direction: DESC}) {
        totalCount
        nodes {
          number
          title
          state
          createdAt
          author {
            login
          }
          reviews {
            totalCount
          }
          commits {
            totalCount
          }
        }
      }
    }
  }
`;

/**
 * Get multiple repositories for an organization
 */
export const GET_ORG_REPOSITORIES = `
  query GetOrgRepositories($org: String!, $first: Int = 100, $after: String) {
    organization(login: $org) {
      repositories(first: $first, after: $after, orderBy: {field: PUSHED_AT, direction: DESC}) {
        totalCount
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          name
          nameWithOwner
          description
          url
          defaultBranchRef {
            name
          }
          isPrivate
          stargazerCount
          forkCount
          primaryLanguage {
            name
          }
          pushedAt
          updatedAt
        }
      }
    }
  }
`;

/**
 * Get commit details with associated pull requests
 */
export const GET_COMMIT_DETAILS = `
  query GetCommitDetails($owner: String!, $name: String!, $oid: GitObjectID!) {
    repository(owner: $owner, name: $name) {
      object(oid: $oid) {
        ... on Commit {
          oid
          message
          messageHeadline
          messageBody
          additions
          deletions
          committedDate
          author {
            name
            email
            date
          }
          associatedPullRequests(first: 5) {
            nodes {
              number
              title
              state
              merged
              url
            }
          }
          status {
            state
            contexts {
              context
              state
              description
              targetUrl
            }
          }
        }
      }
    }
  }
`;

/**
 * Search for pull requests with specific criteria
 */
export const SEARCH_PULL_REQUESTS = `
  query SearchPullRequests($query: String!, $first: Int = 20) {
    search(query: $query, type: ISSUE, first: $first) {
      issueCount
      nodes {
        ... on PullRequest {
          number
          title
          state
          createdAt
          author {
            login
          }
          repository {
            nameWithOwner
          }
          labels(first: 5) {
            nodes {
              name
            }
          }
        }
      }
    }
  }
`;

/**
 * Get repository deployment information
 */
export const GET_DEPLOYMENTS = `
  query GetDeployments($owner: String!, $name: String!, $first: Int = 20) {
    repository(owner: $owner, name: $name) {
      deployments(first: $first, orderBy: {field: CREATED_AT, direction: DESC}) {
        totalCount
        nodes {
          id
          state
          environment
          description
          createdAt
          updatedAt
          commit {
            oid
            messageHeadline
          }
          statuses(first: 1) {
            nodes {
              state
              description
              environmentUrl
              logUrl
            }
          }
        }
      }
    }
  }
`;

/**
 * Get user or organization information
 */
export const GET_VIEWER_INFO = `
  query GetViewerInfo {
    viewer {
      login
      name
      email
      avatarUrl
      bio
      company
      location
      organizations(first: 10) {
        nodes {
          login
          name
          avatarUrl
        }
      }
    }
  }
`;

/**
 * Get repository issues
 */
export const GET_REPOSITORY_ISSUES = `
  query GetRepositoryIssues($owner: String!, $name: String!, $first: Int = 50, $states: [IssueState!]) {
    repository(owner: $owner, name: $name) {
      issues(first: $first, states: $states, orderBy: {field: CREATED_AT, direction: DESC}) {
        totalCount
        nodes {
          number
          title
          state
          createdAt
          closedAt
          author {
            login
          }
          labels(first: 5) {
            nodes {
              name
              color
            }
          }
          assignees(first: 5) {
            nodes {
              login
            }
          }
          comments {
            totalCount
          }
        }
      }
    }
  }
`;

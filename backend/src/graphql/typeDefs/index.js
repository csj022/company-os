const { gql } = require('graphql-tag');

const typeDefs = gql`
  scalar JSON
  scalar DateTime
  
  type Query {
    # Organizations
    organization(id: ID!): Organization
    organizations: [Organization!]!
    
    # Integrations
    integrations: [Integration!]!
    integration(service: String!): Integration
    
    # Events
    events(filters: EventFilters): [Event!]!
    
    # Metrics
    metrics(metricType: String!, timeRange: String): [Metric!]!
  }
  
  type Mutation {
    # Organizations
    createOrganization(input: CreateOrganizationInput!): Organization!
    updateOrganization(id: ID!, input: UpdateOrganizationInput!): Organization!
    
    # Organization members
    addOrganizationMember(organizationId: ID!, userId: ID!, role: MemberRole!): OrganizationMember!
    updateMemberRole(organizationId: ID!, userId: ID!, role: MemberRole!): OrganizationMember!
    removeMember(organizationId: ID!, userId: ID!): Boolean!
  }
  
  type Subscription {
    # Real-time events
    eventCreated(organizationId: ID!): Event!
    deploymentStatusChanged(projectId: ID): Deployment!
    pullRequestUpdated(repoId: ID): PullRequest!
    agentTaskCreated(agentId: ID): AgentTask!
  }
  
  # Types
  type Organization {
    id: ID!
    name: String!
    slug: String!
    logoUrl: String
    settings: JSON
    members: [OrganizationMember!]!
    integrations: [Integration!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }
  
  type OrganizationMember {
    id: ID!
    user: User!
    role: MemberRole!
    joinedAt: DateTime!
  }
  
  type User {
    id: ID!
    email: String!
    name: String!
    avatarUrl: String
    role: String!
  }
  
  type Integration {
    id: ID!
    organizationId: ID!
    service: String!
    status: IntegrationStatus!
    metadata: JSON
    lastSyncAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }
  
  type Event {
    id: ID!
    organizationId: ID!
    eventType: String!
    eventSource: String!
    actorType: String
    actorId: String
    resourceType: String
    resourceId: String
    metadata: JSON
    createdAt: DateTime!
  }
  
  type Metric {
    id: ID!
    organizationId: ID!
    metricType: String!
    value: Float!
    unit: String
    dimensions: JSON
    recordedAt: DateTime!
  }
  
  type Deployment {
    id: ID!
    projectName: String!
    url: String!
    state: DeploymentState!
    environment: String
    commitSha: String
    branch: String
    healthScore: Int
    createdAt: DateTime!
    readyAt: DateTime
  }
  
  type PullRequest {
    id: ID!
    number: Int!
    title: String!
    state: PRState!
    reviewStatus: ReviewStatus
    agentReviewStatus: String
    createdAt: DateTime!
  }
  
  type AgentTask {
    id: ID!
    agentId: ID!
    taskType: String!
    description: String
    status: TaskStatus!
    priority: Int!
    requiresApproval: Boolean!
    createdAt: DateTime!
    completedAt: DateTime
  }
  
  # Enums
  enum MemberRole {
    OWNER
    ADMIN
    MEMBER
    VIEWER
  }
  
  enum IntegrationStatus {
    ACTIVE
    INACTIVE
    ERROR
  }
  
  enum DeploymentState {
    QUEUED
    BUILDING
    READY
    ERROR
    CANCELED
  }
  
  enum PRState {
    OPEN
    CLOSED
    MERGED
  }
  
  enum ReviewStatus {
    PENDING
    APPROVED
    CHANGES_REQUESTED
  }
  
  enum TaskStatus {
    PENDING
    IN_PROGRESS
    COMPLETED
    FAILED
  }
  
  # Inputs
  input CreateOrganizationInput {
    name: String!
    slug: String!
    logoUrl: String
  }
  
  input UpdateOrganizationInput {
    name: String
    logoUrl: String
    settings: JSON
  }
  
  input EventFilters {
    eventType: String
    eventSource: String
    limit: Int
    offset: Int
  }
`;

module.exports = typeDefs;

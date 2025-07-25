#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { BaseInfraStack } from '../lib/stack/base-infra-stack';
import { SharedResourcesStack } from '../lib/stack/shared-resources-stack';
import { ServiceStack } from '../lib/stack/service-stack';
import { getConfig } from '../lib/config/environment-config';

const app = new cdk.App();

// Get environment from context or default to 'dev'
const environment = (app.node.tryGetContext('environment') as string) || 'dev';
const config = getConfig(environment);

// Common environment settings
const env = {
  account: config.account || process.env.CDK_DEFAULT_ACCOUNT,
  region: config.region || process.env.CDK_DEFAULT_REGION,
};

// 1. Base Infrastructure Stack (VPC, Security Groups)
const baseInfraStack = new BaseInfraStack(app, `${config.envName}-BaseInfraStack`, {
  env,
  vpcConfig: config.vpc,
  description: `Base infrastructure stack for ${config.envName} environment`,
});

// 2. Shared Resources Stack (ECS Cluster, ECR, ALB)
const sharedResourcesStack = new SharedResourcesStack(
  app,
  `${config.envName}-SharedResourcesStack`,
  {
    env,
    vpc: baseInfraStack.vpc,
    albSecurityGroup: baseInfraStack.albSecurityGroup,
    ecsConfig: config.ecs,
    ecrConfig: config.ecr,
    description: `Shared resources stack for ${config.envName} environment`,
  },
);

// Add dependency
sharedResourcesStack.addDependency(baseInfraStack);

// 3. Service Stacks (one for each service defined in config)
Object.entries(config.services).forEach(([serviceKey, serviceConfig]) => {
  const serviceStack = new ServiceStack(app, `${config.envName}-${serviceKey}-ServiceStack`, {
    env,
    serviceName: serviceConfig.name,
    cluster: sharedResourcesStack.ecsCluster,
    repository: sharedResourcesStack.ecrRepository,
    listener: sharedResourcesStack.listener,
    ecsSecurityGroup: baseInfraStack.ecsSecurityGroup,
    serviceConfig: {
      cpu: serviceConfig.cpu,
      memory: serviceConfig.memory,
      desiredCount: serviceConfig.desiredCount,
    },
    priority: serviceConfig.priority,
    pathPattern: serviceConfig.pathPattern,
    description: `${serviceKey} service stack for ${config.envName} environment`,
  });

  // Add dependencies
  serviceStack.addDependency(sharedResourcesStack);
});

// Add tags to all stacks
cdk.Tags.of(app).add('Environment', config.envName);
cdk.Tags.of(app).add('Project', 'ECS-Infrastructure');

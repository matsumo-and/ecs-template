#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ServiceStack } from '../lib/stack/service-stack';
import { getConfig } from '../lib/config/environment-config';

const app = new cdk.App();

// Get environment from context or default to 'dev'
const environment = app.node.tryGetContext('environment') || 'dev';
const config = getConfig(environment);

new ServiceStack(app, `${config.envName}-AppStack`, {
  config,
  env: {
    account: config.account || process.env.CDK_DEFAULT_ACCOUNT,
    region: config.region || process.env.CDK_DEFAULT_REGION,
  },
  description: `ECS Service Stack for ${config.envName} environment`,
});

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { VpcConstruct } from '../construct/network/vpc-construct';
import { EcsClusterConstruct } from '../construct/compute/ecs-cluster-construct';
import { EcrRepositoryConstruct } from '../construct/container/ecr-repository-construct';
import { AlbConstruct } from '../construct/loadbalancer/alb-construct';
import { EcsServiceConstruct } from '../construct/compute/ecs-service-construct';
import { EnvironmentConfig } from '../config/environment-config';

export interface ServiceStackProps extends cdk.StackProps {
  config: EnvironmentConfig;
}

export class ServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ServiceStackProps) {
    super(scope, id, props);

    const { config } = props;

    // VPC
    const vpcConstruct = new VpcConstruct(this, 'VpcConstruct', {
      cidr: config.vpc.cidr,
      maxAzs: config.vpc.maxAzs,
    });

    // ECS Cluster
    const ecsClusterConstruct = new EcsClusterConstruct(this, 'EcsClusterConstruct', {
      vpc: vpcConstruct.vpc,
      clusterName: config.ecs.clusterName,
    });

    // ECR Repository
    const ecrRepositoryConstruct = new EcrRepositoryConstruct(this, 'EcrRepositoryConstruct', {
      repositoryName: config.ecr.repositoryName,
      lifecycleMaxImageCount: config.ecr.lifecycleMaxImageCount,
    });

    // ALB
    const albConstruct = new AlbConstruct(this, 'AlbConstruct', {
      vpc: vpcConstruct.vpc,
    });

    // ECS Service
    new EcsServiceConstruct(this, 'EcsServiceConstruct', {
      cluster: ecsClusterConstruct.cluster,
      repository: ecrRepositoryConstruct.repository,
      listener: albConstruct.listener,
      serviceName: `${config.envName}-app-service`,
      cpu: config.ecs.service.cpu,
      memory: config.ecs.service.memory,
      desiredCount: config.ecs.service.desiredCount,
    });

    // Output ALB DNS
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: albConstruct.alb.loadBalancerDnsName,
      description: 'DNS name of the load balancer',
    });

    // Output ECR Repository URI
    new cdk.CfnOutput(this, 'ECRRepositoryURI', {
      value: ecrRepositoryConstruct.repository.repositoryUri,
      description: 'URI of the ECR repository',
    });
  }
}

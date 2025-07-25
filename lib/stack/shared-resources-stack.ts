import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { EcsClusterConstruct } from '../construct/compute/ecs-cluster-construct';
import { EcrRepositoryConstruct } from '../construct/container/ecr-repository-construct';
import { AlbConstruct } from '../construct/loadbalancer/alb-construct';

export interface SharedResourcesStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  albSecurityGroup: ec2.SecurityGroup;
  ecsConfig: {
    clusterName: string;
  };
  ecrConfig: {
    repositoryName: string;
    lifecycleMaxImageCount: number;
  };
}

export class SharedResourcesStack extends cdk.Stack {
  public readonly ecsCluster: ecs.ICluster;
  public readonly ecrRepository: ecr.IRepository;
  public readonly alb: elbv2.IApplicationLoadBalancer;
  public readonly listener: elbv2.IApplicationListener;

  constructor(scope: Construct, id: string, props: SharedResourcesStackProps) {
    super(scope, id, props);

    // ECS Cluster
    const ecsClusterConstruct = new EcsClusterConstruct(this, 'EcsClusterConstruct', {
      vpc: props.vpc,
      clusterName: props.ecsConfig.clusterName,
    });
    this.ecsCluster = ecsClusterConstruct.cluster;

    // ECR Repository
    const ecrRepositoryConstruct = new EcrRepositoryConstruct(this, 'EcrRepositoryConstruct', {
      repositoryName: props.ecrConfig.repositoryName,
      lifecycleMaxImageCount: props.ecrConfig.lifecycleMaxImageCount,
    });
    this.ecrRepository = ecrRepositoryConstruct.repository;

    // ALB with security group
    const albConstruct = new AlbConstruct(this, 'AlbConstruct', {
      vpc: props.vpc,
      securityGroup: props.albSecurityGroup,
    });
    this.alb = albConstruct.alb;
    this.listener = albConstruct.listener;

    // Outputs
    new cdk.CfnOutput(this, 'ClusterName', {
      value: this.ecsCluster.clusterName,
      exportName: `${this.stackName}-ClusterName`,
    });

    new cdk.CfnOutput(this, 'RepositoryUri', {
      value: this.ecrRepository.repositoryUri,
      exportName: `${this.stackName}-RepositoryUri`,
    });

    new cdk.CfnOutput(this, 'AlbDnsName', {
      value: this.alb.loadBalancerDnsName,
      exportName: `${this.stackName}-AlbDnsName`,
    });

    new cdk.CfnOutput(this, 'ListenerArn', {
      value: this.listener.listenerArn,
      exportName: `${this.stackName}-ListenerArn`,
    });
  }
}

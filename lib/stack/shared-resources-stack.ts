import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { EcsClusterConstruct } from '../construct/compute/ecs-cluster-construct';
import { EcrRepositoryConstruct } from '../construct/container/ecr-repository-construct';
import { AlbConstruct } from '../construct/loadbalancer/alb-construct';

/**
 * SharedResourcesStackのプロパティ
 */
export interface SharedResourcesStackProps extends cdk.StackProps {
  /**
   * リソースを作成するVPC（BaseInfraStackから参照）
   */
  vpc: ec2.IVpc;

  /**
   * ALBに適用するセキュリティグループ（BaseInfraStackから参照）
   */
  albSecurityGroup: ec2.SecurityGroup;

  /**
   * ECSクラスターの設定
   */
  ecsConfig: {
    /**
     * ECSクラスターの名前
     */
    clusterName: string;
  };

  /**
   * ECRリポジトリの設定
   */
  ecrConfig: {
    /**
     * ECRリポジトリの名前
     */
    repositoryName: string;
    /**
     * ライフサイクルルールで保持する最大イメージ数
     */
    lifecycleMaxImageCount: number;
  };
}

/**
 * 共有リソースを管理するStack
 *
 * このStackは複数のサービスで共有されるリソースを作成・管理します：
 * - ECSクラスター（Fargate）
 * - ECRリポジトリ
 * - Application Load Balancer（ALB）
 *
 * これらのリソースは個別のサービスStackから参照されることを想定し、
 * CloudFormation Outputsとしてエクスポートされます。
 *
 * @example
 * ```typescript
 * const sharedResourcesStack = new SharedResourcesStack(app, 'SharedResourcesStack', {
 *   vpc: baseInfraStack.vpc,
 *   albSecurityGroup: baseInfraStack.albSecurityGroup,
 *   ecsConfig: {
 *     clusterName: 'my-cluster'
 *   },
 *   ecrConfig: {
 *     repositoryName: 'my-app',
 *     lifecycleMaxImageCount: 10
 *   }
 * });
 * ```
 */
export class SharedResourcesStack extends cdk.Stack {
  /**
   * 作成されたECSクラスター
   */
  public readonly ecsCluster: ecs.ICluster;

  /**
   * 作成されたECRリポジトリ
   */
  public readonly ecrRepository: ecr.IRepository;

  /**
   * 作成されたApplication Load Balancer
   */
  public readonly alb: elbv2.IApplicationLoadBalancer;

  /**
   * ALBのHTTPリスナー
   */
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

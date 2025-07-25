import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { EcsServiceConstruct } from '../construct/compute/ecs-service-construct';

/**
 * ServiceStackのプロパティ
 */
export interface ServiceStackProps extends cdk.StackProps {
  /**
   * サービスの名前
   */
  serviceName: string;

  /**
   * ECSクラスター（SharedResourcesStackから参照）
   */
  cluster: ecs.ICluster;

  /**
   * ECRリポジトリ（SharedResourcesStackから参照）
   */
  repository: ecr.IRepository;

  /**
   * ALBリスナー（SharedResourcesStackから参照）
   */
  listener: elbv2.IApplicationListener;

  /**
   * ECSタスクに適用するセキュリティグループ（BaseInfraStackから参照）
   */
  ecsSecurityGroup: ec2.ISecurityGroup;

  /**
   * サービスの設定
   */
  serviceConfig: {
    /**
     * タスクのCPU単位
     */
    cpu: number;
    /**
     * タスクのメモリ（MB）
     */
    memory: number;
    /**
     * 起動するタスクの希望数
     */
    desiredCount: number;
  };

  /**
   * ALBリスナールールの優先度
   */
  priority: number;

  /**
   * パスベースルーティングのパターン
   * @default - パスベースルーティングなし
   */
  pathPattern?: string;
}

/**
 * 個別のサービスを管理するStack
 *
 * このStackは単一のECSサービスとその関連リソースを作成・管理します：
 * - ECS Fargateサービス
 * - タスク定義
 * - ALBターゲットグループとリスナールール
 *
 * 共有リソース（ECSクラスター、ECR、ALB）は他のStackから参照します。
 * これにより、サービスごとに独立したデプロイとスケーリングが可能になります。
 *
 * @example
 * ```typescript
 * const serviceStack = new ServiceStack(app, 'ApiServiceStack', {
 *   serviceName: 'api-service',
 *   cluster: sharedResourcesStack.ecsCluster,
 *   repository: sharedResourcesStack.ecrRepository,
 *   listener: sharedResourcesStack.listener,
 *   ecsSecurityGroup: baseInfraStack.ecsSecurityGroup,
 *   serviceConfig: {
 *     cpu: 512,
 *     memory: 1024,
 *     desiredCount: 2
 *   },
 *   priority: 100,
 *   pathPattern: '/api/*'
 * });
 * ```
 */
export class ServiceStack extends cdk.Stack {
  /**
   * 作成されたECS Fargateサービス
   */
  public readonly service: ecs.FargateService;

  constructor(scope: Construct, id: string, props: ServiceStackProps) {
    super(scope, id, props);

    // ECS Service
    const ecsServiceConstruct = new EcsServiceConstruct(this, 'EcsServiceConstruct', {
      cluster: props.cluster,
      repository: props.repository,
      listener: props.listener,
      serviceName: props.serviceName,
      cpu: props.serviceConfig.cpu,
      memory: props.serviceConfig.memory,
      desiredCount: props.serviceConfig.desiredCount,
      securityGroup: props.ecsSecurityGroup,
      priority: props.priority,
      pathPattern: props.pathPattern,
    });

    this.service = ecsServiceConstruct.service;

    // Output Service Name
    new cdk.CfnOutput(this, 'ServiceName', {
      value: this.service.serviceName,
      description: 'Name of the ECS service',
    });

    // Output Service ARN
    new cdk.CfnOutput(this, 'ServiceArn', {
      value: this.service.serviceArn,
      description: 'ARN of the ECS service',
    });
  }
}

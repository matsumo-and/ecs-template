import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Duration } from 'aws-cdk-lib';

/**
 * ECS Service Constructのプロパティ
 */
export interface EcsServiceConstructProps {
  /**
   * ECSクラスター
   */
  cluster: ecs.ICluster;

  /**
   * コンテナイメージを取得するECRリポジトリ
   */
  repository: ecr.IRepository;

  /**
   * ALBリスナー（ターゲットグループを追加する）
   */
  listener: elbv2.IApplicationListener;

  /**
   * ECSサービスの名前
   */
  serviceName: string;

  /**
   * タスクのCPU単位（256, 512, 1024, 2048, 4096）
   * @default 256
   */
  cpu?: number;

  /**
   * タスクのメモリ（MB）
   * @default 512
   */
  memory?: number;

  /**
   * 起動するタスクの希望数
   * @default 1
   */
  desiredCount?: number;

  /**
   * ECSタスクに適用するセキュリティグループ
   * @default - 新しいセキュリティグループが作成される
   */
  securityGroup?: ec2.ISecurityGroup;

  /**
   * ALBリスナールールの優先度
   * @default 100
   */
  priority?: number;

  /**
   * パスベースルーティングのパターン
   * @default - パスベースルーティングなし
   */
  pathPattern?: string;
}

/**
 * ECS Fargateサービスを作成するConstruct
 *
 * このConstructは以下を作成します：
 * - Fargateタスク定義
 * - ECSサービス
 * - ALBターゲットグループとリスナールール
 * - CloudWatch Logsへのログ出力設定
 *
 * @example
 * ```typescript
 * const ecsService = new EcsServiceConstruct(this, 'EcsService', {
 *   cluster: cluster,
 *   repository: repository,
 *   listener: listener,
 *   serviceName: 'my-service',
 *   cpu: 512,
 *   memory: 1024,
 *   desiredCount: 2,
 *   priority: 100,
 *   pathPattern: '/api/*'
 * });
 * ```
 */
export class EcsServiceConstruct extends Construct {
  /**
   * 作成されたECS Fargateサービス
   */
  public readonly service: ecs.FargateService;

  constructor(scope: Construct, id: string, props: EcsServiceConstructProps) {
    super(scope, id);

    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      cpu: props.cpu ?? 256,
      memoryLimitMiB: props.memory ?? 512,
    });

    const container = taskDefinition.addContainer('Container', {
      image: ecs.ContainerImage.fromEcrRepository(props.repository),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: props.serviceName,
      }),
    });

    container.addPortMappings({
      containerPort: 80,
      protocol: ecs.Protocol.TCP,
    });

    this.service = new ecs.FargateService(this, 'Service', {
      cluster: props.cluster,
      taskDefinition,
      desiredCount: props.desiredCount ?? 1,
      serviceName: props.serviceName,
      securityGroups: props.securityGroup ? [props.securityGroup] : undefined,
    });

    // Add targets to listener with inline target group
    props.listener.addTargets('Target', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [this.service],
      priority: props.priority ?? 100,
      conditions: props.pathPattern
        ? [elbv2.ListenerCondition.pathPatterns([props.pathPattern])]
        : [],
      healthCheck: {
        interval: Duration.seconds(30),
        path: '/health',
        timeout: Duration.seconds(5),
      },
    });
  }
}

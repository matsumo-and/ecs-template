import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Duration, RemovalPolicy } from 'aws-cdk-lib';

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
 * - タスク実行ロール（ECRアクセス、CloudWatch Logs書き込み権限）
 * - タスクロール（アプリケーション用のIAMロール）
 * - ECSサービス
 * - ALBターゲットグループとリスナールール
 * - CloudWatch Logsグループ（1週間保持）
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
 *
 * // タスクロールに追加の権限を付与する場合
 * ecsService.taskRole.addToPolicy(new iam.PolicyStatement({
 *   actions: ['s3:GetObject'],
 *   resources: ['arn:aws:s3:::my-bucket/*']
 * }));
 * ```
 */
export class EcsServiceConstruct extends Construct {
  /**
   * 作成されたECS Fargateサービス
   */
  public readonly service: ecs.FargateService;

  /**
   * タスク実行ロール（ECRからのイメージ取得、CloudWatch Logsへの書き込み）
   */
  public readonly taskExecutionRole: iam.Role;

  /**
   * タスクロール（アプリケーションが使用するAWSリソースへのアクセス）
   */
  public readonly taskRole: iam.Role;

  constructor(scope: Construct, id: string, props: EcsServiceConstructProps) {
    super(scope, id);

    // タスク実行ロール（ECSがタスクを起動するために必要な権限）
    this.taskExecutionRole = new iam.Role(this, 'TaskExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: `Task execution role for ${props.serviceName}`,
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
    });

    // ECRリポジトリへのアクセス権限を追加
    props.repository.grantPull(this.taskExecutionRole);

    // タスクロール（コンテナ内のアプリケーションが使用する権限）
    this.taskRole = new iam.Role(this, 'TaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: `Task role for ${props.serviceName}`,
    });

    // CloudWatch Logsのロググループを明示的に作成
    const logGroup = new logs.LogGroup(this, 'LogGroup', {
      logGroupName: `/ecs/${props.serviceName}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      cpu: props.cpu ?? 256,
      memoryLimitMiB: props.memory ?? 512,
      executionRole: this.taskExecutionRole,
      taskRole: this.taskRole,
    });

    const container = taskDefinition.addContainer('Container', {
      image: ecs.ContainerImage.fromEcrRepository(props.repository),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: props.serviceName,
        logGroup: logGroup,
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

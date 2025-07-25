import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

/**
 * ECS Cluster Constructのプロパティ
 */
export interface EcsClusterConstructProps {
  /**
   * ECSクラスターを作成するVPC
   */
  vpc: ec2.IVpc;

  /**
   * ECSクラスターの名前
   * @default - CloudFormationが自動生成
   */
  clusterName?: string;
}

/**
 * ECSクラスターを作成するConstruct
 *
 * このConstructは以下の設定でECSクラスターを作成します：
 * - Fargate対応
 * - Container Insights有効
 * - 指定されたVPC内に作成
 *
 * @example
 * ```typescript
 * const ecsCluster = new EcsClusterConstruct(this, 'EcsCluster', {
 *   vpc: vpc,
 *   clusterName: 'my-cluster'
 * });
 * ```
 */
export class EcsClusterConstruct extends Construct {
  /**
   * 作成されたECSクラスター
   */
  public readonly cluster: ecs.Cluster;

  constructor(scope: Construct, id: string, props: EcsClusterConstructProps) {
    super(scope, id);

    this.cluster = new ecs.Cluster(this, 'Cluster', {
      vpc: props.vpc,
      clusterName: props.clusterName,
      containerInsights: true,
    });
  }
}

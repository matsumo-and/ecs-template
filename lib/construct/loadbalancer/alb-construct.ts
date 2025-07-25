import { Construct } from 'constructs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

/**
 * ALB Constructのプロパティ
 */
export interface AlbConstructProps {
  /**
   * ALBを作成するVPC
   */
  vpc: ec2.IVpc;

  /**
   * インターネット向けALBにするか
   * @default true
   */
  internetFacing?: boolean;

  /**
   * ALBに適用するセキュリティグループ
   * @default - 新しいセキュリティグループが作成される
   */
  securityGroup?: ec2.ISecurityGroup;
}

/**
 * Application Load Balancerを作成するConstruct
 *
 * このConstructは以下の設定でALBを作成します：
 * - インターネット向け（デフォルト）
 * - HTTP（ポート80）リスナー付き
 * - デフォルトアクション: 404レスポンス
 *
 * @example
 * ```typescript
 * const alb = new AlbConstruct(this, 'ALB', {
 *   vpc: vpc,
 *   internetFacing: true,
 *   securityGroup: albSecurityGroup
 * });
 * ```
 */
export class AlbConstruct extends Construct {
  /**
   * 作成されたApplication Load Balancer
   */
  public readonly alb: elbv2.ApplicationLoadBalancer;

  /**
   * HTTPリスナー（ポート80）
   * ECSサービスなどのターゲットを追加する際に使用
   */
  public readonly listener: elbv2.ApplicationListener;

  constructor(scope: Construct, id: string, props: AlbConstructProps) {
    super(scope, id);

    this.alb = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      vpc: props.vpc,
      internetFacing: props.internetFacing ?? true,
      securityGroup: props.securityGroup,
    });

    this.listener = this.alb.addListener('Listener', {
      port: 80,
      open: true,
      defaultAction: elbv2.ListenerAction.fixedResponse(404, {
        contentType: 'text/plain',
        messageBody: 'Not Found',
      }),
    });
  }
}

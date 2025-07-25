import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

/**
 * Security Groups Constructのプロパティ
 */
export interface SecurityGroupsConstructProps {
  /**
   * セキュリティグループを作成するVPC
   */
  vpc: ec2.IVpc;
}

/**
 * ALBとECSタスク用のセキュリティグループを作成するConstruct
 *
 * このConstructは以下のセキュリティグループを作成します：
 * - ALB用セキュリティグループ（HTTP/HTTPSを許可）
 * - ECSタスク用セキュリティグループ（ALBからのトラフィックを許可）
 *
 * @example
 * ```typescript
 * const securityGroups = new SecurityGroupsConstruct(this, 'SecurityGroups', {
 *   vpc: vpc
 * });
 * ```
 */
export class SecurityGroupsConstruct extends Construct {
  /**
   * ALB用のセキュリティグループ
   * - インバウンド: HTTP(80), HTTPS(443)を全てのIPから許可
   * - アウトバウンド: 全て許可
   */
  public readonly albSecurityGroup: ec2.SecurityGroup;

  /**
   * ECSタスク用のセキュリティグループ
   * - インバウンド: ALBセキュリティグループからの全トラフィックを許可
   * - アウトバウンド: 全て許可
   */
  public readonly ecsSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: SecurityGroupsConstructProps) {
    super(scope, id);

    // ALB Security Group
    this.albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });

    // Allow HTTP traffic from anywhere
    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic',
    );

    // Allow HTTPS traffic from anywhere
    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic',
    );

    // ECS Security Group
    this.ecsSecurityGroup = new ec2.SecurityGroup(this, 'EcsSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for ECS tasks',
      allowAllOutbound: true,
    });

    // Allow traffic from ALB
    this.ecsSecurityGroup.addIngressRule(
      this.albSecurityGroup,
      ec2.Port.allTraffic(),
      'Allow traffic from ALB',
    );
  }
}

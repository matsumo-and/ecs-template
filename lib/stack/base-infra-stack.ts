import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { VpcConstruct } from '../construct/network/vpc-construct';
import { SecurityGroupsConstruct } from '../construct/network/security-groups-construct';
import { VpcEndpointsConstruct } from '../construct/network/vpc-endpoints-construct';

/**
 * BaseInfraStackのプロパティ
 */
export interface BaseInfraStackProps extends cdk.StackProps {
  /**
   * VPCの設定
   */
  vpcConfig: {
    /**
     * VPCのCIDRブロック
     */
    cidr: string;
    /**
     * 使用する最大アベイラビリティゾーン数
     */
    maxAzs: number;
  };
}

/**
 * 基盤インフラストラクチャを管理するStack
 *
 * このStackは以下のリソースを作成・管理します：
 * - VPC（パブリック/プライベートサブネット、NATゲートウェイ）
 * - セキュリティグループ（ALB用、ECSタスク用、VPCエンドポイント用）
 * - VPCエンドポイント（S3、ECR、ECS、CloudWatch Logs）
 *
 * 他のStackから参照されることを想定し、主要なリソースは
 * CloudFormation Outputsとしてエクスポートされます。
 *
 * @example
 * ```typescript
 * const baseInfraStack = new BaseInfraStack(app, 'BaseInfraStack', {
 *   vpcConfig: {
 *     cidr: '10.0.0.0/16',
 *     maxAzs: 2
 *   }
 * });
 * ```
 */
export class BaseInfraStack extends cdk.Stack {
  /**
   * 作成されたVPC
   */
  public readonly vpc: ec2.IVpc;

  /**
   * ALB用のセキュリティグループ
   */
  public readonly albSecurityGroup: ec2.SecurityGroup;

  /**
   * ECSタスク用のセキュリティグループ
   */
  public readonly ecsSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: BaseInfraStackProps) {
    super(scope, id, props);

    // VPC
    const vpcConstruct = new VpcConstruct(this, 'VpcConstruct', {
      cidr: props.vpcConfig.cidr,
      maxAzs: props.vpcConfig.maxAzs,
    });
    this.vpc = vpcConstruct.vpc;

    // Security Groups
    const securityGroupsConstruct = new SecurityGroupsConstruct(this, 'SecurityGroupsConstruct', {
      vpc: this.vpc,
    });
    this.albSecurityGroup = securityGroupsConstruct.albSecurityGroup;
    this.ecsSecurityGroup = securityGroupsConstruct.ecsSecurityGroup;

    // VPC Endpoints
    new VpcEndpointsConstruct(this, 'VpcEndpointsConstruct', {
      vpc: this.vpc,
      endpointSecurityGroup: securityGroupsConstruct.endpointSecurityGroup,
    });

    // Outputs for cross-stack references
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      exportName: `${this.stackName}-VpcId`,
    });

    new cdk.CfnOutput(this, 'AlbSecurityGroupId', {
      value: this.albSecurityGroup.securityGroupId,
      exportName: `${this.stackName}-AlbSecurityGroupId`,
    });

    new cdk.CfnOutput(this, 'EcsSecurityGroupId', {
      value: this.ecsSecurityGroup.securityGroupId,
      exportName: `${this.stackName}-EcsSecurityGroupId`,
    });
  }
}

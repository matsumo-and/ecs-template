import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

/**
 * VPC Constructのプロパティ
 */
export interface VpcConstructProps {
  /**
   * VPCのCIDRブロック
   * @default '10.0.0.0/16'
   */
  cidr?: string;

  /**
   * 使用する最大アベイラビリティゾーン数
   * @default 2
   */
  maxAzs?: number;
}

/**
 * VPCとサブネットを作成するConstruct
 *
 * このConstructは以下のリソースを作成します：
 * - VPC（指定されたCIDRブロック）
 * - パブリックサブネット（各AZに1つ）
 * - プライベートサブネット（各AZに1つ）
 * - NATゲートウェイ（1つ）
 * - インターネットゲートウェイ
 *
 * @example
 * ```typescript
 * const vpcConstruct = new VpcConstruct(this, 'MyVpc', {
 *   cidr: '10.0.0.0/16',
 *   maxAzs: 2
 * });
 * ```
 */
export class VpcConstruct extends Construct {
  /**
   * 作成されたVPC
   */
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props?: VpcConstructProps) {
    super(scope, id);

    this.vpc = new ec2.Vpc(this, 'Vpc', {
      ipAddresses: ec2.IpAddresses.cidr(props?.cidr ?? '10.0.0.0/16'),
      maxAzs: props?.maxAzs ?? 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
    });
  }
}

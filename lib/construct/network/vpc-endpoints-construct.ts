import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

/**
 * VPC Endpoints Constructのプロパティ
 */
export interface VpcEndpointsConstructProps {
  /**
   * VPCエンドポイントを作成するVPC
   */
  vpc: ec2.IVpc;

  /**
   * VPCエンドポイント用のセキュリティグループ
   */
  endpointSecurityGroup: ec2.SecurityGroup;
}

/**
 * VPCエンドポイントを作成するConstruct
 *
 * このConstructは以下のVPCエンドポイントを作成します：
 * - S3 (Gateway Endpoint)
 * - ECR API (Interface Endpoint)
 * - ECR DKR (Interface Endpoint)
 * - ECS Agent (Interface Endpoint)
 * - ECS Telemetry (Interface Endpoint)
 * - CloudWatch Logs (Interface Endpoint)
 *
 * @example
 * ```typescript
 * const vpcEndpoints = new VpcEndpointsConstruct(this, 'VpcEndpoints', {
 *   vpc: vpc,
 *   endpointSecurityGroup: endpointSecurityGroup
 * });
 * ```
 */
export class VpcEndpointsConstruct extends Construct {
  /**
   * S3 Gateway Endpoint
   */
  public readonly s3Endpoint: ec2.GatewayVpcEndpoint;

  /**
   * ECR API Interface Endpoint
   */
  public readonly ecrApiEndpoint: ec2.InterfaceVpcEndpoint;

  /**
   * ECR DKR Interface Endpoint
   */
  public readonly ecrDkrEndpoint: ec2.InterfaceVpcEndpoint;

  /**
   * ECS Agent Interface Endpoint
   */
  public readonly ecsAgentEndpoint: ec2.InterfaceVpcEndpoint;

  /**
   * ECS Telemetry Interface Endpoint
   */
  public readonly ecsTelemetryEndpoint: ec2.InterfaceVpcEndpoint;

  /**
   * CloudWatch Logs Interface Endpoint
   */
  public readonly logsEndpoint: ec2.InterfaceVpcEndpoint;

  constructor(scope: Construct, id: string, props: VpcEndpointsConstructProps) {
    super(scope, id);

    // S3 Gateway Endpoint (無料)
    this.s3Endpoint = new ec2.GatewayVpcEndpoint(this, 'S3Endpoint', {
      vpc: props.vpc,
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });

    // ECR API Interface Endpoint
    this.ecrApiEndpoint = new ec2.InterfaceVpcEndpoint(this, 'EcrApiEndpoint', {
      vpc: props.vpc,
      service: ec2.InterfaceVpcEndpointAwsService.ECR,
      privateDnsEnabled: true,
      securityGroups: [props.endpointSecurityGroup],
    });

    // ECR DKR Interface Endpoint (Docker Registry)
    this.ecrDkrEndpoint = new ec2.InterfaceVpcEndpoint(this, 'EcrDkrEndpoint', {
      vpc: props.vpc,
      service: ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER,
      privateDnsEnabled: true,
      securityGroups: [props.endpointSecurityGroup],
    });

    // ECS Agent Interface Endpoint
    this.ecsAgentEndpoint = new ec2.InterfaceVpcEndpoint(this, 'EcsAgentEndpoint', {
      vpc: props.vpc,
      service: ec2.InterfaceVpcEndpointAwsService.ECS_AGENT,
      privateDnsEnabled: true,
      securityGroups: [props.endpointSecurityGroup],
    });

    // ECS Telemetry Interface Endpoint
    this.ecsTelemetryEndpoint = new ec2.InterfaceVpcEndpoint(this, 'EcsTelemetryEndpoint', {
      vpc: props.vpc,
      service: ec2.InterfaceVpcEndpointAwsService.ECS_TELEMETRY,
      privateDnsEnabled: true,
      securityGroups: [props.endpointSecurityGroup],
    });

    // CloudWatch Logs Interface Endpoint
    this.logsEndpoint = new ec2.InterfaceVpcEndpoint(this, 'LogsEndpoint', {
      vpc: props.vpc,
      service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
      privateDnsEnabled: true,
      securityGroups: [props.endpointSecurityGroup],
    });
  }
}

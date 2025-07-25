import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { VpcConstruct } from '../construct/network/vpc-construct';
import { SecurityGroupsConstruct } from '../construct/network/security-groups-construct';

export interface BaseInfraStackProps extends cdk.StackProps {
  vpcConfig: {
    cidr: string;
    maxAzs: number;
  };
}

export class BaseInfraStack extends cdk.Stack {
  public readonly vpc: ec2.IVpc;
  public readonly albSecurityGroup: ec2.SecurityGroup;
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

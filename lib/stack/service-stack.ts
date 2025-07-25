import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { EcsServiceConstruct } from '../construct/compute/ecs-service-construct';

export interface ServiceStackProps extends cdk.StackProps {
  serviceName: string;
  cluster: ecs.ICluster;
  repository: ecr.IRepository;
  listener: elbv2.IApplicationListener;
  ecsSecurityGroup: ec2.ISecurityGroup;
  serviceConfig: {
    cpu: number;
    memory: number;
    desiredCount: number;
  };
  priority: number;
  pathPattern?: string;
}

export class ServiceStack extends cdk.Stack {
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

import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Duration } from 'aws-cdk-lib';

export interface EcsServiceConstructProps {
  cluster: ecs.ICluster;
  repository: ecr.IRepository;
  listener: elbv2.IApplicationListener;
  serviceName: string;
  cpu?: number;
  memory?: number;
  desiredCount?: number;
  securityGroup?: ec2.ISecurityGroup;
  priority?: number;
  pathPattern?: string;
}

export class EcsServiceConstruct extends Construct {
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

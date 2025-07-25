import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { Duration } from 'aws-cdk-lib';

export interface EcsServiceConstructProps {
  cluster: ecs.Cluster;
  repository: ecr.Repository;
  listener: elbv2.ApplicationListener;
  serviceName: string;
  cpu?: number;
  memory?: number;
  desiredCount?: number;
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
    });

    props.listener.addTargets('Target', {
      port: 80,
      targets: [this.service],
      healthCheck: {
        interval: Duration.seconds(30),
        path: '/health',
        timeout: Duration.seconds(5),
      },
    });
  }
}

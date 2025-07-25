import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export interface EcsClusterConstructProps {
  vpc: ec2.Vpc;
  clusterName?: string;
}

export class EcsClusterConstruct extends Construct {
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

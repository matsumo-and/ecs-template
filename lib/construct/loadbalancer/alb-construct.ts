import { Construct } from 'constructs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export interface AlbConstructProps {
  vpc: ec2.Vpc;
  internetFacing?: boolean;
}

export class AlbConstruct extends Construct {
  public readonly alb: elbv2.ApplicationLoadBalancer;
  public readonly listener: elbv2.ApplicationListener;

  constructor(scope: Construct, id: string, props: AlbConstructProps) {
    super(scope, id);

    this.alb = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      vpc: props.vpc,
      internetFacing: props.internetFacing ?? true,
    });

    this.listener = this.alb.addListener('Listener', {
      port: 80,
      open: true,
    });
  }
}

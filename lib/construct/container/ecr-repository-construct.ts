import { Construct } from 'constructs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { RemovalPolicy } from 'aws-cdk-lib';

export interface EcrRepositoryConstructProps {
  repositoryName: string;
  imageScanOnPush?: boolean;
  lifecycleMaxImageCount?: number;
}

export class EcrRepositoryConstruct extends Construct {
  public readonly repository: ecr.Repository;

  constructor(scope: Construct, id: string, props: EcrRepositoryConstructProps) {
    super(scope, id);

    this.repository = new ecr.Repository(this, 'Repository', {
      repositoryName: props.repositoryName,
      imageScanOnPush: props.imageScanOnPush ?? true,
      removalPolicy: RemovalPolicy.DESTROY,
      lifecycleRules: props.lifecycleMaxImageCount
        ? [
            {
              maxImageCount: props.lifecycleMaxImageCount,
            },
          ]
        : undefined,
    });
  }
}

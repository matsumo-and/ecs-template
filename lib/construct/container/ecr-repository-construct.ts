import { Construct } from 'constructs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { RemovalPolicy } from 'aws-cdk-lib';

/**
 * ECR Repository Constructのプロパティ
 */
export interface EcrRepositoryConstructProps {
  /**
   * ECRリポジトリの名前
   */
  repositoryName: string;

  /**
   * プッシュ時にイメージスキャンを実行するか
   * @default true
   */
  imageScanOnPush?: boolean;

  /**
   * ライフサイクルルールで保持する最大イメージ数
   * @default - ライフサイクルルールなし
   */
  lifecycleMaxImageCount?: number;
}

/**
 * ECRリポジトリを作成するConstruct
 *
 * このConstructは以下の設定でECRリポジトリを作成します：
 * - イメージスキャン有効（デフォルト）
 * - スタック削除時にリポジトリも削除
 * - オプションでライフサイクルルールを設定
 *
 * @example
 * ```typescript
 * const ecrRepository = new EcrRepositoryConstruct(this, 'EcrRepository', {
 *   repositoryName: 'my-app',
 *   imageScanOnPush: true,
 *   lifecycleMaxImageCount: 10
 * });
 * ```
 */
export class EcrRepositoryConstruct extends Construct {
  /**
   * 作成されたECRリポジトリ
   */
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

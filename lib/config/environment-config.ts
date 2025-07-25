/**
 * 環境設定の型定義
 */
export interface EnvironmentConfig {
  /**
   * 環境名（dev, prod など）
   */
  envName: string;

  /**
   * AWSアカウントID
   * @default - CDK_DEFAULT_ACCOUNT環境変数を使用
   */
  account?: string;

  /**
   * AWSリージョン
   * @default - CDK_DEFAULT_REGION環境変数を使用
   */
  region?: string;

  /**
   * VPCの設定
   */
  vpc: {
    /**
     * VPCのCIDRブロック
     */
    cidr: string;
    /**
     * 使用する最大アベイラビリティゾーン数
     */
    maxAzs: number;
  };

  /**
   * ECSクラスターの設定
   */
  ecs: {
    /**
     * ECSクラスターの名前
     */
    clusterName: string;
  };

  /**
   * ECRリポジトリの設定
   */
  ecr: {
    /**
     * ECRリポジトリの名前
     */
    repositoryName: string;
    /**
     * ライフサイクルルールで保持する最大イメージ数
     */
    lifecycleMaxImageCount: number;
  };

  /**
   * サービスの設定（複数サービスに対応）
   */
  services: {
    [serviceName: string]: {
      /**
       * サービスの名前
       */
      name: string;
      /**
       * タスクのCPU単位
       */
      cpu: number;
      /**
       * タスクのメモリ（MB）
       */
      memory: number;
      /**
       * 起動するタスクの希望数
       */
      desiredCount: number;
      /**
       * ALBリスナールールの優先度
       */
      priority: number;
      /**
       * パスベースルーティングのパターン
       */
      pathPattern?: string;
    };
  };
}

/**
 * 環境別の設定
 *
 * 各環境（dev, prod）に応じた設定値を定義します。
 * 新しい環境を追加する場合は、このオブジェクトに設定を追加してください。
 */
export const environmentConfigs: { [key: string]: EnvironmentConfig } = {
  dev: {
    envName: 'dev',
    vpc: {
      cidr: '10.0.0.0/16',
      maxAzs: 2,
    },
    ecs: {
      clusterName: 'dev-ecs-cluster',
    },
    ecr: {
      repositoryName: 'dev-app',
      lifecycleMaxImageCount: 5,
    },
    services: {
      api: {
        name: 'dev-api-service',
        cpu: 256,
        memory: 512,
        desiredCount: 1,
        priority: 100,
        pathPattern: '/api/*',
      },
    },
  },
  prod: {
    envName: 'prod',
    vpc: {
      cidr: '10.1.0.0/16',
      maxAzs: 3,
    },
    ecs: {
      clusterName: 'prod-ecs-cluster',
    },
    ecr: {
      repositoryName: 'prod-app',
      lifecycleMaxImageCount: 20,
    },
    services: {
      api: {
        name: 'prod-api-service',
        cpu: 512,
        memory: 1024,
        desiredCount: 2,
        priority: 100,
        pathPattern: '/api/*',
      },
    },
  },
};

/**
 * 指定された環境の設定を取得する
 *
 * @param environment - 環境名（'dev', 'prod' など）
 * @returns 指定された環境の設定
 * @throws 指定された環境が存在しない場合はエラー
 *
 * @example
 * ```typescript
 * const config = getConfig('dev');
 * console.log(config.vpc.cidr); // '10.0.0.0/16'
 * ```
 */
export function getConfig(environment: string): EnvironmentConfig {
  const config = environmentConfigs[environment];
  if (!config) {
    throw new Error(`Unknown environment: ${environment}`);
  }
  return config;
}

export interface EnvironmentConfig {
  envName: string;
  account?: string;
  region?: string;
  vpc: {
    cidr: string;
    maxAzs: number;
  };
  ecs: {
    clusterName: string;
    service: {
      cpu: number;
      memory: number;
      desiredCount: number;
    };
  };
  ecr: {
    repositoryName: string;
    lifecycleMaxImageCount: number;
  };
}

export const environmentConfigs: { [key: string]: EnvironmentConfig } = {
  dev: {
    envName: 'dev',
    vpc: {
      cidr: '10.0.0.0/16',
      maxAzs: 2,
    },
    ecs: {
      clusterName: 'dev-ecs-cluster',
      service: {
        cpu: 256,
        memory: 512,
        desiredCount: 1,
      },
    },
    ecr: {
      repositoryName: 'dev-app',
      lifecycleMaxImageCount: 5,
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
      service: {
        cpu: 512,
        memory: 1024,
        desiredCount: 2,
      },
    },
    ecr: {
      repositoryName: 'prod-app',
      lifecycleMaxImageCount: 20,
    },
  },
};

export function getConfig(environment: string): EnvironmentConfig {
  const config = environmentConfigs[environment];
  if (!config) {
    throw new Error(`Unknown environment: ${environment}`);
  }
  return config;
}

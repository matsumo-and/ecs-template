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
  };
  ecr: {
    repositoryName: string;
    lifecycleMaxImageCount: number;
  };
  services: {
    [serviceName: string]: {
      name: string;
      cpu: number;
      memory: number;
      desiredCount: number;
      priority: number;
      pathPattern?: string;
    };
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

export function getConfig(environment: string): EnvironmentConfig {
  const config = environmentConfigs[environment];
  if (!config) {
    throw new Error(`Unknown environment: ${environment}`);
  }
  return config;
}

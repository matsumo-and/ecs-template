# CDK ECS Infrastructure Template

このプロジェクトは、AWS CDKを使用してECSクラスター周りのインフラストラクチャをIaCで管理するためのテンプレートです。

## アーキテクチャ

このテンプレートは複数のStackに分割されており、以下のAWSリソースを作成します：

### BaseInfraStack（基盤インフラ）

- **VPC**: パブリック/プライベートサブネットを持つVPC
- **Security Groups**: ALB、ECSタスク、VPCエンドポイント用のセキュリティグループ
- **VPC Endpoints**: プライベートサブネットからAWSサービスへのアクセス用
  - S3 (Gateway Endpoint)
  - ECR API & ECR DKR (Interface Endpoint)
  - ECS Agent & ECS Telemetry (Interface Endpoint)
  - CloudWatch Logs (Interface Endpoint)

### SharedResourcesStack（共有リソース）

- **ECS Cluster**: Fargateを使用したECSクラスター
- **ECR Repository**: Dockerイメージを保存するためのECRリポジトリ
- **ALB**: インターネットからのトラフィックを受け付けるApplication Load Balancer

### ServiceStack（サービス）

- **ECS Service**: Fargateで実行されるECSサービス
- **Target Group**: ALBからのトラフィックをルーティング

## フォルダ構成

```
cdk-template/
├── bin/
│   └── app.ts                    # CDKアプリケーションのエントリーポイント
├── lib/
│   ├── stack/
│   │   ├── base-infra-stack.ts   # 基盤インフラStack（VPC、セキュリティグループ）
│   │   ├── shared-resources-stack.ts  # 共有リソースStack（ECS、ECR、ALB）
│   │   └── service-stack.ts      # サービスStack（ECSサービス）
│   ├── construct/
│   │   ├── network/
│   │   │   ├── vpc-construct.ts  # VPC関連のConstruct
│   │   │   └── security-groups-construct.ts  # セキュリティグループ
│   │   ├── compute/
│   │   │   ├── ecs-cluster-construct.ts  # ECSクラスター
│   │   │   └── ecs-service-construct.ts  # ECSサービス
│   │   ├── container/
│   │   │   └── ecr-repository-construct.ts  # ECRリポジトリ
│   │   └── loadbalancer/
│   │       └── alb-construct.ts  # Application Load Balancer
│   └── config/
│       └── environment-config.ts  # 環境別設定
└── test/
```

## 前提条件

- Node.js (v14以上)
- AWS CLI設定済み
- AWS CDK CLI (`npm install -g aws-cdk`)

## セットアップ

1. 依存関係のインストール:

```bash
npm install
```

2. TypeScriptのビルド:

```bash
npm run build
```

## デプロイ

### 開発環境へのデプロイ

```bash
cdk deploy -c environment=dev
```

### 本番環境へのデプロイ

```bash
cdk deploy -c environment=prod
```

## 環境設定

環境別の設定は `lib/config/environment-config.ts` で管理されています。

### 開発環境 (dev)

- VPC CIDR: 10.0.0.0/16
- ECS CPU: 256
- ECS Memory: 512 MB
- Desired Count: 1

### 本番環境 (prod)

- VPC CIDR: 10.1.0.0/16
- ECS CPU: 512
- ECS Memory: 1024 MB
- Desired Count: 2

## Dockerイメージのプッシュ

デプロイ後、ECRリポジトリにDockerイメージをプッシュする必要があります：

1. ECRにログイン:

```bash
aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <account-id>.dkr.ecr.<region>.amazonaws.com
```

2. Dockerイメージをビルド:

```bash
docker build -t <repository-name> .
```

3. イメージにタグを付ける:

```bash
docker tag <repository-name>:latest <account-id>.dkr.ecr.<region>.amazonaws.com/<repository-name>:latest
```

4. イメージをプッシュ:

```bash
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/<repository-name>:latest
```

## 便利なコマンド

- `npm run build` - TypeScriptをJavaScriptにコンパイル
- `npm run watch` - ファイルの変更を監視して自動コンパイル
- `npm run test` - ユニットテストを実行
- `npm run lint` - ESLintでコードをチェック
- `npm run lint:fix` - ESLintでコードを自動修正
- `npm run format` - Prettierでコードをフォーマット
- `npm run format:check` - フォーマットのチェックのみ実行
- `cdk diff` - デプロイされたスタックとの差分を表示
- `cdk synth` - CloudFormationテンプレートを生成
- `cdk destroy` - スタックを削除

## 開発環境

このプロジェクトは以下の開発ツールが設定されています：

### ESLint & Prettier

- **ESLint**: TypeScriptのコード品質をチェック
- **Prettier**: コードの自動フォーマット
- **Format on Save**: VSCodeで保存時に自動フォーマット

### VSCode設定

`.vscode/settings.json`に以下の設定が含まれています：

- 保存時の自動フォーマット
- ESLintの自動修正
- 推奨拡張機能の提案

### 推奨VSCode拡張機能

- ESLint
- Prettier - Code formatter
- TypeScript compiler
- AWS Toolkit

## カスタマイズ

### 新しい環境の追加

`lib/config/environment-config.ts` に新しい環境設定を追加：

```typescript
staging: {
  envName: 'staging',
  vpc: {
    cidr: '10.2.0.0/16',
    maxAzs: 2,
  },
  // ... その他の設定
}
```

### Auto Scalingの追加

ECS Serviceにオートスケーリングを追加する場合は、`lib/construct/compute/ecs-service-construct.ts` を拡張：

```typescript
const scaling = this.service.autoScaleTaskCount({
  minCapacity: 1,
  maxCapacity: 10,
});

scaling.scaleOnCpuUtilization('CpuScaling', {
  targetUtilizationPercent: 70,
});
```

## トラブルシューティング

### デプロイエラー

- AWS認証情報が正しく設定されているか確認
- `cdk bootstrap` を実行してCDKツールキットスタックを作成

### ECSタスクが起動しない

- ECRリポジトリにイメージがプッシュされているか確認
- CloudWatch Logsでタスクのログを確認
- タスク定義のCPU/メモリ設定が適切か確認

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。

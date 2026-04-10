# docs/deployment.md 模板

> 适用于需要部署的项目

---

## 模板结构

```markdown
# 部署指南

> 最后更新：YYYY-MM-DD
> 作者：[名字]

## 1. 环境概述

| 环境 | 用途 | 访问地址 |
|------|------|----------|
| local | 本地开发 | http://localhost:3000 |
| staging | 预发布测试 | https://staging.example.com |
| production | 正式环境 | https://example.com |

## 2. 环境配置

### 2.1 环境变量
```bash
# .env.local 示例
NODE_ENV=development
DATABASE_URL=postgresql://localhost:5432/myapp
REDIS_URL=redis://localhost:6379
API_KEY=your_api_key_here
```

### 2.2 敏感信息管理
- 所有秘钥通过环境变量注入
- 禁止硬编码秘钥
- `.env` 文件不提交版本控制
- 使用秘钥管理服务（AWS Secrets Manager / Vault）

## 3. 部署流程

### 3.1 构建
```bash
# 安装依赖
npm install

# 类型检查
npm run type-check

# 构建
npm run build
```

### 3.2 部署命令
```bash
# Docker 部署
docker build -t myapp:latest .
docker run -d -p 3000:3000 myapp:latest

# Kubernetes 部署
kubectl apply -f k8s/
```

## 4. CI/CD 流程

### 4.1 GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test
      - run: npm run build
      - run: npm run deploy
```

### 4.2 部署阶段
```
代码提交 → Lint & Test → Build → 部署 Staging → 人工确认 → 部署 Production
```

## 5. 监控与告警

### 5.1 健康检查
- `/health` 端点：服务健康状态
- `/metrics` 端点：Prometheus 指标

### 5.2 告警规则
| 告警 | 阈值 | 动作 |
|------|------|------|
| CPU 使用率 | > 80% | 扩容 |
| 内存使用率 | > 85% | 扩容 |
| 错误率 | > 1% | 通知 on-call |
| 响应延迟 P99 | > 500ms | 分析优化 |

## 6. 回滚流程

### 6.1 回滚命令
```bash
# Docker 回滚
docker pull myapp:previous-version
docker stop myapp && docker run myapp:previous-version

# Kubernetes 回滚
kubectl rollout undo deployment/myapp
```

### 6.2 回滚标准
- 新版本部署后 5 分钟内错误率上升 > 5%
- 核心功能不可用
- P99 延迟持续 > 2s
```

---

## 适用范围

本模板适用于需要部署的项目。如项目仅本地运行，跳过此文档。

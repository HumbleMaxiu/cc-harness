# docs/api.md 模板

> 适用于有 HTTP API / RPC / GraphQL 接口的项目

---

## 模板结构

```markdown
# API 参考

> 最后更新：YYYY-MM-DD
> 作者：[名字]

## 1. API 设计原则

### 1.1 REST 约定
- URL 使用复数名词：`/users` 而非 `/user`
- 使用正确的 HTTP 方法
- 返回标准响应格式

### 1.2 版本控制
- 使用 URL 路径版本：`/api/v1/users`
- 主版本不兼容时升级版本号

## 2. 端点

### 2.1 [资源名称]

**端点**: `GET /api/v1/[resources]`

**描述**: [获取资源列表]

**Query 参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认 1 |
| limit | int | 否 | 每页数量，默认 20 |
| sort | string | 否 | 排序字段 |

**响应**:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Example",
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

**错误响应**:
| 状态码 | 说明 |
|--------|------|
| 400 | 参数错误 |
| 401 | 未认证 |
| 403 | 无权限 |
| 500 | 服务器错误 |

## 3. 认证

### 3.1 认证方式
[Bearer Token / JWT / API Key / OAuth 2.0]

### 3.2 请求头
```
Authorization: Bearer <token>
```

## 4. 错误处理

### 4.1 错误响应格式
```json
{
  "data": null,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User with ID xyz not found",
    "details": {}
  }
}
```

### 4.2 标准错误码
| 码 | HTTP 状态 | 说明 |
|----|-----------|------|
| VALIDATION_ERROR | 400 | 输入验证失败 |
| UNAUTHORIZED | 401 | 未认证 |
| FORBIDDEN | 403 | 无权限 |
| NOT_FOUND | 404 | 资源不存在 |
| CONFLICT | 409 | 资源冲突 |
| INTERNAL_ERROR | 500 | 服务器错误 |
```

---

## 适用范围

本模板仅适用于有外部 API 接口的项目。如项目无 API 层，跳过此文档。

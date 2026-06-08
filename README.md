# React + Python FastAPI 全栈新闻聚合系统

一个功能完整的新闻聚合平台，支持 RSS/Atom/JSON Feed 订阅、定时抓取、全文检索、评论点赞互动等功能。

## 功能特性

### 核心功能
- **订阅源管理**：支持 RSS / Atom / JSON Feed 链接，用户自定义抓取规则（CSS 选择器）
- **定时抓取**：每 30 分钟自动拉取订阅源（APScheduler + httpx）
- **智能去重**：基于 URL + 内容 Hash，使用 SimHash 处理转载文章
- **全文检索**：SQLite FTS5 + jieba 中文分词，支持标题、摘要、正文搜索
- **自动标签**：基于 jieba 关键词提取，用户也可手动打标
- **树形评论**：最多 3 层嵌套评论，支持 @和点赞
- **互动功能**：文章点赞、收藏、稍后读、阅读历史
- **反爬策略**：UA 伪装、随机延迟、失败重试、被封自动冷却
- **消息推送**：站内通知、邮件摘要（攒满 10 篇发送）

### 反爬策略
- 随机 User-Agent 伪装（7+ 种浏览器 UA）
- 请求间隔随机 1-3 秒
- 失败重试 3 次，指数退避
- 连续失败 5 次自动冷却 1 小时
- 请求超时 10 秒

## 技术栈

### 后端
- **框架**：FastAPI (Python)
- **数据库**：SQLite + SQLAlchemy ORM
- **搜索**：SQLite FTS5 + jieba 中文分词
- **爬虫**：feedparser + readability-lxml + httpx
- **调度**：APScheduler
- **认证**：JWT (python-jose) + bcrypt
- **去重**：SimHash

### 前端
- **框架**：React 18
- **构建工具**：Vite
- **路由**：React Router v6
- **HTTP 客户端**：Axios
- **图标**：Lucide React
- **时间处理**：Day.js

## 项目结构

```
5267-react-news/
├── backend/                    # 后端 FastAPI 项目
│   ├── app/
│   │   ├── api/                # API 路由层
│   │   │   ├── auth.py         # 认证接口
│   │   │   ├── sources.py      # 订阅源接口
│   │   │   ├── articles.py     # 文章接口
│   │   │   ├── comments.py     # 评论接口
│   │   │   ├── search.py       # 搜索接口
│   │   │   ├── users.py        # 用户中心接口
│   │   │   └── admin.py        # 管理员接口
│   │   ├── models/             # 数据库模型
│   │   ├── schemas/            # Pydantic 数据模型
│   │   ├── crawler/            # 爬虫模块
│   │   │   ├── scheduler.py    # 定时调度器
│   │   │   ├── feed_parser.py  # RSS/HTML 解析
│   │   │   └── polite_request.py  # 反爬请求封装
│   │   ├── search/             # 全文检索模块
│   │   ├── notify/             # 通知模块
│   │   ├── core/               # 核心工具
│   │   │   └── security.py     # 安全认证
│   │   ├── config.py           # 配置管理
│   │   ├── database.py         # 数据库连接
│   │   └── main.py             # 应用入口
│   ├── requirements.txt        # Python 依赖
│   └── .env.example            # 环境变量示例
├── frontend/                   # 前端 React 项目
│   ├── src/
│   │   ├── pages/              # 页面组件
│   │   │   ├── FeedPage.jsx    # 首页信息流
│   │   │   ├── ArticlePage.jsx # 文章详情页
│   │   │   ├── SearchPage.jsx  # 搜索页
│   │   │   ├── SourcesPage.jsx # 订阅源管理
│   │   │   ├── FavoritesPage.jsx  # 收藏页
│   │   │   ├── ReadLaterPage.jsx  # 稍后读页
│   │   │   ├── ProfilePage.jsx # 个人中心
│   │   │   ├── SettingsPage.jsx   # 设置页
│   │   │   ├── LoginPage.jsx   # 登录页
│   │   │   └── RegisterPage.jsx   # 注册页
│   │   ├── components/         # 通用组件
│   │   │   ├── Navbar.jsx      # 导航栏
│   │   │   ├── ArticleCard.jsx # 文章卡片
│   │   │   ├── CommentTree.jsx # 评论树
│   │   │   └── SourceBadge.jsx # 订阅源徽章
│   │   ├── hooks/              # 自定义 Hooks
│   │   │   ├── useInfiniteScroll.js
│   │   │   └── useDebounce.js
│   │   ├── context/            # React Context
│   │   │   └── AuthContext.jsx # 认证上下文
│   │   ├── api/                # API 客户端
│   │   │   └── client.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
├── start-backend.bat           # Windows 后端启动脚本
└── start-frontend.bat          # Windows 前端启动脚本
```

## 快速开始

### 前置要求
- Python 3.9+
- Node.js 16+
- npm 或 yarn

### 方式一：使用启动脚本（Windows）

1. **启动后端**
   ```bash
   start-backend.bat
   ```
   后端服务将在 http://localhost:8000 启动

2. **启动前端**（另开一个终端）
   ```bash
   start-frontend.bat
   ```
   前端服务将在 http://localhost:3000 启动

### 方式二：手动启动

#### 后端启动
```bash
cd backend

# 创建虚拟环境
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# 安装依赖
pip install -r requirements.txt

# 复制环境变量
copy .env.example .env  # Windows
# cp .env.example .env  # Linux/Mac

# 启动服务
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 前端启动
```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 访问地址
- 前端页面：http://localhost:3000
- 后端 API：http://localhost:8000
- API 文档：http://localhost:8000/docs

## API 接口

### 认证
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户

### 订阅源
- `GET /api/sources` - 获取订阅源列表
- `GET /api/sources/{id}` - 获取订阅源详情
- `POST /api/sources` - 创建订阅源
- `PUT /api/sources/{id}` - 更新订阅源
- `DELETE /api/sources/{id}` - 删除订阅源
- `POST /api/sources/{id}/subscribe` - 订阅源
- `DELETE /api/sources/{id}/subscribe` - 取消订阅

### 文章
- `GET /api/articles` - 获取文章列表
- `GET /api/articles/{id}` - 获取文章详情
- `POST /api/articles/{id}/like` - 点赞/取消点赞
- `POST /api/articles/{id}/favorite` - 收藏/取消收藏
- `POST /api/articles/{id}/read-later` - 稍后读/取消

### 评论
- `GET /api/comments/article/{article_id}` - 获取文章评论
- `POST /api/comments/article/{article_id}` - 发表评论
- `POST /api/comments/{id}/like` - 评论点赞
- `DELETE /api/comments/{id}` - 删除评论

### 搜索
- `GET /api/search` - 搜索文章
- `GET /api/search/suggest` - 搜索建议

### 用户中心
- `GET /api/user/favorites` - 我的收藏
- `GET /api/user/read-later` - 稍后读列表
- `GET /api/user/read-history` - 阅读历史
- `GET /api/user/subscriptions` - 我的订阅
- `GET /api/user/notifications` - 通知列表
- `GET /api/user/stats` - 用户统计

### 管理后台
- `GET /api/admin/sources` - 所有订阅源
- `GET /api/admin/stats` - 系统统计
- `POST /api/admin/sources/{id}/crawl` - 手动抓取
- `POST /api/admin/sources/crawl-all` - 全部抓取

## 数据库模型

### 核心表
- `users` - 用户表
- `sources` - 订阅源表
- `subscriptions` - 订阅关系表
- `articles` - 文章表
- `article_tags` - 文章标签表
- `comments` - 评论表（树形结构，物化路径）
- `article_likes` - 文章点赞表
- `comment_likes` - 评论点赞表
- `favorites` - 收藏表
- `read_history` - 阅读历史表
- `read_later` - 稍后读表
- `notifications` - 通知表
- `crawl_logs` - 抓取日志表
- `article_fts` - FTS5 全文检索虚拟表

## 设计要点

### 爬虫设计
- 单实例 APScheduler，避免重复抓取
- 礼貌爬取：随机 UA + 随机延迟 + 失败冷却
- 内容去重：URL 精确去重 + SimHash 相似度去重
- 正文提取：readability-lxml + 自定义 CSS 选择器

### 评论系统
- 物化路径（path 字段）存储层级关系
- 最多 3 层评论，避免过深嵌套
- 删除评论使用软删除（is_deleted 字段）

### 全文检索
- 使用 SQLite FTS5，轻量无需额外服务
- jieba 中文分词预处理，提升搜索准确度
- 支持标题、摘要、正文多字段搜索
- 搜索结果高亮显示

### 认证安全
- JWT Token 认证
- bcrypt 密码哈希
- CORS 跨域支持
- 请求拦截器自动处理 401 未授权

## 学习路径

这个项目非常适合学习全栈开发，建议按以下顺序学习：

1. **数据库设计**：理解 `backend/app/models/__init__.py` 中的表结构和关系
2. **API 开发**：从 `backend/app/api/auth.py` 开始，学习 FastAPI 路由开发
3. **爬虫入门**：阅读 `backend/app/crawler/` 目录，了解 RSS 解析和反爬策略
4. **搜索原理**：研究 `backend/app/search/` 中的 FTS5 全文检索实现
5. **前端基础**：从 `frontend/src/pages/LoginPage.jsx` 开始，学习 React 组件开发
6. **状态管理**：理解 `AuthContext.jsx` 中的 Context 模式
7. **性能优化**：学习 `useInfiniteScroll`、`useDebounce` 等自定义 Hook

## 扩展建议

- 使用 MeiliSearch 或 Elasticsearch 替换 SQLite FTS5
- 使用 Redis 做缓存和消息队列
- 添加 WebSocket 实时推送
- 支持更多订阅类型（公众号、Twitter 等）
- 添加推荐算法（基于阅读历史和标签）
- 支持 RSSHub 集成
- 添加移动端适配（或 React Native）
- 使用 Docker 容器化部署

## 注意事项

1. **反爬合规**：请遵守目标网站的 robots.txt 和服务条款，不要抓取禁止爬取的内容
2. **礼貌爬取**：默认配置已经比较保守，建议不要调得太激进
3. **数据安全**：生产环境请修改 SECRET_KEY，使用强密码
4. **性能考虑**：数据量大时建议迁移到 PostgreSQL + MeiliSearch

## License

MIT

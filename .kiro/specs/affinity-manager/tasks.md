# 实现计划：好感度管理系统

## 概述

按照后端优先、前端跟进的顺序实现好感度管理系统。先搭建后台服务核心（数据库、业务逻辑、API），再构建 React Native 移动端 App（状态管理、页面组件、交互逻辑），最后完成前后端集成联调。

## 任务

- [x] 1. 搭建项目结构与基础配置
  - [x] 1.1 初始化后端项目结构
    - 创建 `server/` 目录，初始化 Node.js + TypeScript 项目
    - 安装依赖：express, better-sqlite3, zod, uuid
    - 安装开发依赖：vitest, fast-check, @types/express, @types/better-sqlite3, tsx
    - 配置 `tsconfig.json` 和 `package.json` 脚本
    - _需求：6.1, 6.4_

  - [x] 1.2 初始化移动端项目结构
    - 创建 React Native 项目（使用 Expo 或 React Native CLI）
    - 安装依赖：zustand, axios, react-navigation
    - 配置 TypeScript 和基础导航结构
    - _需求：5.1_

  - [x] 1.3 定义共享类型
    - 创建 `server/src/types.ts`，定义 Character、AffinityEvent、请求/响应接口
    - 创建 `app/src/types.ts`，定义前端使用的相同类型
    - _需求：1.1, 4.4_

- [x] 2. 实现数据库层
  - [x] 2.1 实现数据库初始化与连接管理
    - 创建 `server/src/database.ts`
    - 实现 SQLite 数据库连接、表创建（characters 表和 affinity_events 表）
    - 包含 CHECK 约束（affinity >= -100 AND affinity <= 100）
    - 创建索引 `idx_events_character`
    - 启用外键约束和 WAL 模式
    - _需求：6.4_

- [x] 3. 实现后端业务逻辑层
  - [x] 3.1 实现人物业务逻辑 characterService
    - 创建 `server/src/services/characterService.ts`
    - 实现创建人物（好感度初始为 0）、查询人物详情、更新人物信息、删除人物（级联删除事件）、获取人物列表（按好感度降序排序）
    - 姓名非空校验（拒绝空字符串和纯空白字符串）
    - _需求：1.2, 1.3, 2.3, 2.6, 5.3_

  - [x] 3.2 实现好感度业务逻辑 affinityService
    - 创建 `server/src/services/affinityService.ts`
    - 实现 `clampAffinity` 函数：`Math.max(-100, Math.min(100, current + delta))`
    - 实现好感度调整逻辑：校验变化量、计算钳制后数值、更新人物好感度、创建事件记录
    - 实现获取人物好感度事件列表（按时间倒序）
    - _需求：3.1, 3.2, 3.4, 3.6, 4.2, 4.3_

  - [ ]* 3.3 编写属性测试：好感度钳制不变量
    - **属性 5：好感度钳制不变量**
    - 使用 fast-check 生成随机当前值（-100 到 100）和任意 delta，验证 clampAffinity 结果等于 `clamp(current + delta, -100, 100)` 且始终在 [-100, 100] 范围内
    - **验证需求：3.1, 3.2, 3.4, 3.6**

  - [ ]* 3.4 编写属性测试：自定义变化量输入校验
    - **属性 6：自定义变化量输入校验**
    - 使用 fast-check 生成非 1-100 整数的输入值（负数、零、小数、超过 100），验证系统拒绝该输入
    - **验证需求：3.3**

- [x] 4. 实现后端 API 层
  - [x] 4.1 实现人物相关 API 路由与控制器
    - 创建 `server/src/controllers/characterController.ts`
    - 创建 `server/src/routes/characterRoutes.ts`
    - 实现 GET `/api/characters`、POST `/api/characters`、GET `/api/characters/:id`、PUT `/api/characters/:id`、DELETE `/api/characters/:id`
    - 使用 Zod 进行请求参数校验
    - 实现错误处理中间件，返回规范的错误响应格式
    - _需求：1.1, 1.2, 1.3, 2.3, 2.6, 6.1_

  - [x] 4.2 实现好感度相关 API 路由与控制器
    - 创建 `server/src/controllers/affinityController.ts`
    - 创建 `server/src/routes/affinityRoutes.ts`
    - 实现 POST `/api/characters/:id/affinity`、GET `/api/characters/:id/events`
    - 校验变化量为 1-100 之间的整数（delta 可为正负，绝对值在范围内）
    - _需求：3.1, 3.2, 3.3, 3.6, 4.2, 4.3, 6.1_

  - [x] 4.3 创建 Express 应用入口
    - 创建 `server/src/app.ts`（Express 应用配置，挂载路由、错误处理中间件）
    - 创建 `server/src/index.ts`（启动服务器）
    - _需求：6.1, 6.2_

  - [ ]* 4.4 编写属性测试：人物创建初始好感度为零
    - **属性 1：人物创建初始好感度为零**
    - 使用 fast-check 生成随机有效姓名，通过 API 创建人物后验证返回的 affinity 为 0
    - **验证需求：1.2**

  - [ ]* 4.5 编写属性测试：空白姓名拒绝
    - **属性 2：空白姓名拒绝**
    - 使用 fast-check 生成随机空白字符串（空字符串、纯空格、制表符等），验证 API 返回 400 错误
    - **验证需求：1.3**

  - [ ]* 4.6 编写属性测试：人物信息更新 round-trip
    - **属性 3：人物信息更新 round-trip**
    - 使用 fast-check 生成随机更新数据，更新人物后查询验证数据一致
    - **验证需求：2.3**

  - [ ]* 4.7 编写属性测试：删除人物级联清除事件
    - **属性 4：删除人物级联清除事件**
    - 使用 fast-check 生成随机人物和事件，删除人物后验证人物和事件均不存在
    - **验证需求：2.6**

  - [ ]* 4.8 编写属性测试：好感度事件记录完整性
    - **属性 7：好感度事件记录完整性**
    - 使用 fast-check 生成随机调整操作，验证事件记录包含所有必要字段且 affinityAfter 等于实际好感度
    - **验证需求：4.2, 4.4**

  - [ ]* 4.9 编写属性测试：事件列表时间倒序
    - **属性 8：事件列表时间倒序**
    - 使用 fast-check 生成多次随机调整，验证事件列表按时间从新到旧排序
    - **验证需求：4.3**

  - [ ]* 4.10 编写属性测试：人物列表好感度降序
    - **属性 9：人物列表好感度降序**
    - 使用 fast-check 创建多个随机人物并调整好感度，验证列表按好感度降序排列
    - **验证需求：5.3**

- [x] 5. 检查点 - 后端服务验证
  - 确保所有后端测试通过，如有问题请向用户确认。

- [x] 6. 实现 App 状态管理层
  - [x] 6.1 实现 API 客户端
    - 创建 `app/src/api/client.ts`
    - 使用 Axios 封装所有后台 API 调用（人物 CRUD、好感度调整、事件查询）
    - 配置请求超时（3 秒）、错误拦截器
    - 实现网络异常时的自动重试逻辑
    - _需求：6.2, 6.3_

  - [x] 6.2 实现 Zustand 状态管理 Store
    - 创建 `app/src/store/characterStore.ts`
    - 管理人物列表、当前人物详情、事件列表、加载状态、错误状态
    - 实现 fetchCharacters、createCharacter、updateCharacter、deleteCharacter、adjustAffinity、fetchEvents 等 action
    - _需求：5.1, 5.5, 6.5_

- [x] 7. 实现 App 页面与组件
  - [x] 7.1 实现人物列表页 CharacterListScreen
    - 使用 FlatList 展示人物列表（头像、姓名、好感度数值）
    - 实现下拉刷新功能
    - 实现长按人物弹出删除确认对话框
    - 实现空列表引导提示
    - 点击人物跳转详情页，点击新建按钮跳转创建页
    - _需求：5.1, 5.2, 5.3, 5.4, 5.5, 2.1, 2.5_

  - [x] 7.2 实现人物创建页 CharacterCreateScreen
    - 创建表单：姓名（必填）、头像（选填）、备注（选填）
    - 实现姓名非空前端校验，显示"姓名不能为空"错误提示
    - 创建成功后返回列表页并刷新
    - 创建失败显示包含失败原因的错误提示
    - _需求：1.1, 1.3, 1.4, 1.5_

  - [x] 7.3 实现人物详情页 CharacterDetailScreen
    - 展示人物完整信息和当前好感度
    - 集成 AffinityControl 组件和 EventList 组件
    - 提供编辑按钮跳转编辑页
    - _需求：2.1, 2.2_

  - [x] 7.4 实现人物编辑页 CharacterEditScreen
    - 预填充当前人物信息的编辑表单
    - 提交更新请求，成功后返回详情页
    - 更新失败显示错误提示并保留编辑内容
    - _需求：2.2, 2.3, 2.4_

  - [x] 7.5 实现好感度控制组件 AffinityControl
    - 实现 +1/-1 按钮，点击立即调整好感度
    - 实现长按弹出自定义数值输入框，校验输入为 1-100 整数
    - 好感度变化后弹出事件描述输入框（选填）
    - 调整后立即更新界面显示
    - _需求：3.1, 3.2, 3.3, 3.4, 3.5, 4.1_

  - [x] 7.6 实现事件列表组件 EventList
    - 按时间倒序展示好感度事件列表
    - 展示每条事件的变化值、变化后数值、原因描述和时间
    - 事件保存失败时显示错误提示和重试按钮
    - _需求：4.2, 4.3, 4.4, 4.5_

- [x] 8. 实现导航与 App 入口
  - [x] 8.1 配置 React Navigation 路由
    - 设置 Stack Navigator，注册所有页面
    - 配置人物列表页为首页
    - _需求：5.1_

  - [x] 8.2 实现 App 启动数据加载
    - App 启动时自动从后台拉取最新人物列表
    - 网络异常时显示提示信息
    - _需求：6.5, 6.3_

- [x] 9. 检查点 - 全功能验证
  - 确保所有测试通过，如有问题请向用户确认。

## 备注

- 标记 `*` 的任务为可选任务，可跳过以加快 MVP 进度
- 每个任务均引用了对应的需求编号，确保需求可追溯
- 检查点用于阶段性验证，确保增量开发的正确性
- 属性测试验证通用正确性属性，单元测试验证具体示例和边界情况

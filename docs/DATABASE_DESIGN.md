# Web IM聊天系统数据库设计

## 目录
1. [设计原则](#设计原则)
2. [表结构设计](#表结构设计)
3. [索引设计说明](#索引设计说明)
4. [分表分库策略](#分表分库策略)
5. [完整SQL脚本](#完整sql脚本)

---

## 设计原则

### 高并发优化策略
1. **消息表分表**: 私聊消息和群消息按月分表，支持千万级数据
2. **索引优化**: 合理设计索引，避免全表扫描
3. **字段精简**: 只保留必要字段，减少存储空间
4. **适当冗余**: 在查询频繁的地方适当冗余数据
5. **读写分离**: 支持MySQL主从复制架构

### 数据类型选择
- 主键使用 `BIGINT` 支持大数据量
- 时间使用 `TIMESTAMP` 或 `BIGINT`（毫秒时间戳）
- 状态使用 `TINYINT` 或 `ENUM`
- 文本内容使用 `TEXT` 或 `VARCHAR`

---

## 表结构设计

### 1. 用户表 (user)

**用途**: 存储用户基本信息

**字段说明**:
- `id`: 用户唯一标识，主键，自增
- `username`: 用户名，唯一，用于登录
- `email`: 邮箱，唯一，用于找回密码
- `password_hash`: 密码哈希值（bcrypt加密）
- `nickname`: 昵称，用于显示
- `avatar`: 头像URL
- `gender`: 性别 (0:未知, 1:男, 2:女)
- `birthday`: 生日
- `phone`: 手机号
- `signature`: 个性签名
- `status`: 账号状态 (0:正常, 1:禁用, 2:注销)
- `created_at`: 创建时间
- `updated_at`: 更新时间
- `last_login_at`: 最后登录时间

**索引设计**:
- PRIMARY KEY: `id`
- UNIQUE KEY: `username`, `email`
- INDEX: `phone`, `status`, `created_at`

```sql
CREATE TABLE `user` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username` VARCHAR(50) NOT NULL COMMENT '用户名',
  `email` VARCHAR(100) NOT NULL COMMENT '邮箱',
  `password_hash` VARCHAR(255) NOT NULL COMMENT '密码哈希',
  `nickname` VARCHAR(50) DEFAULT NULL COMMENT '昵称',
  `avatar` VARCHAR(500) DEFAULT NULL COMMENT '头像URL',
  `gender` TINYINT DEFAULT 0 COMMENT '性别 0:未知 1:男 2:女',
  `birthday` DATE DEFAULT NULL COMMENT '生日',
  `phone` VARCHAR(20) DEFAULT NULL COMMENT '手机号',
  `signature` VARCHAR(200) DEFAULT NULL COMMENT '个性签名',
  `status` TINYINT DEFAULT 0 COMMENT '状态 0:正常 1:禁用 2:注销',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `last_login_at` TIMESTAMP NULL DEFAULT NULL COMMENT '最后登录时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  UNIQUE KEY `uk_email` (`email`),
  KEY `idx_phone` (`phone`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';
```

---

### 2. 好友表 (friend)

**用途**: 存储好友关系（双向关系，A加B为好友需要两条记录）

**字段说明**:
- `id`: 关系ID，主键
- `user_id`: 用户ID
- `friend_id`: 好友ID
- `remark`: 好友备注
- `group_name`: 分组名称
- `status`: 关系状态 (0:正常, 1:拉黑)
- `created_at`: 添加时间

**索引设计**:
- PRIMARY KEY: `id`
- UNIQUE KEY: `user_id + friend_id` (防止重复添加)
- INDEX: `user_id`, `friend_id`, `status`

```sql
CREATE TABLE `friend` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '关系ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `friend_id` BIGINT UNSIGNED NOT NULL COMMENT '好友ID',
  `remark` VARCHAR(50) DEFAULT NULL COMMENT '好友备注',
  `group_name` VARCHAR(50) DEFAULT '我的好友' COMMENT '分组名称',
  `status` TINYINT DEFAULT 0 COMMENT '状态 0:正常 1:拉黑',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '添加时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_friend` (`user_id`, `friend_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_friend_id` (`friend_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='好友关系表';
```

---

### 3. 好友申请表 (friend_request)

**用途**: 存储好友申请记录

**字段说明**:
- `id`: 申请ID，主键
- `from_user_id`: 申请人ID
- `to_user_id`: 被申请人ID
- `message`: 申请消息
- `status`: 申请状态 (0:待处理, 1:已同意, 2:已拒绝, 3:已过期)
- `created_at`: 申请时间
- `updated_at`: 处理时间

**索引设计**:
- PRIMARY KEY: `id`
- INDEX: `from_user_id`, `to_user_id`, `status`, `created_at`

```sql
CREATE TABLE `friend_request` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '申请ID',
  `from_user_id` BIGINT UNSIGNED NOT NULL COMMENT '申请人ID',
  `to_user_id` BIGINT UNSIGNED NOT NULL COMMENT '被申请人ID',
  `message` VARCHAR(200) DEFAULT NULL COMMENT '申请消息',
  `status` TINYINT DEFAULT 0 COMMENT '状态 0:待处理 1:已同意 2:已拒绝 3:已过期',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '申请时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '处理时间',
  PRIMARY KEY (`id`),
  KEY `idx_from_user` (`from_user_id`),
  KEY `idx_to_user` (`to_user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='好友申请表';
```

---

### 4. 私聊消息表 (chat_message_YYYYMM)

**用途**: 存储私聊消息（按月分表）

**字段说明**:
- `id`: 消息ID，主键（使用雪花算法生成，保证全局唯一）
- `from_user_id`: 发送者ID
- `to_user_id`: 接收者ID
- `content`: 消息内容
- `msg_type`: 消息类型 (1:文本, 2:图片, 3:语音, 4:视频, 5:文件, 6:位置, 99:系统消息)
- `file_url`: 文件URL（图片、语音、视频、文件）
- `file_size`: 文件大小（字节）
- `duration`: 时长（语音、视频，单位秒）
- `is_read`: 是否已读 (0:未读, 1:已读)
- `is_recalled`: 是否撤回 (0:正常, 1:已撤回)
- `created_at`: 发送时间（毫秒时间戳）

**索引设计**:
- PRIMARY KEY: `id`
- INDEX: `from_user_id + created_at` (查询发送记录)
- INDEX: `to_user_id + created_at` (查询接收记录)
- INDEX: `from_user_id + to_user_id + created_at` (查询会话消息，最重要)
- INDEX: `is_read` (查询未读消息)

**分表策略**: 按月分表，表名格式 `chat_message_202601`, `chat_message_202602`

```sql
CREATE TABLE `chat_message_202601` (
  `id` BIGINT UNSIGNED NOT NULL COMMENT '消息ID（雪花算法）',
  `from_user_id` BIGINT UNSIGNED NOT NULL COMMENT '发送者ID',
  `to_user_id` BIGINT UNSIGNED NOT NULL COMMENT '接收者ID',
  `content` TEXT NOT NULL COMMENT '消息内容',
  `msg_type` TINYINT NOT NULL DEFAULT 1 COMMENT '消息类型 1:文本 2:图片 3:语音 4:视频 5:文件 6:位置 99:系统',
  `file_url` VARCHAR(500) DEFAULT NULL COMMENT '文件URL',
  `file_size` INT DEFAULT NULL COMMENT '文件大小（字节）',
  `duration` INT DEFAULT NULL COMMENT '时长（秒）',
  `is_read` TINYINT DEFAULT 0 COMMENT '是否已读 0:未读 1:已读',
  `is_recalled` TINYINT DEFAULT 0 COMMENT '是否撤回 0:正常 1:已撤回',
  `created_at` BIGINT UNSIGNED NOT NULL COMMENT '发送时间（毫秒时间戳）',
  PRIMARY KEY (`id`),
  KEY `idx_from_created` (`from_user_id`, `created_at`),
  KEY `idx_to_created` (`to_user_id`, `created_at`),
  KEY `idx_conversation` (`from_user_id`, `to_user_id`, `created_at`),
  KEY `idx_is_read` (`is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='私聊消息表-2026年1月';
```

---

### 5. 群组表 (group)

**用途**: 存储群组基本信息

**字段说明**:
- `id`: 群组ID，主键
- `group_name`: 群名称
- `avatar`: 群头像
- `description`: 群简介
- `owner_id`: 群主ID
- `max_members`: 最大成员数
- `member_count`: 当前成员数（冗余字段，提高查询效率）
- `status`: 群状态 (0:正常, 1:解散)
- `created_at`: 创建时间
- `updated_at`: 更新时间

**索引设计**:
- PRIMARY KEY: `id`
- INDEX: `owner_id`, `status`, `created_at`

```sql
CREATE TABLE `group` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '群组ID',
  `group_name` VARCHAR(100) NOT NULL COMMENT '群名称',
  `avatar` VARCHAR(500) DEFAULT NULL COMMENT '群头像',
  `description` VARCHAR(500) DEFAULT NULL COMMENT '群简介',
  `owner_id` BIGINT UNSIGNED NOT NULL COMMENT '群主ID',
  `max_members` INT DEFAULT 500 COMMENT '最大成员数',
  `member_count` INT DEFAULT 0 COMMENT '当前成员数',
  `status` TINYINT DEFAULT 0 COMMENT '状态 0:正常 1:解散',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_owner_id` (`owner_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='群组表';
```

---

### 6. 群成员表 (group_member)

**用途**: 存储群成员关系

**字段说明**:
- `id`: 记录ID，主键
- `group_id`: 群组ID
- `user_id`: 用户ID
- `role`: 角色 (1:群主, 2:管理员, 3:普通成员)
- `nickname`: 群昵称
- `mute_end_time`: 禁言结束时间
- `joined_at`: 加入时间

**索引设计**:
- PRIMARY KEY: `id`
- UNIQUE KEY: `group_id + user_id` (防止重复加入)
- INDEX: `group_id`, `user_id`, `role`

```sql
CREATE TABLE `group_member` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `group_id` BIGINT UNSIGNED NOT NULL COMMENT '群组ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `role` TINYINT DEFAULT 3 COMMENT '角色 1:群主 2:管理员 3:普通成员',
  `nickname` VARCHAR(50) DEFAULT NULL COMMENT '群昵称',
  `mute_end_time` TIMESTAMP NULL DEFAULT NULL COMMENT '禁言结束时间',
  `joined_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_group_user` (`group_id`, `user_id`),
  KEY `idx_group_id` (`group_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='群成员表';
```

---

### 7. 群消息表 (group_message_YYYYMM)

**用途**: 存储群聊消息（按月分表）

**字段说明**:
- `id`: 消息ID，主键（雪花算法）
- `group_id`: 群组ID
- `user_id`: 发送者ID
- `content`: 消息内容
- `msg_type`: 消息类型
- `file_url`: 文件URL
- `file_size`: 文件大小
- `duration`: 时长
- `at_users`: @的用户ID列表（JSON数组）
- `is_recalled`: 是否撤回
- `created_at`: 发送时间（毫秒时间戳）

**索引设计**:
- PRIMARY KEY: `id`
- INDEX: `group_id + created_at` (查询群消息，支持分页)
- INDEX: `user_id + created_at` (查询用户发送记录)

**分表策略**: 按月分表

```sql
CREATE TABLE `group_message_202601` (
  `id` BIGINT UNSIGNED NOT NULL COMMENT '消息ID（雪花算法）',
  `group_id` BIGINT UNSIGNED NOT NULL COMMENT '群组ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '发送者ID',
  `content` TEXT NOT NULL COMMENT '消息内容',
  `msg_type` TINYINT NOT NULL DEFAULT 1 COMMENT '消息类型 1:文本 2:图片 3:语音 4:视频 5:文件 6:位置 99:系统',
  `file_url` VARCHAR(500) DEFAULT NULL COMMENT '文件URL',
  `file_size` INT DEFAULT NULL COMMENT '文件大小（字节）',
  `duration` INT DEFAULT NULL COMMENT '时长（秒）',
  `at_users` JSON DEFAULT NULL COMMENT '@的用户ID列表',
  `is_recalled` TINYINT DEFAULT 0 COMMENT '是否撤回 0:正常 1:已撤回',
  `created_at` BIGINT UNSIGNED NOT NULL COMMENT '发送时间（毫秒时间戳）',
  PRIMARY KEY (`id`),
  KEY `idx_group_created` (`group_id`, `created_at`),
  KEY `idx_user_created` (`user_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='群消息表-2026年1月';
```

---

### 8. 在线状态表 (online_status)

**用途**: 存储用户在线状态（可选，也可以只用Redis）

**字段说明**:
- `user_id`: 用户ID，主键
- `status`: 在线状态 (1:在线, 2:离线, 3:忙碌, 4:离开)
- `device_type`: 设备类型 (1:Web, 2:iOS, 3:Android, 4:PC)
- `last_active_at`: 最后活跃时间
- `updated_at`: 更新时间

**索引设计**:
- PRIMARY KEY: `user_id`
- INDEX: `status`, `last_active_at`

**说明**: 此表可选，建议主要使用Redis存储在线状态，MySQL作为备份

```sql
CREATE TABLE `online_status` (
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `status` TINYINT DEFAULT 2 COMMENT '状态 1:在线 2:离线 3:忙碌 4:离开',
  `device_type` TINYINT DEFAULT 1 COMMENT '设备类型 1:Web 2:iOS 3:Android 4:PC',
  `last_active_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '最后活跃时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_last_active` (`last_active_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='在线状态表';
```

---

### 9. 通话记录表 (call_record)

**用途**: 存储音视频通话记录

**字段说明**:
- `id`: 记录ID，主键
- `call_type`: 通话类型 (1:语音, 2:视频, 3:多人会议)
- `initiator_id`: 发起人ID
- `receiver_id`: 接收人ID（一对一通话）
- `group_id`: 群组ID（多人会议）
- `status`: 通话状态 (1:呼叫中, 2:已接通, 3:已结束, 4:未接听, 5:已拒绝, 6:已取消)
- `start_time`: 开始时间
- `end_time`: 结束时间
- `duration`: 通话时长（秒）
- `created_at`: 创建时间

**索引设计**:
- PRIMARY KEY: `id`
- INDEX: `initiator_id + created_at` (查询发起记录)
- INDEX: `receiver_id + created_at` (查询接收记录)
- INDEX: `group_id + created_at` (查询群组通话)
- INDEX: `status`

```sql
CREATE TABLE `call_record` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `call_type` TINYINT NOT NULL COMMENT '通话类型 1:语音 2:视频 3:多人会议',
  `initiator_id` BIGINT UNSIGNED NOT NULL COMMENT '发起人ID',
  `receiver_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '接收人ID',
  `group_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '群组ID',
  `status` TINYINT DEFAULT 1 COMMENT '状态 1:呼叫中 2:已接通 3:已结束 4:未接听 5:已拒绝 6:已取消',
  `start_time` TIMESTAMP NULL DEFAULT NULL COMMENT '开始时间',
  `end_time` TIMESTAMP NULL DEFAULT NULL COMMENT '结束时间',
  `duration` INT DEFAULT 0 COMMENT '通话时长（秒）',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_initiator_created` (`initiator_id`, `created_at`),
  KEY `idx_receiver_created` (`receiver_id`, `created_at`),
  KEY `idx_group_created` (`group_id`, `created_at`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通话记录表';
```

---

## 索引设计说明

### 1. 主键索引
- 所有表都使用 `BIGINT UNSIGNED` 作为主键
- 支持大数据量，最大值 2^64-1
- 消息表使用雪花算法生成ID，保证全局唯一且有序

### 2. 唯一索引
- `user.username`: 防止用户名重复
- `user.email`: 防止邮箱重复
- `friend.user_id + friend_id`: 防止重复添加好友
- `group_member.group_id + user_id`: 防止重复加入群组

### 3. 普通索引
- **时间索引**: `created_at` 用于按时间排序和范围查询
- **状态索引**: `status` 用于筛选不同状态的记录
- **关联索引**: 外键字段建立索引，提高关联查询效率
- **组合索引**: 高频查询的多字段组合，如 `from_user_id + to_user_id + created_at`

### 4. 索引优化原则
- 最左前缀原则：组合索引按查询频率排序
- 避免过多索引：每个表索引数量控制在5个以内
- 定期分析索引使用情况：`EXPLAIN` 分析查询计划
- 删除冗余索引：定期清理不使用的索引

---

## 分表分库策略

### 1. 消息表分表

**分表原因**:
- 单表数据量过大影响查询性能
- 历史消息查询频率低，可以归档

**分表方案**:
- 按月分表：`chat_message_202601`, `chat_message_202602`
- 按月分表：`group_message_202601`, `group_message_202602`

**分表逻辑**:
```javascript
// 根据时间戳计算表名
function getTableName(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `chat_message_${year}${month}`;
}

// 查询跨月消息
async function getMessages(userId, startTime, endTime) {
  const tables = getTablesBetween(startTime, endTime);
  const promises = tables.map(table => 
    queryFromTable(table, userId, startTime, endTime)
  );
  const results = await Promise.all(promises);
  return results.flat().sort((a, b) => a.created_at - b.created_at);
}
```

**自动建表**:
```javascript
// 定时任务：每月1号创建下个月的表
async function createNextMonthTable() {
  const nextMonth = getNextMonth();
  const tableName = `chat_message_${nextMonth}`;
  
  await db.query(`
    CREATE TABLE IF NOT EXISTS ${tableName} LIKE chat_message_template
  `);
}
```

### 2. 分库策略（可选）

**分库原因**:
- 单库连接数限制
- 单库存储容量限制
- 提高并发处理能力

**分库方案**:
- 按用户ID哈希分库：`user_id % 库数量`
- 建议分4个库：`chat_db_0`, `chat_db_1`, `chat_db_2`, `chat_db_3`

**注意事项**:
- 跨库查询需要在应用层聚合
- 分布式事务处理复杂
- 建议数据量达到千万级再考虑分库

---

## 完整SQL脚本

```sql
-- ============================================
-- Web IM聊天系统数据库初始化脚本
-- 数据库: web_chat
-- 字符集: utf8mb4
-- 排序规则: utf8mb4_unicode_ci
-- ============================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS `web_chat` 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `web_chat`;

-- ============================================
-- 1. 用户表
-- ============================================
CREATE TABLE `user` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username` VARCHAR(50) NOT NULL COMMENT '用户名',
  `email` VARCHAR(100) NOT NULL COMMENT '邮箱',
  `password_hash` VARCHAR(255) NOT NULL COMMENT '密码哈希',
  `nickname` VARCHAR(50) DEFAULT NULL COMMENT '昵称',
  `avatar` VARCHAR(500) DEFAULT NULL COMMENT '头像URL',
  `gender` TINYINT DEFAULT 0 COMMENT '性别 0:未知 1:男 2:女',
  `birthday` DATE DEFAULT NULL COMMENT '生日',
  `phone` VARCHAR(20) DEFAULT NULL COMMENT '手机号',
  `signature` VARCHAR(200) DEFAULT NULL COMMENT '个性签名',
  `status` TINYINT DEFAULT 0 COMMENT '状态 0:正常 1:禁用 2:注销',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `last_login_at` TIMESTAMP NULL DEFAULT NULL COMMENT '最后登录时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  UNIQUE KEY `uk_email` (`email`),
  KEY `idx_phone` (`phone`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ============================================
-- 2. 好友表
-- ============================================
CREATE TABLE `friend` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '关系ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `friend_id` BIGINT UNSIGNED NOT NULL COMMENT '好友ID',
  `remark` VARCHAR(50) DEFAULT NULL COMMENT '好友备注',
  `group_name` VARCHAR(50) DEFAULT '我的好友' COMMENT '分组名称',
  `status` TINYINT DEFAULT 0 COMMENT '状态 0:正常 1:拉黑',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '添加时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_friend` (`user_id`, `friend_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_friend_id` (`friend_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='好友关系表';

-- ============================================
-- 3. 好友申请表
-- ============================================
CREATE TABLE `friend_request` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '申请ID',
  `from_user_id` BIGINT UNSIGNED NOT NULL COMMENT '申请人ID',
  `to_user_id` BIGINT UNSIGNED NOT NULL COMMENT '被申请人ID',
  `message` VARCHAR(200) DEFAULT NULL COMMENT '申请消息',
  `status` TINYINT DEFAULT 0 COMMENT '状态 0:待处理 1:已同意 2:已拒绝 3:已过期',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '申请时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '处理时间',
  PRIMARY KEY (`id`),
  KEY `idx_from_user` (`from_user_id`),
  KEY `idx_to_user` (`to_user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='好友申请表';

-- ============================================
-- 4. 私聊消息表（按月分表）
-- ============================================
CREATE TABLE `chat_message_202601` (
  `id` BIGINT UNSIGNED NOT NULL COMMENT '消息ID（雪花算法）',
  `from_user_id` BIGINT UNSIGNED NOT NULL COMMENT '发送者ID',
  `to_user_id` BIGINT UNSIGNED NOT NULL COMMENT '接收者ID',
  `content` TEXT NOT NULL COMMENT '消息内容',
  `msg_type` TINYINT NOT NULL DEFAULT 1 COMMENT '消息类型 1:文本 2:图片 3:语音 4:视频 5:文件 6:位置 99:系统',
  `file_url` VARCHAR(500) DEFAULT NULL COMMENT '文件URL',
  `file_size` INT DEFAULT NULL COMMENT '文件大小（字节）',
  `duration` INT DEFAULT NULL COMMENT '时长（秒）',
  `is_read` TINYINT DEFAULT 0 COMMENT '是否已读 0:未读 1:已读',
  `is_recalled` TINYINT DEFAULT 0 COMMENT '是否撤回 0:正常 1:已撤回',
  `created_at` BIGINT UNSIGNED NOT NULL COMMENT '发送时间（毫秒时间戳）',
  PRIMARY KEY (`id`),
  KEY `idx_from_created` (`from_user_id`, `created_at`),
  KEY `idx_to_created` (`to_user_id`, `created_at`),
  KEY `idx_conversation` (`from_user_id`, `to_user_id`, `created_at`),
  KEY `idx_is_read` (`is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='私聊消息表-2026年1月';

-- ============================================
-- 5. 群组表
-- ============================================
CREATE TABLE `group` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '群组ID',
  `group_name` VARCHAR(100) NOT NULL COMMENT '群名称',
  `avatar` VARCHAR(500) DEFAULT NULL COMMENT '群头像',
  `description` VARCHAR(500) DEFAULT NULL COMMENT '群简介',
  `owner_id` BIGINT UNSIGNED NOT NULL COMMENT '群主ID',
  `max_members` INT DEFAULT 500 COMMENT '最大成员数',
  `member_count` INT DEFAULT 0 COMMENT '当前成员数',
  `status` TINYINT DEFAULT 0 COMMENT '状态 0:正常 1:解散',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_owner_id` (`owner_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='群组表';

-- ============================================
-- 6. 群成员表
-- ============================================
CREATE TABLE `group_member` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `group_id` BIGINT UNSIGNED NOT NULL COMMENT '群组ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `role` TINYINT DEFAULT 3 COMMENT '角色 1:群主 2:管理员 3:普通成员',
  `nickname` VARCHAR(50) DEFAULT NULL COMMENT '群昵称',
  `mute_end_time` TIMESTAMP NULL DEFAULT NULL COMMENT '禁言结束时间',
  `joined_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_group_user` (`group_id`, `user_id`),
  KEY `idx_group_id` (`group_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='群成员表';

-- ============================================
-- 7. 群消息表（按月分表）
-- ============================================
CREATE TABLE `group_message_202601` (
  `id` BIGINT UNSIGNED NOT NULL COMMENT '消息ID（雪花算法）',
  `group_id` BIGINT UNSIGNED NOT NULL COMMENT '群组ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '发送者ID',
  `content` TEXT NOT NULL COMMENT '消息内容',
  `msg_type` TINYINT NOT NULL DEFAULT 1 COMMENT '消息类型 1:文本 2:图片 3:语音 4:视频 5:文件 6:位置 99:系统',
  `file_url` VARCHAR(500) DEFAULT NULL COMMENT '文件URL',
  `file_size` INT DEFAULT NULL COMMENT '文件大小（字节）',
  `duration` INT DEFAULT NULL COMMENT '时长（秒）',
  `at_users` JSON DEFAULT NULL COMMENT '@的用户ID列表',
  `is_recalled` TINYINT DEFAULT 0 COMMENT '是否撤回 0:正常 1:已撤回',
  `created_at` BIGINT UNSIGNED NOT NULL COMMENT '发送时间（毫秒时间戳）',
  PRIMARY KEY (`id`),
  KEY `idx_group_created` (`group_id`, `created_at`),
  KEY `idx_user_created` (`user_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='群消息表-2026年1月';

-- ============================================
-- 8. 在线状态表
-- ============================================
CREATE TABLE `online_status` (
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `status` TINYINT DEFAULT 2 COMMENT '状态 1:在线 2:离线 3:忙碌 4:离开',
  `device_type` TINYINT DEFAULT 1 COMMENT '设备类型 1:Web 2:iOS 3:Android 4:PC',
  `last_active_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '最后活跃时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_last_active` (`last_active_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='在线状态表';

-- ============================================
-- 9. 通话记录表
-- ============================================
CREATE TABLE `call_record` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `call_type` TINYINT NOT NULL COMMENT '通话类型 1:语音 2:视频 3:多人会议',
  `initiator_id` BIGINT UNSIGNED NOT NULL COMMENT '发起人ID',
  `receiver_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '接收人ID',
  `group_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '群组ID',
  `status` TINYINT DEFAULT 1 COMMENT '状态 1:呼叫中 2:已接通 3:已结束 4:未接听 5:已拒绝 6:已取消',
  `start_time` TIMESTAMP NULL DEFAULT NULL COMMENT '开始时间',
  `end_time` TIMESTAMP NULL DEFAULT NULL COMMENT '结束时间',
  `duration` INT DEFAULT 0 COMMENT '通话时长（秒）',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_initiator_created` (`initiator_id`, `created_at`),
  KEY `idx_receiver_created` (`receiver_id`, `created_at`),
  KEY `idx_group_created` (`group_id`, `created_at`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通话记录表';

-- ============================================
-- 插入测试数据（可选）
-- ============================================

-- 插入测试用户
INSERT INTO `user` (`username`, `email`, `password_hash`, `nickname`, `gender`) VALUES
('user1', 'user1@example.com', '$2b$10$abcdefghijklmnopqrstuvwxyz', '用户1', 1),
('user2', 'user2@example.com', '$2b$10$abcdefghijklmnopqrstuvwxyz', '用户2', 2),
('user3', 'user3@example.com', '$2b$10$abcdefghijklmnopqrstuvwxyz', '用户3', 1);

-- 完成
SELECT 'Database initialization completed!' AS message;
```

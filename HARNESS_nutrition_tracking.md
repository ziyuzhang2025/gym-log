# HARNESS.md — Gym Log 营养、热量与目标管理扩展

## 0. 产品目标

在现有 Gym Log 的本地训练记录功能上，增加一个简单的每日营养记录模块。用户可以：

- 填写个人身体数据和目标
- 查看今日**预计总热量消耗（TDEE）**
- 记录每一餐的热量、蛋白质、脂肪、碳水
- 查看今日累计摄入与目标的差距
- 根据增肌、减脂、保持目标，得到建议热量与三大营养素目标

这仍然是个人记录工具，不做饮食社交、AI 推荐、食物识别、条码扫描或数据库同步。

---

## 1. 技术范围

沿用现有项目：

- Next.js App Router
- TypeScript
- Tailwind CSS
- LocalStorage
- 无数据库、无认证、无后端 API
- 无外部 UI 库

所有计算均为估算值，UI 必须显示“估算”或“建议”，不可表达为医疗建议。

---

## 2. 必填资料与计算原则

仅根据身高和体重不能可靠计算总热量消耗；MVP 必须收集以下资料：

- 性别：male / female
- 年龄（岁）
- 身高（cm）
- 体重（kg）
- 日常活动等级
- 当前目标：增肌 / 减脂 / 保持

活动等级：

| 值 | 文案 | 系数 |
| --- | --- | --- |
| sedentary | 久坐，几乎不运动 | 1.2 |
| light | 轻度活动，每周 1–3 次训练 | 1.375 |
| moderate | 中度活动，每周 3–5 次训练 | 1.55 |
| active | 高活动量，每周 6–7 次训练 | 1.725 |
| very_active | 极高活动量/体力工作 | 1.9 |

### 2.1 BMR 和 TDEE

使用 Mifflin–St Jeor 公式：

```ts
// weightKg: kg, heightCm: cm, age: 岁
male:   BMR = 10 * weightKg + 6.25 * heightCm - 5 * age + 5
female: BMR = 10 * weightKg + 6.25 * heightCm - 5 * age - 161

TDEE = BMR * activityMultiplier
```

全部数值四舍五入到整数 kcal。

### 2.2 目标热量

```ts
maintain: targetCalories = TDEE
bulk:     targetCalories = TDEE + 250
cut:      targetCalories = TDEE - 400
```

UI 文案：

- 增肌：`约 +250 kcal 热量盈余`
- 减脂：`约 -400 kcal 热量赤字`
- 保持：`维持热量`

用户可在设置中手动覆盖热量调整值（默认值如上）；手动值优先。

### 2.3 三大营养素目标

先计算蛋白质和脂肪，剩余热量由碳水补足：

```ts
bulk:     protein = weightKg * 1.8; fat = weightKg * 0.8
cut:      protein = weightKg * 2.0; fat = weightKg * 0.7
maintain: protein = weightKg * 1.6; fat = weightKg * 0.8

proteinCalories = protein * 4
fatCalories = fat * 9
carb = max(0, (targetCalories - proteinCalories - fatCalories) / 4)
```

蛋白质、脂肪、碳水以克显示，四舍五入到整数。必须显示：`蛋白质和脂肪基于体重的建议估算；碳水为剩余热量换算。`

---

## 3. 数据模型

在 `lib/types.ts` 增加：

```ts
export type Gender = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type NutritionGoal = "bulk" | "cut" | "maintain";

export type NutritionProfile = {
  gender: Gender;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: NutritionGoal;
  calorieAdjustment?: number;
};

export type MealEntry = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
};

export type NutritionDay = {
  date: string; // new Date().toISOString().slice(0, 10)
  meals: MealEntry[];
};

export type NutritionTargets = {
  bmr: number;
  tdee: number;
  targetCalories: number;
  protein: number;
  fat: number;
  carbs: number;
};
```

LocalStorage keys：

```ts
const NUTRITION_PROFILE_KEY = "gym-log-nutrition-profile";
const NUTRITION_DAYS_KEY = "gym-log-nutrition-days";
```

---

## 4. 页面与用户流

### 4.1 新页面：`/nutrition`

标题：`Nutrition`

如果未填写资料：

```txt
Set up your nutrition targets
Add your body details to estimate today’s energy needs.
[ Set up targets ]
```

资料齐全后，按以下顺序显示：

1. 今日总览卡片
   - `Estimated daily burn: 2,350 kcal`
   - `Target intake: 1,950 kcal`
   - `Cut · ~400 kcal deficit`
   - `Edit targets`
2. 热量进度
   - `1,240 / 1,950 kcal`
   - 进度条
   - `710 kcal remaining`；超过时显示 `120 kcal over target`
3. 三大营养素进度（蛋白质、脂肪、碳水）
   - 例如 `Protein 86 / 140 g`
   - 各自独立进度条
4. 今日餐食列表
   - 默认无餐食
   - `+ Add meal` 按钮
   - 每条显示餐名、kcal、P/F/C，并可编辑或删除
5. 页面底部免责声明
   - `All calorie and macro targets are estimates, not medical advice.`

### 4.2 餐食录入

点击 `+ Add meal` 后显示内联表单或轻量弹窗：

```txt
Meal name        [ Breakfast              ]
Calories (kcal)  [ 520                    ]
Protein (g)      [ 32                     ]
Fat (g)          [ 16                     ]
Carbs (g)        [ 58                     ]
[ Save meal ]  [ Cancel ]
```

规则：

- 餐名必填
- 数值必须为大于等于 0 的数字
- 保存后立即写入 LocalStorage
- 允许一餐只填写热量，三大营养素可为 0
- 不自动从宏量营养素反推/覆盖用户输入的热量

### 4.3 设置资料

可以做成 `/nutrition/settings` 页面，或 `/nutrition` 的编辑表单。必须支持：

- 性别
- 年龄
- 身高
- 体重
- 活动等级
- 目标（增肌、减脂、保持）
- 可选：热量调整值（kcal）

保存后立即重新计算今日目标，但不得修改已录入餐食。

### 4.4 首页入口

在 `components/AppShell.tsx` 的导航增加：

```txt
Today | Plan | Nutrition | History
```

不改变现有训练记录逻辑。

---

## 5. 组件与文件结构

新增：

```txt
app/
  nutrition/
    page.tsx
    settings/
      page.tsx
components/
  NutritionHeader.tsx
  CalorieSummary.tsx
  MacroProgress.tsx
  MealList.tsx
  MealForm.tsx
  NutritionProfileForm.tsx
lib/
  nutrition.ts
```

可修改：

```txt
components/AppShell.tsx
lib/types.ts
lib/storage.ts
app/globals.css
```

`lib/nutrition.ts` 必须保持纯函数，至少导出：

```ts
calculateBmr(profile: NutritionProfile): number
calculateTargets(profile: NutritionProfile): NutritionTargets
getTodayNutritionDay(days: NutritionDay[]): NutritionDay
calculateNutritionTotals(day: NutritionDay): {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}
```

---

## 6. UI 约束

沿用现有黑白、Notion 风格：

- 白底、近黑文字、灰色边框
- 单列、移动端优先，最大宽度约 720px
- 数字优先、可快速录入
- 不使用渐变、彩色图表、环形图、营销卡片
- 进度条使用黑色填充；超出目标仅用文字提示，不引入强烈颜色
- 不增加图片、食物数据库、推荐商品、AI 功能

---

## 7. 非目标

本次不要实现：

- 数据库或云同步
- 登录/账号
- 食物搜索、条码扫描、拍照识别
- 自动计算单个食物的营养成分
- 微量营养素、维生素、矿物质
- 周/月报表、图表、体重趋势
- 医疗建议、疾病/饮食禁忌建议
- 与训练卡路里进行双重计算或自动抵扣

TDEE 的活动系数已经包括用户一般训练活动；当前训练日志不应再额外增加或扣减热量。

---

## 8. 验收标准

完成条件：

1. `npm run typecheck` 通过。
2. `npm run build` 通过。
3. 导航中可打开 `/nutrition`。
4. 未填写资料时显示设置引导。
5. 填写性别、年龄、身高、体重、活动等级、目标后，能显示 BMR/TDEE 推导出的每日热量目标。
6. 增肌显示默认约 `+250 kcal`，减脂显示默认约 `-400 kcal`，保持显示 `0 kcal` 调整。
7. 蛋白质、脂肪、碳水目标按本 Harness 的公式正确计算。
8. 用户可新增、编辑、删除今日餐食。
9. 每餐可记录热量、蛋白质、脂肪、碳水。
10. 今日总热量和总 P/F/C 会立即更新。
11. 刷新页面后资料和餐食仍存在。
12. 不影响现有训练计划、训练打卡和历史记录。
13. 无数据库、认证、后端、食物 API 或额外复杂功能。

---

## 9. 实施顺序

1. 添加 types 与 LocalStorage helpers。
2. 编写并单独验证 `lib/nutrition.ts` 的纯计算函数。
3. 添加资料设置页面与资料校验。
4. 实现 `/nutrition` 的空状态、目标卡片和累计进度。
5. 实现餐食新增、编辑、删除和即时持久化。
6. 加入导航入口和移动端样式。
7. 运行 `npm run typecheck` 与 `npm run build`。
8. 手动验证：首次设置 → 添加多餐 → 编辑/删除 → 刷新 → 检查汇总。

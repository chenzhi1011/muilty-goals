import React, { useEffect, useState } from 'react';
import { Goal, Category } from '../../domain/types';
import { useServices } from '../state/AppProvider';
import { GoalEditorModal } from '../components/GoalEditorModal';
import { formatDate } from '../../utils/date';

export default function GoalsPage() {
  // 拿到全局注入的 services（里面封装了 goals / categories 的增删改查）
  const services = useServices();

  // =========================
  //  基础状态管理（useState）
  // =========================

  // 所有目标列表
  const [goals, setGoals] = useState<Goal[]>([]);

  // 每个目标对应的类别列表：key 为 goalId，value 为该目标下的 Category[]
  const [categories, setCategories] = useState<Record<string, Category[]>>({});

  // 控制 “目标编辑弹窗（GoalEditorModal）” 是否显示
  const [showModal, setShowModal] = useState(false);

  // 当前正在编辑的目标（传给 GoalEditorModal）
  // 如果是 null，表示创建新目标；否则表示编辑这个目标
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // 每个目标对应的 “新增类别输入框” 当前输入值
  // key 是 goalId，value 是输入框内容
  const [categoryInputs, setCategoryInputs] = useState<Record<string, string>>({});

  // 当前在详情弹窗中打开的目标的 id
  // null 表示没有详情弹窗打开
  const [detailGoalId, setDetailGoalId] = useState<string | null>(null);

  // =========================
  //  加载 / 刷新目标
  // =========================

  // 从 services 里拉取当前所有激活目标，并加载它们对应的 categories
  const refreshGoals = async () => {
    const list = await services.goals.listActive(); // 拉目标列表
    setGoals(list);                                 // 更新到 state

    // 对每一个目标，再去加载它的类别
    list.forEach((g: Goal) => loadCategories(g.id));
  };

  // =========================
  //  类别相关操作
  // =========================

  // 删除某个目标下的一个类别
  const handleRemoveCategory = async (goalId: string, categoryId: string) => {
    await services.categories.delete(categoryId); // 调用服务删除类别
    loadCategories(goalId);                      // 重新加载该目标的类别列表
  };

  // 重命名某个类别
  const handleRenameCategory = async (goalId: string, categoryId: string, current: string) => {
    // 用浏览器原生 prompt 获取用户的新名称
    const name = window.prompt('修改类别名称', current);
    if (!name || !name.trim()) return; // 用户取消或者输入空白则不处理

    await services.categories.update({ id: categoryId, name: name.trim() }); // 保存更新
    loadCategories(goalId); // 重新加载该目标的类别列表
  };

  // 根据 goalId 加载它对应的类别列表，并合并到 categories 状态中
  const loadCategories = async (goalId: string) => {
    const list = await services.categories.listByGoal(goalId); // 拉取该目标下的类别
    setCategories((prev) => ({ ...prev, [goalId]: list }));    // 合并更新（保持其他 goalId 的数据不变）
  };

  // 组件首次挂载时，拉一次目标列表
  useEffect(() => {
    refreshGoals();
  }, []);

  // 新增类别：从 categoryInputs[goalId] 读取输入内容，创建后清空输入框
  const handleAddCategory = async (goalId: string) => {
    const name = categoryInputs[goalId];
    if (!name || !name.trim()) return; // 空内容不提交

    await services.categories.create({ goalId, name: name.trim() }); // 创建新类别
    // 清空该目标对应的输入框内容
    setCategoryInputs((prev) => ({ ...prev, [goalId]: '' }));
    // 重新加载该目标的类别列表
    loadCategories(goalId);
  };

  // 删除目标：提示用户确认，删除后刷新目标列表，并关闭详情弹窗
  const handleDeleteGoal = async (goalId: string) => {
    const ok = window.confirm('删除后关联任务将转为未分组任务，确认删除？');
    if (!ok) return;

    await services.goals.delete(goalId);
    setDetailGoalId(null); // 关闭详情弹窗
    refreshGoals();        // 重新拉取目标列表
  };

  // 根据 detailGoalId 找出当前正在展示详情的目标对象
  const detailGoal = detailGoalId ? goals.find((g) => g.id === detailGoalId) ?? null : null;

  // =========================
  //  渲染区域
  // =========================
  return (
    <div className="grid" style={{ gap: 12 }}>
      {/* 顶部卡片：标题 + 新增目标按钮 */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: 800 }}>目标设定</div>
          <div style={{ color: '#64748b' }}>悬浮球展示目标，点击查看详情和编辑</div>
        </div>
        {/* 新增目标按钮：当 goals 数量 >= 3 时禁用 */}
        <button className="btn" onClick={() => setShowModal(true)} >
          {/* disabled={goals.length >= 3} 上行可设置最多数量 */}
          + 新增目标
        </button>
      </div>

      {/* 如果一个目标都没有，显示提示卡片 */}
      {goals.length === 0 && <div className="card">暂无目标，先创建一个吧。</div>}

      {/* 目标“悬浮球”列表区域：自适应网格布局 */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 16 }}>
        {goals.map((goal) => (
          // 每个目标是一个 button，点击后打开该目标的详情弹窗
          <button
            key={goal.id}
            onClick={() => setDetailGoalId(goal.id)} // 设置当前详情目标 id
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8
            }}
          >
            {/* 目标圆球（悬浮球） */}
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: '50%',               // 圆形
                background: goal.color,             // 使用目标自己的颜色
                boxShadow: '0 12px 30px rgba(0,0,0,0.12)', // 投影
                display: 'grid',
                placeItems: 'center',
                color: 'white',
                fontWeight: 800,
                fontSize: 14,
                textAlign: 'center',
                padding: 12
              }}
            >
              {goal.name}
            </div>

            {/* 目标类型 + 重要度 Tag */}
            <div className="chip">
              {goal.type === 'ongoing' ? '持续型' : '项目型'} · {goal.importance}★
            </div>
          </button>
        ))}
      </div>

      {/* 目标编辑弹窗（创建/编辑用） */}
      <GoalEditorModal
        open={showModal}     // 是否显示弹窗
        goal={editingGoal}   // 当前编辑的目标（null = 新建）
        onClose={() => {
          setShowModal(false);   // 关闭弹窗
          setEditingGoal(null);  // 清空正在编辑的目标
        }}
        onSaved={() => refreshGoals()} // 保存成功后，刷新目标列表
      />

      {/* 目标详情弹窗（只在 detailGoal 有值时显示） */}
      {detailGoal && (
        // 背景遮罩层，点击遮罩关闭详情弹窗
        <div className="modal-backdrop" onClick={() => setDetailGoalId(null)}>
          {/* 弹窗主体，阻止 click 冒泡到背景层 */}
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 'min(560px, 92vw)' }}>
            {/* 弹窗标题区域：目标名称 + 关闭按钮 */}
            <div className="section-title" style={{ marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* 左侧彩色小圆点（目标颜色） */}
                <div
                  className="goal-dot"
                  style={{
                    width: 14,
                    height: 14,
                    background: detailGoal.color,
                    // 外圈淡色阴影（goal.color 后面加 22 表示透明度）
                    boxShadow: `0 0 0 6px ${detailGoal.color}22`
                  }}
                />
                {/* 目标名称 + 类型 + 重要度 */}
                <div>
                  <div style={{ fontWeight: 800 }}>{detailGoal.name}</div>
                  <div style={{ color: '#64748b', fontSize: 13 }}>
                    {detailGoal.type === 'ongoing' ? '持续型' : '项目型'} · 重要度 {detailGoal.importance}
                  </div>
                </div>
              </div>
              {/* 右上角“关闭”按钮 */}
              <button className="btn secondary" onClick={() => setDetailGoalId(null)}>
                关闭
              </button>
            </div>

            {/* 时间信息区域：持续型显示开始时间，项目型显示起止时间 */}
            <div style={{ color: '#475569', fontSize: 14 }}>
              {detailGoal.type === 'ongoing' ? (
                <>开始：{formatDate(detailGoal.startDate, 'YYYY/MM/DD')}</>
              ) : (
                <>
                  {formatDate(detailGoal.startDate, 'YYYY/MM/DD')} -{' '}
                  {detailGoal.endDate ? formatDate(detailGoal.endDate, 'YYYY/MM/DD') : '未设置'}
                </>
              )}
            </div>

            {/* 类别 / 步骤 列表 */}
            <div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>类别 / 步骤</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                {/* 遍历当前目标的所有类别 */}
                {(categories[detailGoal.id] || []).map((c) => (
                  <div
                    key={c.id}
                    className="chip"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <span>{c.name}</span>
                    {/* 重命名按钮（小铅笔 ✎） */}
                    <button
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#0ea5e9' }}
                      onClick={() => handleRenameCategory(detailGoal.id, c.id, c.name)}
                      title="重命名"
                    >
                      ✎
                    </button>
                    {/* 删除按钮（×） */}
                    <button
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444' }}
                      onClick={() => handleRemoveCategory(detailGoal.id, c.id)}
                      title="删除"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {/* 如果当前没有任何类别，显示引导文案 */}
                {(categories[detailGoal.id] || []).length === 0 && (
                  <div style={{ color: '#94a3b8', fontSize: 13 }}>还没有子目标，快速添加一个</div>
                )}
              </div>
            </div>

            {/* 新增类别输入 + 按钮 */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                value={categoryInputs[detailGoal.id] ?? ''}  // 当前目标对应的输入值
                onChange={(e) =>
                  setCategoryInputs((prev) => ({ ...prev, [detailGoal.id]: e.target.value }))
                }
                placeholder="新增类别 / 步骤"
              />
              <button className="btn secondary" onClick={() => handleAddCategory(detailGoal.id)}>
                添加
              </button>
            </div>

            {/* 底部按钮：编辑目标 / 删除目标 */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              {/* 编辑目标：打开编辑弹窗，并把当前 detailGoal 作为编辑对象传入 */}
              <button
                className="btn secondary"
                onClick={() => {
                  setEditingGoal(detailGoal); // 设置当前编辑的目标
                  setShowModal(true);         // 打开编辑弹窗
                  setDetailGoalId(null);      // 关闭详情弹窗（避免两个弹窗叠在一起）
                }}
              >
                编辑目标
              </button>

              {/* 删除目标 */}
              <button
                className="btn"
                style={{ background: '#ef4444' }}
                onClick={() => handleDeleteGoal(detailGoal.id)}
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
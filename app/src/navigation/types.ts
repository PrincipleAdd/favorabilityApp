/**
 * 根导航栈参数类型定义
 */
export type RootStackParamList = {
  /** 人物列表页（首页） */
  CharacterList: undefined;
  /** 人物创建页 */
  CharacterCreate: undefined;
  /** 人物详情页 */
  CharacterDetail: { characterId: string };
  /** 人物编辑页 */
  CharacterEdit: { characterId: string };
};

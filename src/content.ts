export type Language = 'zh' | 'en';
interface Passage { title: string; text: string; translations?: readonly string[] }
// 原创短文随包提供；客户端与房间共用题库，避免双方题面不一致。
export const passages: Record<Language, Passage[]> = {
  zh: [
    { title: '把节奏交给指尖', text: '清晨的光落在桌面上，新的一天从一个小小的目标开始。不必急着追赶别人，先找到自己的节奏。每一次认真练习，都让指尖更加从容。把注意力放在眼前的文字上，让准确先于速度，让进步发生在每一个平凡的今天。' },
    { title: '在社区里相遇', text: '有人分享一段代码，有人记录一次旅行，也有人认真回答一个看似简单的问题。我们来自不同的地方，却因为好奇而相遇。把知道的说清楚，把未知的问明白。一次耐心的交流，也许就是另一个人向前迈出的第一步。' },
    { title: '慢慢走，也能到达', text: '雨停以后，街道显得格外安静。路边的树叶留着水珠，远处传来自行车的铃声。我合上书，给自己倒了一杯温水。生活不总是需要一个宏大的计划，有时只要完成眼前的小事，就能看见下一段路的方向。' },
  ],
  en: [
    {
      title: 'Find your own rhythm', text: 'A little practice every day can make a quiet difference. Keep your hands relaxed and let your eyes follow the words. Speed will come with time. For now, focus on each letter and enjoy the rhythm of the keys. Every small step is still a step forward.',
      translations: [
        '一', '点', '练习', '每', '天', '能', '带来', '一种', '细微的', '改变',
        '保持', '你的', '双手', '放松', '并且', '让', '你的', '双眼', '跟随', '这些', '文字',
        '速度', '将会', '提升', '随着', '时间', '在', '当下', '专注', '于', '每个', '字母',
        '并且', '享受', '这份', '节奏', '的', '这些', '按键', '每', '小小的', '一步', '是', '仍然', '一', '步', '向前',
      ],
    },
    {
      title: 'Built together', text: 'Good ideas grow when people share what they know. A simple question can lead to a new way of thinking. Write with care, listen with patience, and leave room for another point of view. The best part of a community is what we can build together.',
      translations: [
        '美好的', '想法', '成长', '当', '人们', '分享', '所', '他们', '知道',
        '一个', '简单的', '问题', '能', '引领', '到', '一种', '新的', '方式', '的', '思考',
        '书写', '带着', '用心', '倾听', '带着', '耐心', '并且', '留下', '空间', '给', '另一种', '角度', '的', '看法',
        '这', '最好的', '部分', '的', '一个', '社区', '是', '所', '我们', '能', '建设', '共同',
      ],
    },
    {
      title: 'A window to the world', text: 'The morning light reaches across the room. Outside the window, a bird rests on a branch and the city begins to wake. There is no need to rush this moment. Take a breath, settle into your chair, and begin with one clear thought at a time.',
      translations: [
        '这', '清晨', '阳光', '照进', '穿过', '这', '房间', '在外面', '这', '窗户',
        '一只', '鸟', '停歇', '在', '一根', '树枝', '而', '这', '城市', '开始', '去', '苏醒',
        '（引导词）', '有', '没有', '必要', '去', '匆忙', '这一', '时刻',
        '做', '一次', '呼吸', '安坐', '进入', '你的', '椅子', '然后', '开始', '以', '一个', '清晰的', '想法', '每', '一', '次',
      ],
    },
  ],
};
export function pickPassage(language: Language, index = Math.floor(Math.random() * passages[language].length)) {
  return passages[language][index % passages[language].length];
}

export function passageSegments(text: string, translations: readonly string[] = []) {
  let start = 0, word = 0;
  // 释义按题面中的单词顺序维护；保留原始空白和字符偏移，避免注释影响判错与光标。
  return (text.match(/\S+|\s+/gu) ?? []).map(part => {
    const segment = { text: part, start, translation: /\S/u.test(part) ? translations[word++] ?? '' : '' };
    start += Array.from(part).length;
    return segment;
  });
}

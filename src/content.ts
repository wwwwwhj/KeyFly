export type Language = 'zh' | 'en';
// 原创短文随包提供；客户端与房间共用题库，避免双方题面不一致。
export const passages = {
  zh: [
    { title: '把节奏交给指尖', text: '清晨的光落在桌面上，新的一天从一个小小的目标开始。不必急着追赶别人，先找到自己的节奏。每一次认真练习，都让指尖更加从容。把注意力放在眼前的文字上，让准确先于速度，让进步发生在每一个平凡的今天。' },
    { title: '在社区里相遇', text: '有人分享一段代码，有人记录一次旅行，也有人认真回答一个看似简单的问题。我们来自不同的地方，却因为好奇而相遇。把知道的说清楚，把未知的问明白。一次耐心的交流，也许就是另一个人向前迈出的第一步。' },
    { title: '慢慢走，也能到达', text: '雨停以后，街道显得格外安静。路边的树叶留着水珠，远处传来自行车的铃声。我合上书，给自己倒了一杯温水。生活不总是需要一个宏大的计划，有时只要完成眼前的小事，就能看见下一段路的方向。' },
  ],
  en: [
    { title: 'Find your own rhythm', text: 'A little practice every day can make a quiet difference. Keep your hands relaxed and let your eyes follow the words. Speed will come with time. For now, focus on each letter and enjoy the rhythm of the keys. Every small step is still a step forward.' },
    { title: 'Built together', text: 'Good ideas grow when people share what they know. A simple question can lead to a new way of thinking. Write with care, listen with patience, and leave room for another point of view. The best part of a community is what we can build together.' },
    { title: 'A window to the world', text: 'The morning light reaches across the room. Outside the window, a bird rests on a branch and the city begins to wake. There is no need to rush this moment. Take a breath, settle into your chair, and begin with one clear thought at a time.' },
  ],
} satisfies Record<Language, { title: string; text: string }[]>;
export function pickPassage(language: Language, index = Math.floor(Math.random() * passages[language].length)) {
  return passages[language][index % passages[language].length];
}

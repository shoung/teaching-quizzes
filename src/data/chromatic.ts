import source from '../../sources/chromatic.json';
import assets from '../../sources/chromatic-assets.json';
import type { Question, Quiz } from '../types';

const localImage = (url: string) => (assets as Record<string, string>)[url];
const reflections = new Set([9, 10, 12, 13, 16, 17, 18, 19, 20, 21, 22, 27, 28]);
const explanations = [
  '正紅色不明顯偏橙，也不明顯偏紫。比較時先找出偏黃與偏藍的色塊，再觀察剩下色塊的紅色純度。',
  '黃綠位於黃色與綠色之間；相較偏青的綠色，它帶有更多黃色成分。試著在腦中將四個選項排在色相環上。',
  '暖白通常帶有細微的黃或橙色傾向，冷白則較偏藍。攝影中的白平衡會改變白色物體呈現的冷暖感。',
  '觀察大面積天空與暗部的共同色偏，比只看亮點更容易判斷整體色調。這張夜景的教學參考是深藍色。',
  '色相漸層需要連續過渡。由黃朝洋紅移動時，會先經過橙與紅色系；依相鄰色塊推估缺少的位置。',
  '膚色排序時先看紅與黃的比例，暫時忽略明暗。此題原始參考順序是 ADCB；實際人像仍需配合光源與白平衡判斷。',
  '除了主體色，也要觀察反光、陰影、背景與小面積色彩。此題以藍、橄欖灰、黃與粉色為原始參考，複選須完整選出且不多選。',
  '鮮豔程度主要與飽和度有關，並不等同明度。比較花朵時，試著分開觀察「有多亮」與「顏色有多純」。',
  '平靜與舒適沒有唯一答案。請記下你偏好的空間明度、飽和度與冷暖，將它們轉成日後選色時可用的線索。',
  '自然與舒適也會受個人經驗影響。比較膚色、白色及陰影是否出現明顯色偏，並描述你喜歡的色彩平衡。',
  '青色到深藍的過渡同時包含色相與明度變化。觀察空格兩側，再選擇能讓整條色帶最連續的色塊。',
  '視覺重量是色彩聯想，並非實際重量。較淺的顏色常給人輕盈感，但材質、光線和個人經驗也會改變感受。',
  '想長時間觀看的照片，反映你的色彩偏好。可以觀察畫面是否留白充足、色彩是否集中，以及你更喜歡柔和或強烈的對比。',
  '背景會影響我們對中央色塊明度的感知。原題的教學參考為色值相同；「看起來」可能因周圍對比而不同，適合在課堂討論同時對比現象。',
  '飽和度的感受會受周圍色彩影響。原題以中央色值相同為教學參考；這個知覺差異提醒我們，調色應同時檢查背景與相鄰色。',
  '同一種顏色在不同文化與經驗中，可能帶來不同感受。請觀察讓你不舒服的是色相、亮度，還是大面積且高飽和的刺激。',
  '孤獨與平靜可以同時存在。試著從冷暖、低飽和色、留白與人物距離，找出支持你選擇的畫面線索。',
  '強烈情緒不一定只來自鮮豔顏色。明暗反差、色彩面積與題材也會影響感受；能說明原因比符合別人的喜好更重要。',
  '「時間靜止」是一種敘事感受。觀察你選的照片是透過低對比、統一色調、靜態構圖，還是其他元素建立氛圍。',
  '食慾聯想因人而異，也會受光線與食物情境影響。請用自己的經驗描述色調與感受的關聯，而非將它當成所有人都適用的規則。',
  '離別可以是哀傷、平靜或期待；複選能容納不同的故事。試著為每張選中的照片寫一句旁白，再看看色彩如何支持敘事。',
  '昂貴感是材質、光線、包裝與色彩共同建立的印象。分析你選擇的照片如何運用反光、留白和色彩數量，而不是只記住某個顏色。',
  '原題以黃色抱枕作為配色參考。可以從相鄰色、互補色、面積比例及視覺焦點討論這個選擇；其他選擇也能在不同設計目標下成立。',
  '原題以 D 作為取捨參考。練習說明你不保留的理由，例如色彩衝突、主體不突出或層次不足；審美選擇需放回作品目的討論。',
  '原題以 B 作為取捨參考。觀察整體色調是否一致、亮暗是否支持主體，以及色彩是否分散注意力；參考答案不是唯一審美標準。',
  '原題以白色作為輕盈與和諧的配色參考。高明度、低色彩負擔的服裝可讓環境成為主角；也可比較不同服裝帶來的故事差異。',
  '此題記錄此刻的心境，沒有高低分。下次重測可能選到不同照片，這可以成為觀察情緒與視覺偏好變化的小練習。',
  '把觀察說清楚、做同條件比較、反覆練習配色，都能幫助你建立可運用的色彩經驗。你的選擇是學習起點，不是天賦判決。',
];

const traditional = (text: string) => text.replace(/蓝/g, '藍').replace(/榄/g, '欖').replace(/黄/g, '黃').replace(/红/g, '紅').replace(/绿/g, '綠');

const questions: Question[] = source.questions.map((q, index) => {
  const n = index + 1;
  const scores = q.options.map((o) => o.sourceScore ?? 0);
  const max = Math.max(...scores);
  return {
    id: q.id,
    prompt: q.prompt.replace(/^\d+[.．]?\s*/, ''),
    options: q.options.map((o) => traditional(o.label.trim())),
    kind: q.type as 'single' | 'multiple',
    images: q.images.map(localImage),
    optionImages: q.options.map((o) => o.image ? localImage(o.image) : null),
    referenceAnswers: scores.flatMap((score, i) => (q.type === 'multiple' ? score > 0 : score === max) ? [i] : []),
    reflection: reflections.has(n),
    dimension: n <= 7 ? 'hue' : n <= 15 ? 'light' : n <= 22 ? 'psychology' : 'harmony',
    explanation: explanations[index],
  };
});

export const chromaticQuiz: Quiz = {
  id: 'chromatic-intuition', version: 1,
  title: '色彩天賦測驗', subtitle: 'CHROMATIC INTUITION',
  description: '從細微的色相到照片裡的情緒，透過 28 道視覺提問，探索你的色彩直覺。',
  category: '視覺美學', minutes: 12, color: 'peach', icon: 'color', mode: 'assessment',
  cover: localImage(source.headerImage), questions,
};

export const dimensions = [
  { id: 'hue', name: '色相敏銳度', english: 'HUE DISCRIMINATION', description: '看見相近色彩之間的微小差異。', practice: '每天選一張照片，找出五個主要色彩，將它們依冷暖或色相順序排列。' },
  { id: 'light', name: '明度與飽和度', english: 'LIGHTNESS & SATURATION', description: '分辨光影層次與色彩的強度。', practice: '用同一張照片做明度與飽和度的分別調整，再比較哪個變化影響了空間感。' },
  { id: 'psychology', name: '色彩心理與聯想', english: 'COLOR & EMOTION', description: '讀懂色彩為你帶來的情緒線索。', practice: '為同一個場景製作兩組色調，各寫三個情緒詞，與同學交換感受。' },
  { id: 'harmony', name: '色彩搭配邏輯', english: 'COLOR HARMONY', description: '讓色彩的關係支持畫面的故事。', practice: '以一個主色、一個輔色和一個點綴色重新配色，觀察面積比例如何影響視線。' },
] as const;

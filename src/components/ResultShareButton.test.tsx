import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ResultShareButton } from './ResultShareButton';
import { consultingQuiz } from '../data/consulting';
import { getConsultingReport } from '../consulting-engine';
import { createResultImage } from '../result-sharing';

vi.mock('../result-sharing', async importOriginal => ({
  ...await importOriginal<typeof import('../result-sharing')>(),
  // jsdom has no canvas. The actual exported PNG is checked in the browser.
  createResultImage: vi.fn(async () => new File([new Uint8Array([137,80,78,71])], 'consultant-result-100.png', {type:'image/png'})),
}));
const report=getConsultingReport(consultingQuiz,{version:consultingQuiz.version,completed:true,answers:consultingQuiz.questions.map(q=>q.correctAnswer!)})!;
const nativeURL=URL;
let share: ReturnType<typeof vi.fn>;
let revoke: ReturnType<typeof vi.fn<(url:string)=>void>>;
beforeEach(() => {
  share=vi.fn().mockResolvedValue(undefined); revoke=vi.fn<(url:string)=>void>();
  Object.defineProperty(navigator,'share',{configurable:true,value:share});
  Object.defineProperty(navigator,'canShare',{configurable:true,value:vi.fn(()=>true)});
  vi.stubGlobal('URL',class extends nativeURL {static createObjectURL=vi.fn(()=>'blob:result-test');static revokeObjectURL=(url:string):void=>{revoke(url);};});
  Object.defineProperty(HTMLDialogElement.prototype,'showModal',{configurable:true,value:function(this:HTMLDialogElement){this.setAttribute('open','');}});
  Object.defineProperty(HTMLDialogElement.prototype,'close',{configurable:true,value:function(this:HTMLDialogElement){this.removeAttribute('open');}});
  vi.mocked(createResultImage).mockClear();
});
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();Reflect.deleteProperty(navigator,'share');Reflect.deleteProperty(navigator,'canShare');Reflect.deleteProperty(HTMLDialogElement.prototype,'showModal');Reflect.deleteProperty(HTMLDialogElement.prototype,'close');});

async function open() {
  const user=userEvent.setup();
  const view=render(<ResultShareButton quiz={consultingQuiz} report={report} />);
  await user.click(screen.getByRole('button',{name:'分享測驗結果'}));
  await screen.findByRole('link',{name:'下載成果圖（PNG）'});
  return {user,...view};
}
it('分享一個包含成果PNG與可編輯貼文的payload，不宣稱已發布',async()=>{
  const {user}=await open();
  const post=screen.getByRole('textbox',{name:'貼文文字'});
  expect((post as HTMLTextAreaElement).value).toContain('100 / 100 分｜顧問入場券，解鎖！');
  expect((post as HTMLTextAreaElement).value).toContain('https://is.gd/SpjRZt');
  expect((post as HTMLTextAreaElement).value).toContain('找破綻 100');
  expect((post as HTMLTextAreaElement).value).not.toContain('/result');
  fireEvent.change(post,{target:{value:'這是我的成果！\nhttps://is.gd/SpjRZt'}});
  expect(screen.getByRole('img',{name:/拆題力 100 分.*說服力 100 分/})).toBeInTheDocument();
  await user.click(screen.getByRole('button',{name:'分享到社群'}));
  const payload=share.mock.calls[0][0] as ShareData;
  expect(payload.text).toBe('這是我的成果！\nhttps://is.gd/SpjRZt');
  expect(payload.files).toHaveLength(1);
  expect(payload.files![0]).toMatchObject({type:'image/png',name:'consultant-result-100.png'});
  expect(await screen.findByRole('status')).toHaveTextContent('圖文已交給分享 App，請在 App 內確認並發布。');
});
it('不支援檔案分享時仍可下載成果圖並複製完整貼文',async()=>{
  Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>false});
  const {user}=await open();
  expect(screen.queryByRole('button',{name:'分享到社群'})).not.toBeInTheDocument();
  expect(screen.getByRole('link',{name:'下載成果圖（PNG）'})).toHaveAttribute('download','consultant-result-100.png');
  await user.click(screen.getByRole('button',{name:'複製貼文'}));
  expect(await navigator.clipboard.readText()).toBe((screen.getByRole('textbox') as HTMLTextAreaElement).value);
  expect(share).not.toHaveBeenCalled();
});
it('取消分享保留預覽，不誤報成功；失敗仍保留下載與複製',async()=>{
  share.mockRejectedValueOnce(new DOMException('cancel','AbortError')).mockRejectedValueOnce(new Error('not supported'));
  const {user}=await open();
  await user.click(screen.getByRole('button',{name:'分享到社群'}));
  await waitFor(()=>expect(screen.getByRole('status')).toHaveTextContent('已取消分享'));
  await user.click(screen.getByRole('button',{name:'分享到社群'}));
  expect(await screen.findByRole('alert')).toHaveTextContent('分享尚未完成');
  expect(screen.getByRole('link',{name:'下載成果圖（PNG）'})).toBeInTheDocument();
  expect(screen.getByRole('button',{name:'複製貼文'})).toBeEnabled();
});
it('圖片製作失敗可以重試，關閉再開不重製，離開時釋放預覽',async()=>{
  vi.mocked(createResultImage).mockRejectedValueOnce(new Error('offline'));
  const user=userEvent.setup();const view=render(<ResultShareButton quiz={consultingQuiz} report={report} />);
  await user.click(screen.getByRole('button',{name:'分享測驗結果'}));
  expect(await screen.findByRole('alert')).toHaveTextContent('成果圖暫時無法製作');
  await user.click(screen.getByRole('button',{name:'重新製作成果圖'}));
  await screen.findByRole('link',{name:'下載成果圖（PNG）'});
  await user.click(screen.getByRole('button',{name:'關閉成果分享'}));
  await user.click(screen.getByRole('button',{name:'分享測驗結果'}));
  expect(createResultImage).toHaveBeenCalledTimes(2);
  view.unmount();
  expect(revoke).toHaveBeenCalledWith('blob:result-test');
});
it('圖片等待期間離開結果不建立會洩漏的預覽URL',async()=>{
  let resolve!: (file:File)=>void;
  vi.mocked(createResultImage).mockImplementationOnce(()=>new Promise(r=>{resolve=r;}));
  const user=userEvent.setup();const view=render(<ResultShareButton quiz={consultingQuiz} report={report} />);
  await user.click(screen.getByRole('button',{name:'分享測驗結果'}));
  view.unmount();
  await act(async()=>{resolve(new File(['png'],'result.png',{type:'image/png'}));});
  expect(URL.createObjectURL).not.toHaveBeenCalled();
});

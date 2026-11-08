import type { ConversationContext, DialogueLine } from '../paris-salon/rpg-types';

const mentor = (text: string): DialogueLine => ({ speaker: '露易斯夫人', portrait: 5, text });
const claire = (text: string): DialogueLine => ({ speaker: '克萊爾夫人', portrait: 0, text });

function opening(context: ConversationContext): DialogueLine[] {
  const staffNote = context.assets.training > 0
    ? '助手已有些經驗，妳可以先把迎客和送茶的分工說清楚。'
    : '助手還在熟悉流程，妳可以先把迎客和送茶的分工說清楚。';
  return [
    mentor('妳總算坐下來了。樓下還在搬椅子，茶壺也等著上桌。'),
    claire('我怕客人進門時，連坐哪裡都得問半天。'),
    mentor('這份心思很好。先看一眼座位，讓人進來就知道往哪走。'),
    mentor('椅子先按今天的來客安排，留出通道，大家進出都方便。'),
    claire('靠窗那張小桌先留著吧，我也想坐在那兒聽大家說話。'),
    mentor('我聽見有人問能不能帶朋友，先替他們留個說話的位置吧。'),
    mentor('茶點不用鋪得滿滿的，留一張桌子放畫稿也很實在。'),
    claire('那茶具、椅子和點心，我該先顧哪一樣？'),
    mentor('妳手邊還有些現錢，別一口氣花在看起來最熱鬧的地方。'),
    mentor('把必要的開支記好，辦完這場，才知道錢去了哪裡。'),
    mentor(staffNote),
    claire('那我先和艾米爾說好。我怕自己一忙，又把什麼都丟給他。'),
    mentor('安排人手前，想想今天的來客需要誰照應。'),
    claire('我想讓大家自在些，進門就有人招呼。'),
    mentor('艾米爾腳步再勤，也只有一雙手。門邊留個人，茶桌那頭才走得開。'),
    mentor('場地布置也是一樣，熟悉的椅子不必全換，動線理順更要緊。'),
    claire('我現在一忙，就只想到把東西擺整齊，還一直怕漏掉什麼。'),
    mentor('去和他們聊聊吧。妳聽聽他們進門先提起什麼，心裡就有個方向了。'),
    mentor('忙起來若覺得亂，記下是哪一刻卡住，下次才知道怎麼改。'),
    claire('好，我先去看看門口和靠窗那幾張桌子。'),
    mentor('去吧。我把茶放在手邊，等妳回來告訴我現場怎麼樣。'),
  ];
}

function returnGuests(context: ConversationContext): DialogueLine[] {
  const previous = context.previous;
  const rosterNote = previous
    ? '我把上回的名冊拿來了，幾個名字旁還有空白，妳想起誰了嗎？'
    : '名冊拿來了，妳先看看有哪些熟面孔，也留意新來的客人。';
  const returnNote = previous
    ? previous.returning > 0
      ? '上回有熟面孔回來了，舊朋友肯再赴約，是很好的消息。'
      : '上回熟面孔不多，妳覺得邀約或聚會內容哪裡可再留意？'
    : '這場才剛開始，妳可以留意誰是舊朋友，誰是第一次到訪。';
  const satisfactionNote = previous
    ? previous.satisfaction >= 70
      ? '上回大家似乎聊得自在，妳記得哪個安排讓人願意多留一會兒？'
      : previous.satisfaction < 60
        ? '上回的感受似乎不太輕鬆，妳記得現場哪一段最讓人分心嗎？'
        : '上回有些地方合意，也有些地方可再試試，先從客人的話裡找線索。'
    : '等散場後再問問大家的感受，現在先讓每位客人自在落座。';
  const cashNote = context.assets.cash < 30
    ? '錢袋眼下較緊，聯絡舊客和寫好邀請，可能比添置新物更合用。'
    : '妳問問他們，這回哪一段還想再聊。下次安排時，心裡就有個底。';
  return [
    mentor(rosterNote),
    claire('我還沒弄清誰會再來，要一個個寫信問嗎？'),
    mentor(returnNote),
    mentor('熟客回來，往往是因為有人記住了他上次聊到一半的事。'),
    claire('我怕叫錯名字。要是連他上回說過什麼都記不住呢？'),
    mentor('妳可以在門口問候，也可以替他留著上回看過的畫稿。'),
    mentor('一聲「上次那幅畫後來如何」，比整套客套話更容易接下去。'),
    mentor(satisfactionNote),
    claire('我該把每個人的話都記下來嗎？'),
    mentor('記一兩個和聚會有關的細節就好，談話自然些。'),
    mentor('若有人提起想帶朋友來，下次寄信時可以請他捎上邀請。'),
    claire('那我得替新來的人留點時間，老朋友一聊起來，我常跟著忘了。'),
    mentor('名冊上也要記誰新來，免得只顧老朋友，忘了歡迎新面孔。'),
    mentor('想讓人再來，得讓他知道下回會遇見什麼，時間也要寫明白。'),
    mentor(cashNote),
    mentor('若收支有餘，仍先留些周轉；臨時修椅子可不能等客人付款。'),
    claire('我會把邀請寫得親切些，還會提起他們上次談的事。'),
    mentor('很好。寫完先念一遍，看看像不像妳當面對朋友說話。'),
    mentor('接著聽聽新客人的想法，回來的人和第一次來的人都值得認識。'),
  ];
}

function roomAndService(context: ConversationContext): DialogueLine[] {
  const previous = context.previous;
  const roomNote = previous && previous.waiting > 0
    ? '上回有人在門外等候，先弄清楚等候發生在哪個時段、門口怎麼安排。'
    : previous && previous.attendance > previous.safeCapacity
      ? '上回屋裡一度忙不過來，今天得安排好迎客和送茶的人手。'
      : previous && previous.attendance < previous.seatCapacity / 2
        ? '上回有些椅子空著，先看看邀約和場地哪裡不順，再決定要不要添座。'
        : previous
          ? '上回座位大致派上用場；留意客人進出是否順手，桌邊能否好好談話。'
          : '先看看座位和走道，客人進出順手，桌邊才好好談話。';
  const upgrades = previous && context.assets.seats > previous.before.seats
    ? '我看座位比先前多了，添椅之後，送茶的人手也得照顧到。'
    : '先觀察來客是否需要更多空間，再決定座位要不要調整。';
  return [
    mentor('妳看這張草圖，門口到窗邊這條路，端茶時會不會撞上椅背？'),
    claire('我只想多放幾張椅子，這樣每位來客都有位子。'),
    mentor(roomNote),
    mentor('多添座位時，也要想想助手是否忙得過來，茶水能否及時送上。'),
    claire('要是我一直顧著門口，想到茶壺時，水會不會都冷了？'),
    mentor('先走一遍迎客的路：進門、掛外套、找座、送茶，各處都看看。'),
    mentor('我有一次也是這樣，門口還沒招呼完，茶桌那頭就找不到人了。'),
    mentor('桌椅擺得順些，端茶和看畫稿都方便，環境也更舒服。'),
    claire('我能不能叫助手守在門邊，替大家帶路？'),
    mentor('可以考慮，也要替他留時間照看屋裡。妳熟悉誰擅長哪件事。'),
    mentor(upgrades),
    mentor('來客多時，安排助手幫忙招呼，妳也較能照看每桌的客人。'),
    claire('我還以為得一直陪著同一桌，走開就顯得失禮。'),
    mentor('客人圍在桌邊時，妳就坐下來陪他們聊。有人說起自己的故事，先聽一會兒。'),
    mentor('客人拿著畫稿時，桌角清爽些，茶杯放遠些，大家都安心。'),
    mentor('下場前寫下最容易堵住的地方，助手照著做，妳也少些奔忙。'),
    claire('我懂了，得先找出卡住的是座位、動線還是招呼。'),
    mentor('對，去現場站一會兒吧。人走過來時，妳會看得比草圖更清楚。'),
    mentor('我在門口替妳看著，妳從裡面走一趟，再告訴我哪裡不順。'),
  ];
}

function listening(context: ConversationContext): DialogueLine[] {
  const previous = context.previous;
  const reaction = previous
    ? previous.satisfaction >= 70
      ? '上回大家似乎聊得自在，妳可記得哪個話題讓人願意開口？'
      : previous.satisfaction < 60
        ? '上回氣氛有些拘謹，今天不妨先給來客一個容易回答的小問題。'
        : '上回的談話有熱有冷，想想誰一直安靜，誰又談得起勁。'
    : '等客人到齊後，先聽聽他們想聊什麼，再找個輕鬆的開場。';
  return [
    mentor('咖啡館裡人人都在說話，到了沙龍，反倒有人只敢聽。'),
    claire('我怕點名請人發言，會讓不熟的人更緊張。'),
    mentor('那就別點名。先問大家看見了什麼，答案可以很簡單。'),
    mentor('一幅畫的顏色或畫裡的街景，都是能從眼前說起的話題。'),
    mentor('妳也可以請畫家講一件作畫時遇到的小麻煩，大家容易接話。'),
    mentor('提問後留些安靜，別急著替客人把答案說完。'),
    claire('我就是怕冷場。一安靜下來，就忍不住又說話。'),
    mentor(reaction),
    claire('若有人談得久了，旁邊的人插不上話，該怎麼辦？'),
    mentor('把話接住，再問另一位：「妳從哪裡看出這一點？」'),
    mentor('妳接著他的話問，大家比較容易跟上。留點空，等旁邊的人開口。'),
    mentor('開門前把桌椅和茶備好，妳坐下來聽客人說故事時，就不用一直分心了。'),
    mentor('妳可以先聽兩三段，散場再記下大家最在意的話題。'),
    claire('我想試試。也許我少說一點，反而聽得見更多。'),
    mentor('助手若留意誰還沒拿到茶，也能替妳把照料接上。'),
    mentor('邀請上寫清楚活動內容，初次來的人比較知道會遇見什麼。'),
    claire('我先問問安東，最近那張小稿遇到了什麼難題。'),
    mentor('很好，從他自己的故事開始，再讓其他人慢慢加入。'),
    mentor('散場後記下哪句話帶起了新話題，下回就有一個自然的起點。'),
  ];
}

function moneyAndPromises(context: ConversationContext): DialogueLine[] {
  const previous = context.previous;
  const cashChange = previous ? previous.after.cash - previous.before.cash : null;
  const cashNote = context.assets.cash < 20
    ? '眼下周轉不寬，先把非必要的添置擱一擱，留錢處理眼前承諾。'
    : cashChange !== null && cashChange < 0
      ? '上回花出去的錢多於進帳，這筆差額要放進今天的打算裡。'
      : previous && cashChange === 0
        ? '上回正好打平。今天的茶葉和工錢得先留著，修繕的錢再慢慢盤算。'
      : previous
        ? '上回收支留下些餘裕，先想清楚它能替哪件長久的安排出力。'
        : '先把這場的必要開支記好，辦完再對照收入和承諾。';
  const crowdNote = previous
    ? previous.newRegulars > 0
      ? '上回有新朋友願意再來，寄邀請時可以提起他們當時感興趣的事。'
      : '新面孔還沒留下太多，邀約是否說清楚內容，值得再看一遍。'
    : '寄出邀請時寫清楚聚會內容，第一次來的人比較知道會遇見什麼。';
  return [
    mentor('我把帳本攤開了。紙上有收入，也有每場聚會留下的開銷。'),
    claire('樓上還堆著幾張舊畫，我想收一收，說不定能多擺張桌子。'),
    mentor('那是筆長久的花費。先問自己，眼前的來客和人手是否用得上。'),
    mentor('屋子大了，清掃、照看和布置都要花心力，這些也得算進去。'),
    mentor(cashNote),
    mentor('我以前把客人留下的茶錢和贊助混在一頁，結帳時才發現自己看不懂。'),
    claire('難怪我算到一半又得重來。我把幾筆花費都寫在頁角了。'),
    mentor('若談贊助，先問他希望聚會做些什麼。妳也把自己辦得到的講清楚。'),
    claire('我想顧好帳目，也希望來客仍能自在地看畫、交談。'),
    mentor('正好。先把妳答應大家的事列出來，再看哪些開支能守住承諾。'),
    mentor(crowdNote),
    mentor('熟客留下來，需要一封合時宜的信，也需要下次聚會值得期待。'),
    mentor('教新人急不來。我以前教倒茶，光是不讓壺嘴滴水，就練了好幾天。'),
    claire('那我得先算眼前還缺誰，長久的安排也要留點錢。'),
    mentor('整理環境也要花費，挑客人常用的地方動手，往後每場都受益。'),
    mentor('把一次花費和每場的固定開銷分開寫，帳本才說得明白。'),
    claire('我今晚先核對帳目，再決定是否動那筆修繕費。'),
    mentor('好。妳若還拿不準，可以把用途寫在旁邊，明天再看一遍。'),
    mentor('讓每筆錢都有交代，妳就更容易守住對客人的信用。'),
  ];
}

function seasonClosing(context: ConversationContext): DialogueLine[] {
  const previous = context.previous;
  const longTermNote = context.assets.training > 0 || context.assets.ambience > 0
    ? '前面教過助手、整理過房間，今晚正好看看用起來順不順。'
    : '今晚就要迎客了，教新人、換布置先放一放，先把這壺茶備好。';
  const cashNote = context.assets.cash < 25
    ? '帳上餘錢不多，這場宜先顧已答應的安排，守住周轉。'
    : '手邊還有些餘裕，仍得看這一場需要什麼，別為了花完而添置。';
  const legacy = previous && context.assets.regulars > previous.before.regulars
    ? '名冊比起先前多了幾個名字，試著把這些新朋友也迎進談話。'
    : previous && context.assets.regulars < previous.before.regulars
      ? '最近少了些熟客，寫信問候時可以先聽聽他們為何沒來。'
      : '熟客名冊有沒有變化，今晚可以再留意誰願意把朋友帶來。';
  return [
    mentor('窗外天色早了，這是本季最後一場，妳想讓今晚留下什麼？'),
    claire('我有點想直接宣布下一季的計畫，大家一定會問。'),
    mentor('先把今晚辦好。告訴客人這場會有什麼，答應的事逐一做到。'),
    mentor('先陪大家度過今晚，散場後再整理這一季留下的經驗。'),
    mentor(legacy),
    claire('有些名字我已經認熟了。一想到這季要結束，還真有點捨不得。'),
    mentor('把來客的話和帳本都留好，之後再分辨哪些安排值得延續。'),
    mentor(cashNote),
    mentor(longTermNote),
    mentor('今天來的人想聽畫、看稿，還是單純和朋友坐坐？問過再安排。'),
    claire('我先把今晚的事顧好。下一季的點子，留著慢慢和他們聊。'),
    mentor('助手知道自己的差事，來客進門時便少一分慌亂。'),
    claire('那我先把今晚的邀約和座位再確認一遍。'),
    mentor('也留意門口的等候，別讓拿著請帖的人站著猜自己能不能進來。'),
    mentor('若有贊助或會員的約定，今晚照約辦妥，帳上也記清楚。'),
    mentor('散場後才是整理整季的時候：哪些朋友回來了，哪些做法可再試。'),
    mentor('妳可以問大家下回想談什麼，記下想法，先不必當場答應日期。'),
    claire('我會讓今晚有個好收尾，再和大家談以後。'),
    mentor('這樣很好。先去迎客吧，等最後一位離席，我們再慢慢看帳本。'),
  ];
}

const conversations = [opening, returnGuests, roomAndService, listening, moneyAndPromises, seasonClosing];

export function getMentorDialogue(eventNumber: number, context: ConversationContext): DialogueLine[] {
  const index = Math.min(6, Math.max(1, Math.trunc(eventNumber))) - 1;
  return conversations[index](context);
}

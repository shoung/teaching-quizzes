import { chapterTwoCase } from '../data/marketing-detective';
import type {
  DetectiveCase,
  DetectiveChoice,
  DetectiveResult,
  DetectiveSession,
  DetectiveStageId,
  PlanningPreviewView,
} from '../types';

export function createDetectiveEngine(detectiveCase: DetectiveCase) {
  const stages = detectiveCase.stages;
  const roundViews: PlanningPreviewView[] = ['research', 'persona', 'journey', 'ideas', 'blueprint'];
  const safeViews: PlanningPreviewView[] = ['brief', ...roundViews, 'review'];

  function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  function validIdList(value: unknown, validIds: Set<string>): value is string[] {
    return Array.isArray(value)
      && value.every((id): id is string => typeof id === 'string' && validIds.has(id))
      && new Set(value).size === value.length;
  }

  function isValidSession(value: unknown): value is DetectiveSession {
    if (!isRecord(value) || value.caseId !== detectiveCase.id || value.caseVersion !== detectiveCase.version
      || typeof value.started !== 'boolean' || typeof value.completed !== 'boolean'
      || !Array.isArray(value.rounds) || value.rounds.length !== stages.length) return false;

    const rounds = Array.from(value.rounds);
    const roundsValid = rounds.every((round, index) => {
      if (!isRecord(round)) return false;
      const stage = stages[index];
      const questionIds = new Set(stage.questions.map(({ id }) => id));
      const choiceIds = new Set(stage.choices.map(({ id }) => id));
      const validSubmission = round.submittedIds === null
        || (validIdList(round.submittedIds, choiceIds) && round.submittedIds.length > 0);
      const validChoiceOrder = round.choiceOrder === undefined
        || (validIdList(round.choiceOrder, choiceIds) && round.choiceOrder.length === choiceIds.size);
      return validIdList(round.askedIds, questionIds)
        && round.askedIds.length <= detectiveCase.questionLimit
        && validIdList(round.selectedIds, choiceIds)
        && validSubmission
        && validChoiceOrder;
    });
    if (!roundsValid) return false;
    if (value.started && !value.completed && rounds.every((round) => isRecord(round) && round.submittedIds !== null)) return false;
    if (!value.started && (value.completed || rounds.some((round) => {
      if (!isRecord(round) || !Array.isArray(round.askedIds) || !Array.isArray(round.selectedIds)) return true;
      return round.askedIds.length > 0 || round.selectedIds.length > 0 || round.submittedIds !== null;
    }))) return false;
    if (value.completed && (!value.started || rounds.some((round) => !isRecord(round) || round.submittedIds === null
      || !Array.isArray(round.selectedIds) || !sameIds(round.submittedIds as string[], round.selectedIds)))) return false;
    return true;
  }

  function cloneSession(session: DetectiveSession): DetectiveSession {
    return { ...session, rounds: session.rounds.map((round) => ({
      ...round,
      askedIds: [...round.askedIds],
      selectedIds: [...round.selectedIds],
      submittedIds: round.submittedIds === null ? null : [...round.submittedIds],
    })) };
  }

  function validRoundIndex(index: number): boolean {
    return Number.isInteger(index) && index >= 0 && index < stages.length;
  }

  function firstOpenRound(session: DetectiveSession): number {
    return session.rounds.findIndex(({ submittedIds }) => submittedIds === null);
  }

  function newDetectiveSession(): DetectiveSession {
    return {
      caseId: detectiveCase.id,
      caseVersion: detectiveCase.version,
      started: false,
      rounds: stages.map(({ choices }) => {
        const choiceOrder = choices.map(({ id }) => id);
        for (let index = choiceOrder.length - 1; index > 0; index -= 1) {
          const swap = Math.floor(Math.random() * (index + 1));
          [choiceOrder[index], choiceOrder[swap]] = [choiceOrder[swap], choiceOrder[index]];
        }
        return { choiceOrder, askedIds: [], selectedIds: [], submittedIds: null };
      }),
      completed: false,
    };
  }

  function beginDetectiveSession(session: DetectiveSession): DetectiveSession {
    if (!isValidSession(session) || session.started || session.completed) return session;
    return { ...cloneSession(session), started: true };
  }

  function currentDetectiveRound(session: DetectiveSession): number {
    if (!isValidSession(session) || !session.started) return 0;
    const open = firstOpenRound(session);
    return open < 0 ? stages.length : open;
  }

  function askDetectiveQuestion(session: DetectiveSession, index: number, questionId: string): DetectiveSession {
    if (!isValidSession(session) || !session.started || session.completed || !validRoundIndex(index)) return session;
    const current = currentDetectiveRound(session);
    if (index > current) return session;
    const round = session.rounds[index];
    const stage = stages[index];
    if (!stage.questions.some(({ id }) => id === questionId) || round.askedIds.includes(questionId)
      || round.askedIds.length >= detectiveCase.questionLimit) return session;
    const next = cloneSession(session);
    next.rounds[index].askedIds.push(questionId);
    return next;
  }

  function setDetectiveChoice(session: DetectiveSession, index: number, choiceId: string, selected: boolean): DetectiveSession {
    if (!isValidSession(session) || !session.started || session.completed || !validRoundIndex(index)
      || typeof selected !== 'boolean') return session;
    if (index > currentDetectiveRound(session)) return session;
    const round = session.rounds[index];
    if (!stages[index].choices.some(({ id }) => id === choiceId)) return session;
    const alreadySelected = round.selectedIds.includes(choiceId);
    if (alreadySelected === selected) return session;
    const next = cloneSession(session);
    next.rounds[index].selectedIds = selected
      ? [...round.selectedIds, choiceId]
      : round.selectedIds.filter((id) => id !== choiceId);
    return next;
  }

  function commitDetectiveRound(session: DetectiveSession, index: number): DetectiveSession {
    if (!isValidSession(session) || !session.started || session.completed || !validRoundIndex(index)
      || index > currentDetectiveRound(session)) return session;
    const round = session.rounds[index];
    if (round.selectedIds.length === 0) return session;
    if (round.submittedIds !== null && sameIds(round.submittedIds, round.selectedIds)) return session;

    const next = cloneSession(session);
    const changedPriorSubmission = round.submittedIds !== null;
    next.rounds[index].submittedIds = [...round.selectedIds];
    if (changedPriorSubmission) {
      for (let later = index + 1; later < next.rounds.length; later += 1) {
        next.rounds[later].selectedIds = [];
        next.rounds[later].submittedIds = null;
      }
    }
    next.completed = next.rounds.every(({ submittedIds }) => submittedIds !== null);
    if (next.completed) {
      for (const completedRound of next.rounds) {
        completedRound.selectedIds = [...completedRound.submittedIds!];
      }
    }
    return next;
  }

  function sameIds(left: string[], right: string[]): boolean {
    return left.length === right.length && left.every((id) => right.includes(id));
  }

  function gradeForScore(score: number): DetectiveResult['grade'] {
    if (score >= 90) return 'S';
    if (score >= 75) return 'A';
    if (score >= 60) return 'B';
    if (score >= 40) return 'C';
    return 'D';
  }

  function scoreRound(stageIndex: number, selectedIds: string[], askedIds: string[]) {
    const stage = stages[stageIndex];
    const selected = new Set(selectedIds);
    const correct = stage.choices.filter(({ correct: isCorrect }) => isCorrect);
    const hits = correct.filter(({ id }) => selected.has(id));
    const wrong = stage.choices.filter(({ correct: isCorrect, id }) => !isCorrect && selected.has(id));
    const missed = correct.filter(({ id }) => !selected.has(id));
    const points = Math.max(0, Math.round(((hits.length - wrong.length) / correct.length) * 20));
    return {
      stageId: stage.id as DetectiveStageId,
      title: stage.title,
      points,
      maxPoints: 20,
      selectedIds: [...selectedIds],
      askedIds: [...askedIds],
      hits,
      wrong,
      missed,
    };
  }

  function selectedProposals(round: ReturnType<typeof scoreRound>) {
    return round.selectedIds
      .map((id) => [...round.hits, ...round.wrong].find((choice) => choice.id === id))
      .filter((choice): choice is DetectiveChoice => choice?.kind === 'proposal');
  }

  function proposalImpact(proposalIds: string[]): { boss: string; expert: string } {
    if (proposalIds.length > 1) return {
      boss: proposalIds.includes('ideas-c01')
        ? "你一邊想改網頁，一邊又想加開現場接待，我有點抓不到這禮拜到底先做哪個。你幫我選出眼前最行得通的一項，我才好去喬人手。"
        : "固定帶看和一對一短聊都需要另外安排人手，目前時段和負責人還沒排好。我們先挑本週做得到的一項，其他安排準備好再談。",
      expert: "一次把好幾個點子都列為主方案，現場人手跟時段一定會打架。我們這週先選一項最符合現有人力的做法先跑，其他需要加派人手的方案等以後再安排。",
    };
    const proposalId = proposalIds[0];
    if (proposalId === 'ideas-c01') return {
      boss: "介紹頁可以用現有網站來做，接上這週排好的名額，不用另外找人帶參觀或單獨聊。",
      expert: "先在現有網頁上集中解答大家最常問的流程跟時間，不增加額外排班負擔，這週馬上就能動手做；至於客人反饋如何，我們上線後再來持續觀察。",
    };
    if (proposalId === 'ideas-c05') return {
      boss: "固定帶看能讓新朋友親眼看到場地，出發點很好；但我這週根本還沒排定帶看的人員跟空檔，要是客人上門了卻沒人接待，反而會讓人家枯等。",
      expert: "現場帶看確實有當面解說的優勢，但這週班表完全沒排這項人手。提方案前必須先向店裡確認誰能負責、哪個時段接得住，才能列為當週主方案。",
    };
    if (proposalId === 'ideas-c06') return {
      boss: "一對一聊聊確實能照顧個別客人的顧慮，但每一組都要專人陪著談，我們這週值班人手有限、教練又在上課，沒確認接得住之前我不敢貿然答應。",
      expert: "一對一諮詢雖然貼心，但每組都需要單獨安排人力，且教練在帶課絕對不能抽身。務必先確認排班與負責同仁，切忌在人手未到位前承諾開放預約。",
    };
    return {
      boss: "我們現場人手就這麼多，你先挑一個這禮拜真能做的事情吧。等方向定下來，我才好跟同事談怎麼安排。",
      expert: "提案中尚未選定本週的主打方案。建議先拿已確認的顧客痛點比對門市現有人力與準備狀況，聚焦出一項這週就能落地執行的方案。",
    };
  }

  function decisionNote(choiceId: string, missed: boolean): string {
    if (missed && choiceId === 'needs-c01') return '漏掉了新客第一次來前不清楚體驗流程這項已直接說出的困擾。';
    if (missed && choiceId === 'needs-c02') return '漏掉了顧客會詢問可預約時段的線索；把可約時間寫清楚能回應這個問題。';
    if (missed && choiceId === 'needs-c03') return '漏掉尖峰櫃檯忙於進出和電話、無法立刻接待新客的現場限制。';
    if (missed && choiceId === 'needs-c18') return '漏掉了顧客到場後不知道該找誰報到這個明確困擾。';
    if (missed && choiceId.startsWith('needs-c')) return '漏掉了一項已確認的顧客困擾；再對照客人直接說過的問題和櫃檯常聽到的詢問。';
    if (choiceId === 'needs-c04') return '把等待時間和離開原因說成已確定；目前只知道尖峰可能要等，還不知道客人為什麼先走。';
    if (choiceId === 'needs-c05' || choiceId === 'needs-c06' || choiceId === 'needs-c09') return '把詢問費用或未到場直接推成嫌貴；目前沒有顧客這樣說，應再問本人原因。';
    if (choiceId === 'needs-c07' || choiceId === 'needs-c08') return '把器材害怕或說明太快當成困擾；對話只確認了報到不清楚，還沒有這些感受的證據。';
    if (choiceId === 'needs-c12') return '把未到場歸因於忘記或沒收到提醒；紀錄沒有說明兩位客人未到的原因。';
    if (choiceId === 'needs-c14' || choiceId === 'needs-c15') return '把一次先離開延伸成不再回訪或櫃檯態度問題；這些情況都還沒問到。';
    if (choiceId === 'needs-c16') return '把資訊不完整說成預約頁故障；老闆提到網站缺少流程說明，沒有說頁面不能使用。';
    if (choiceId.startsWith('needs-c')) return '這項推論超出了目前談話能確認的範圍；下次直接問顧客當時遇到什麼。';
    if (missed && choiceId === 'persona-c01') return '漏掉小安目前尚未體驗、正在考慮第一次來的情境。';
    if (missed && choiceId === 'persona-c02') return '漏掉小安想先知道第一次體驗流程的明確需求。';
    if (missed && choiceId === 'persona-c03') return '漏掉小安到店後不確定要找誰報到的經歷。';
    if (missed && choiceId === 'persona-c04') return '漏掉小安自願分享的年齡、學生身分、兼職與空檔浮動；這些只描述小安本人。';
    if (missed && choiceId === 'persona-c09') return '漏掉小安想先看流程和時段、再自行決定的期待。';
    if (missed && choiceId.startsWith('persona-c')) return '漏掉了一項小安親口提供的資料或期待；只整理已談過的內容，不要推廣到所有新客。';
    if (choiceId === 'persona-c05') return '年齡和筆記不符：小安是22歲，不是18歲；性別和運動經驗也尚未談過，不能順手補上。';
    if (choiceId === 'persona-c12') return '把委託人林老闆的排班工作當成顧客小安的人物樣貌；要分清老闆的營運限制和顧客的生活需求。';
    if (choiceId === 'persona-c07' || choiceId === 'persona-c16') return '把報到時不知道找誰，推成害怕運動；對話沒有這種情緒或經驗的證據。';
    if (choiceId === 'persona-c06' || choiceId === 'persona-c13') return '把接待方式偏好當成已知；小安還沒說想一對一談或參加團體參觀。';
    if (choiceId === 'persona-c08') return '把一位受訪者的情況套用到所有未購買月卡的人；還需要聽其他新客怎麼說。';
    if (choiceId === 'persona-c10' || choiceId === 'persona-c14') return '推定小安只用手機或社群找資訊；這部分尚未詢問，可以直接問平常在哪裡查資料。';
    if (choiceId === 'persona-c11' || choiceId === 'persona-c15') return '推定小安怕被推銷或只在意低價；目前沒有這些說法或選擇的證據。';
    if (choiceId.startsWith('persona-c')) return '這項人物描述還缺少訪談依據；下次直接詢問小安，再決定是否納入。';
    if (missed && choiceId === 'journey-c01') return '漏掉了把流程、時段和費用集中提供的來訪前改善機會。';
    if (missed && choiceId === 'journey-c02') return '漏掉小安到店後不知道該找誰報到的明確痛點。';
    if (missed && choiceId === 'journey-c03') return '漏掉標清報到位置和第一步這項不需增加接待班表的改善方式。';
    if (missed && choiceId === 'journey-c04') return '漏掉尖峰新客可能要等櫃檯忙完才能詢問的現場摩擦。';
    if (missed && (choiceId === 'journey-c05' || choiceId === 'journey-c06')) return '漏掉體驗後提供方案資訊、讓顧客自行決定或自願分享感受的安排。';
    if (missed && choiceId.startsWith('journey-c')) return '漏掉了一項對話已支持的旅程痛點或改善機會；再依來之前、到場中、體驗後逐段核對。';
    if (choiceId === 'journey-c07' || choiceId === 'journey-c09' || choiceId === 'journey-c12') return '把分散資訊或費用直接說成顧客已放棄或取消；目前沒有這些結果的紀錄。';
    if (choiceId === 'journey-c14') return '把尚未確認的追蹤偏好說成顧客正在等電話；老闆還沒問體驗後的客人希望怎麼聯絡。';
    if (choiceId === 'journey-c08') return '補出了十分鐘的等待時間；現場沒有量過，不能用未記錄的數字下結論。';
    if (choiceId === 'journey-c10') return '把一位顧客不知道找誰報到，擴大成所有新客都害怕器材。';
    if (choiceId === 'journey-c11') return '推定顧客看不懂社群貼文；對話沒有提到社群或貼文。';
    if (choiceId === 'journey-c13') return '把預約後未到推成沒收到確認；目前沒有訊息送達紀錄。';
    if (choiceId === 'journey-c15') return '提出讓教練中途停課接待，忽略了教練不能離開正在帶的課。';
    if (choiceId === 'journey-c16') return '把補充方案說明當成顧客已看不懂月卡和年卡；目前沒有這項回饋。';
    if (choiceId.startsWith('journey-c')) return '這項旅程判斷尚未被對話或紀錄支持；先問顧客實際在哪一步遇到困難。';
    if (missed && choiceId === 'ideas-c01') return '漏掉了本週可更新的體驗介紹頁；它能集中回答流程、時段和報到問題，也可沿用現有人手。';
    if (missed && (choiceId === 'ideas-c02' || choiceId === 'ideas-c03' || choiceId === 'ideas-c04')) return '漏掉了一項支持先整理介紹頁的理由；回看客人常問的內容、現有網頁和櫃檯能覆核的條件。';
    if (missed && choiceId.startsWith('ideas-c')) return '漏掉了一項和本週主方案有關的判斷；先比對顧客需要、已排人力和方案是否能立即開始。';
    if (choiceId === 'ideas-c05' || choiceId === 'ideas-c06') return '方案需要新增帶看或逐一短談的人力，這週尚未排出班表；先問清楚負責人和可服務時段。';
    if (choiceId === 'ideas-c07' || choiceId === 'ideas-c11' || choiceId === 'ideas-c15') return 'AI只能協助整理草稿或匿名問題，不能代替人工核對，更不能判定個人訓練安全或顧客偏好。';
    if (choiceId === 'ideas-c08' || choiceId === 'ideas-c12') return '預約或銷售數字不能單獨證明體驗改善，也不能保證月卡增加；還要看流程是否清楚並聽取顧客回饋。';
    if (choiceId === 'ideas-c09') return '目前沒有顧客偏好團體參觀的證據；先詢問幾位新客，再決定接待方式。';
    if (choiceId === 'ideas-c10') return '目前沒有正式報價，能比較的是所需時間與協作人力；先取得實際報價再談成本。';
    if (choiceId === 'ideas-c13' || choiceId === 'ideas-c14') return '新增名額或請教練離開課堂會超出已安排的人力；先核對可接待時段，不要先對客人承諾。';
    if (choiceId === 'ideas-c16') return '時段資訊變動後應同步更新或暫停預約；保留過期內容會讓客人依錯誤資訊安排。';
    if (missed && choiceId === 'blueprint-c01') return '漏掉顧客看完介紹後自行選時段、決定是否預約的步驟。';
    if (missed && choiceId === 'blueprint-c02') return '漏掉顧客看得到的流程、更新日期和聯絡方式，這些資訊能讓他知道如何預約或詢問。';
    if (missed && choiceId === 'blueprint-c03') return '漏掉同事在開放預約前核對已排名額並更新頁面的後台工作。';
    if (missed && choiceId === 'blueprint-c04') return '漏掉用預約表和班表核對名額、確認當天由誰接待的支援方式。';
    if (missed && choiceId === 'blueprint-c05') return '漏掉系統故障時紙本登記、標記待確認並在恢復後核對的備案。';
    if (missed && choiceId.startsWith('blueprint-c')) return '漏掉一段顧客行動、前台接待、後台準備或故障備案；逐段確認每件事由誰負責。';
    if (choiceId === 'blueprint-c06' || choiceId === 'blueprint-c09') return '內部名單與權限只交給需要處理的同事；先確認工作分工和資料存取範圍。';
    if (choiceId === 'blueprint-c07' || choiceId === 'blueprint-c13') return '教練不能中途離開課堂；接待或故障處理要交給當班人員，或安排確實有空的時段。';
    if (choiceId === 'blueprint-c08' || choiceId === 'blueprint-c10' || choiceId === 'blueprint-c15') return '把顧客要做的事和店內準備混在一起；應分清顧客看到的預約與報到流程，以及同事在後台核對的工作。';
    if (choiceId === 'blueprint-c11' || choiceId === 'blueprint-c12') return '系統出問題時不能先承諾名額，也不能只留失效連結；應紙本登記並標記待確認，恢復後逐筆核對。';
    if (choiceId === 'blueprint-c14') return '個人訓練與安全問題要交給合適的教練確認，不能讓 AI 代替專業判斷或作出保證。';
    if (choiceId === 'blueprint-c16') return '月卡銷量無法告訴同事每天的預約時段和接待需求；要對照預約紀錄與當日班表。';
    if (missed) return '漏掉一項已由情境支持的資訊；回到本輪談話，找出顧客直接說過的需要或現場已具備的安排。';
    return '這項判斷需要再對照情境中的實際紀錄；下次先問清楚當時發生什麼，再把推測和已知分開。';
  }

  function bossConcern(choiceId: string, missed: boolean): string {
    if (missed && choiceId === 'needs-c18') return "你剛才漏掉了客人進門不知道該找誰這件事，這在現場真的很常見，我得趕快先把門口的報到動線標示清楚。";
    if (missed && choiceId.startsWith('needs-c')) return "剛才有一項客人親口反映過的困難沒被列進去。我想先把這點補齊，不然現場同事每天還是會被同樣的問題卡住。";
    if (choiceId === 'needs-c04') return '櫃檯忙歸忙，客人走掉是不是因為等不及，我當時真的沒問到。照這個原因去改，可能忙了半天還沒幫到客人。';
    if (choiceId === 'needs-c06') return '那兩位沒來的客人，我們還沒問到原因，也不知道是不是學生；現在就當成價格問題，我會擔心改錯地方。';
    if (choiceId === 'needs-c12') return '那兩位為什麼沒來，我還沒問到。提醒有沒有收到、是不是忘了，得先問清楚，才知道要改哪裡。';
    if (choiceId === 'needs-c05' || choiceId === 'needs-c09') return "有人問過費用，但沒告訴我們是不是因為價格才不預約或不買卡。這部分我想再找機會問清楚。";
    if (choiceId === 'needs-c07' || choiceId === 'needs-c08') return "來問的客人從沒說過害怕重訓器材，也沒抱怨教練講太快，我們不能憑空替客人扣上這些沒說過的情緒帽子。";
    if (choiceId === 'persona-c05') return "那位同學那天親口跟我說他是22歲的大學生，不是18歲；其他沒聊過的生活背景，我們就先別自己隨便腦補。";
    if (choiceId === 'persona-c12') return "店裡尖峰櫃檯忙不過來、教練不能離課，這是我這邊的經營難題，不是客人的需求；這兩碼子事我們得切開來看。";
    if (choiceId.startsWith('persona-c')) return missed
      ? "顧客樣貌裡還少了一項那位同學親自提過的狀況，我們回頭對一下那天聊天的內容，把漏掉的那一點補上去。"
      : "客人平常怎麼查資料、偏好哪種接待方式，我那天根本沒問到；沒經過本人證實的事情，千萬不能直接當成已知事實。";
    if (choiceId.startsWith('journey-c')) return missed
      ? "旅程中有一步客人切身遇到的困擾似乎被漏掉了，我得把那一步的指引補好，客人走進來才不會卡在半路上。"
      : choiceId === 'journey-c15'
        ? "教練在帶課或顧動作時絕對不能離開教室，這種抽調教練的安排現場完全行不通，我們得換個符合現場人手的方式。"
        : "客人心裡到底在想什麼、猶豫的原因是什麼，目前都還沒人去問過；我會找機會親口向客人問清楚，而不是在這邊亂猜。";
    if (choiceId.startsWith('ideas-c')) return missed
      ? choiceId === 'ideas-c01'
        ? "這週最容易落地的做法還沒定下來。在現有網站加一頁介紹，現有的人手就能搞定，我希望把這項當作第一優先考量。"
        : "支撐這個方案的依據還少了一塊。我必須再次確認這個做法到底有沒有真正打中客人最常問的流程跟時段痛點。"
      : "我很怕方案推下去之後，客人依舊看不懂，或是店裡承諾了根本做不到的事。我們一定要先把現有人手跟事實依據核對清楚。";
    if (choiceId.startsWith('blueprint-c')) return missed
      ? "藍圖裡還有一段現場接待跟出狀況時的應變沒講明白，現場同事遇到突發狀況必須知道該由誰接手，才不會手足無措。"
      : "這樣的分工和資料使用方式，我還不太放心。得再確認每件事由誰負責、哪些資料需要交給誰，現場才接得起來。";
    return "我還是有點擔心現場執行時會漏掉細節，我得先跟值班同事把班表跟名額徹底對過一遍，確認萬無一失才敢對外公開。";
  }

  function genericBossComment(score: number, rounds: ReturnType<typeof scoreRound>[]): string {
    const proposals = selectedProposals(rounds[3]);
    const issue = rounds.flatMap(({ wrong }) => wrong)[0] ?? rounds.flatMap(({ missed }) => missed)[0];
    const strongest = rounds.flatMap(({ hits }) => hits)[0];
    const evidence = issue ? `我想先補清楚這點：${issue.explanation}` : '你把需要處理的線索和執行條件都整理到位了。';
    const recognition = strongest ? `你有抓到「${strongest.label}」這項重點。` : '';
    if (proposals.length !== 1) {
      const selection = proposals.length > 1
        ? '你列了好幾個主方案，我還不知道要先安排哪一個。'
        : '主方案還沒定下來，我暫時沒辦法安排下一步。';
      return `【虛構客戶角色的模擬反應】${selection}${recognition}${evidence}我們先挑一項符合目前條件的做法，再確認由誰負責和什麼時候開始。`;
    }

    const proposal = proposals[0];
    if (!proposal.correct) {
      return `【虛構客戶角色的模擬反應】這個主方案我先不採用。${proposal.explanation}${issue && issue.id !== proposal.id ? `另外，${issue.explanation}` : ''}我們先依這些情況重新比較做法，確認接得住後再開始。`;
    }
    if (score < 60) {
      return `【虛構客戶角色的模擬反應】這個主方案方向可以保留，但我想先把其他判斷補完整。${recognition}${evidence}補清楚以前先不開始，等確認後再和同事安排試做。`;
    }
    if (score === 100) {
      return `【虛構客戶角色的模擬反應】你把顧客需要、主方案和執行安排都整理得很完整。我願意和同事照這個方向開始準備，試做後再聽顧客怎麼說。`;
    }
    return `【虛構客戶角色的模擬反應】這個主方案方向可以採用。${recognition}${evidence}我會先和同事核對細節，再安排小範圍試做。`;
  }

  function genericExpertComment(detectiveCase: DetectiveCase, rounds: ReturnType<typeof scoreRound>[], score: number): string {
    const proposals = selectedProposals(rounds[3]);
    const weakest = rounds.reduce((lowest, round) => round.points < lowest.points ? round : lowest, rounds[0]);
    const issue = weakest.wrong[0] ?? weakest.missed[0];
    if (score === 100) {
      return `【教學專家角色講評（虛構情境）】本案例「${detectiveCase.title}」得分100分，顧客線索、主方案與執行安排都已完整對應情境。這份規劃具備開始驗證的條件；下一步觀察顧客能否順利完成流程，並依現場回饋調整。`;
    }

    const issueExplanation = issue
      ? `最需要修正的是${issue.correct ? '漏選' : '誤選'}「${issue.label}」：${issue.explanation}`
      : '目前沒有漏選或誤選的卡片，可把重點放在驗證方案成效。';
    if (proposals.length !== 1) {
      const proposalState = proposals.length > 1
        ? '同時選了多個主方案，決策還沒有聚焦。'
        : '尚未選定唯一主方案，決策還沒有定案。';
      return `【教學專家角色講評（虛構情境）】本案例得分${score}分；${proposalState}${issueExplanation}下一步回到案例證據，選定一個方案並寫明負責人。`;
    }

    const proposal = proposals[0];
    if (!proposal.correct) {
      return `【教學專家角色講評（虛構情境）】本案例得分${score}分；這個主方案暫不採用。${proposal.explanation}${issue && issue.id !== proposal.id ? ` ${issueExplanation}` : ''}先依情境證據重新比較，確認方案符合顧客需要與執行條件後再開始。`;
    }
    if (score < 60) {
      return `【教學專家角色講評（虛構情境）】本案例得分${score}分；主方案「${proposal.label}」的方向可以保留，但整體準備尚未完成。${issueExplanation}先補足這項判斷再開始試做。`;
    }
    return `【教學專家角色講評（虛構情境）】本案例得分${score}分；主方案「${proposal.label}」符合案例條件。${issueExplanation}完成核對後，再小範圍試做並觀察成效。`;
  }

  function bossComment(score: number, rounds: ReturnType<typeof scoreRound>[]): string {
    const proposals = selectedProposals(rounds[3]);
    const impact = proposalImpact(proposals.map(({ id }) => id));
    if (detectiveCase.id !== chapterTwoCase.id) return genericBossComment(score, rounds);
    const prefix = '【虛構客戶角色的模擬反應】';
    if (proposals.length !== 1) return prefix + impact.boss;
    if (score === 100) return prefix + '你把我們剛才提到的新客困擾都抓得很準！介紹頁能先把流程、時段和報到方式講清楚，也有顧到這週的人手、名額和出狀況時怎麼接。我願意和同事照這個方向先試，再看看客人用起來順不順。';
    const needs = rounds[0];
    const evidence = needs.points === needs.maxPoints
      ? '你把剛才談到的新客困擾都抓得很準，這幾點確實該先解決。'
      : needs.hits.length > 0
        ? '前面的訪談裡，你有找到客人確實碰到的困擾，不過還有幾點要再核對。'
        : '不過聽完後，我原本擔心客人遇到的那些麻煩，好像還沒被照顧到，這部分我有點不放心。';
    const issue = rounds.flatMap(({ wrong }) => wrong)[0] ?? rounds.flatMap(({ missed }) => missed)[0];
    const concern = issue && issue.kind !== 'proposal' ? bossConcern(issue.id, issue.correct) : '';
    const next = proposals[0]?.id === 'ideas-c01'
      ? score < 60 ? '方向可以保留，但前面這些問題補清楚後，我才比較放心開始。' : '先把這部分補好，我再和同事確認怎麼試。'
      : '這份安排還需要再調整，我現在不能先對客人開放。';
    return prefix + impact.boss + evidence + concern + next;
  }

  function expertComment(rounds: ReturnType<typeof scoreRound>[], score: number): string {
    if (detectiveCase.id !== chapterTwoCase.id) return genericExpertComment(detectiveCase, rounds, score);
    const prefix = '【教學專家角色講評（虛構情境）】';
    if (score === 100) return prefix + '這份提案完整切中了現場的實際狀況，也充分考慮到了現有人力。你把新客的流程與報到問題，接到本週能做的介紹頁，還安排了同事核對名額及系統故障時的備用做法。這讓提案從想法走到了現場做得到的安排。試做後，可以持續觀察客人是否看懂流程、櫃檯重複說明是否減少，再決定下一步。';
    const proposals = selectedProposals(rounds[3]);
    const impact = proposalImpact(proposals.map(({ id }) => id));
    const weakest = rounds.reduce((lowest, round) => round.points < lowest.points ? round : lowest, rounds[0]);
    const issue = weakest.wrong[0] ?? weakest.missed[0];
    const needs = rounds[0];
    const understandsNeeds = needs.points === needs.maxPoints;
    const strength = proposals.length !== 1
      ? impact.expert
      : proposals[0]?.id === 'ideas-c01'
      ? understandsNeeds
        ? '你把新客遇到的困擾接到了本週可做的介紹頁，這個方向有顧到現場條件。'
        : '你挑中的介紹頁符合本週的人力條件，但前面的顧客困擾還需要判斷清楚；否則頁面可能寫錯重點。'
      : (understandsNeeds ? '你對新客困擾的判斷是完整的。' : '先把已確認的顧客困擾與推測分開，再來比較方案。') + impact.expert;
    const feedback = issue?.kind === 'proposal'
      ? '本週先從不用新增接待班表的方式開始；帶參觀與短聊可以保留，等人手排好再評估。'
      : issue ? decisionNote(issue.id, issue.correct) : '再確認這次主方案是否對準顧客的需要。';
    const nextQuestion = issue?.id.startsWith('ideas-') || issue?.id.startsWith('blueprint-')
      ? ''
      : issue?.id === 'persona-c05'
      ? '核對基本資料時，記得對話中是22歲，其餘未提供的背景不補上。'
      : issue?.id === 'persona-c12'
        ? '把顧客樣貌與林老闆的店內排班分開整理，兩者會影響不同的規劃決定。'
        : issue?.id.startsWith('needs-') || issue?.id.startsWith('journey-')
          ? '回頭問顧客當時哪一步不清楚、還希望知道什麼，依原話補足資料。'
          : issue?.id.startsWith('persona-')
            ? '直接問顧客平常怎麼查資料、希望怎麼了解服務，不由身分代答。'
            : issue?.id.startsWith('ideas-')
              ? '先確認負責人與可接待時段，再決定能否對外開放。'
              : '把顧客要做的事、同事的工作與出狀況時的備用做法逐一對清楚。';
    return prefix + strength + '最需要補強的是' + weakest.title + '（' + weakest.points + '/' + weakest.maxPoints + '）：' + feedback + nextQuestion;
  }

  function evaluateDetectiveSession(session: DetectiveSession): DetectiveResult | null {
    if (!isValidSession(session) || !session.started || !session.completed
      || session.rounds.some(({ submittedIds }) => submittedIds === null)) return null;
    const rounds = stages.map((_, index) => scoreRound(index, session.rounds[index].submittedIds!, session.rounds[index].askedIds));
    const score = rounds.reduce((sum, round) => sum + round.points, 0);
    const proposals = selectedProposals(rounds[3]);
    const satisfaction = proposals.length !== 1 ? '尚待定案（虛構客戶角色的模擬評價）'
      : !proposals[0]?.correct ? '暫不採用（虛構客戶角色的模擬評價）'
        : score >= 90 ? '高度滿意（虛構客戶角色的模擬評價）'
      : score >= 75 ? '滿意（虛構客戶角色的模擬評價）'
        : score >= 60 ? '部分滿意（虛構客戶角色的模擬評價）'
          : score >= 40 ? '尚待補強（虛構客戶角色的模擬評價）'
            : '不滿意（虛構客戶角色的模擬評價）';
    const totalHits = rounds.reduce((sum, round) => sum + round.hits.length, 0);
    const totalWrong = rounds.reduce((sum, round) => sum + round.wrong.length, 0);
    const totalMissed = rounds.reduce((sum, round) => sum + round.missed.length, 0);
    const grade = gradeForScore(score);
    const eligibleForTopGrade = proposals.length === 1 && proposals[0].correct;
    return {
      score,
      grade: grade === 'S' && !eligibleForTopGrade ? 'A' : grade,
      satisfaction,
      bossComment: bossComment(score, rounds),
      expertComment: expertComment(rounds, score),
      rounds,
      totalHits,
      totalWrong,
      totalMissed,
    };
  }

  function detectiveViewForRound(index: number): PlanningPreviewView {
    return Number.isInteger(index) && index >= 0 && index < roundViews.length ? roundViews[index] : 'brief';
  }

  function normalizeView(view: string): PlanningPreviewView {
    let candidate = view;
    const chapterNumber = /-chapter-(\d+)$/.exec(detectiveCase.id)?.[1] ?? '3';
    const routeId = detectiveCase.id.replace(/-chapter-\d+$/, '');
    const match = new RegExp('^#/quiz/' + routeId + '/chapter-' + chapterNumber + '/([^/?#]+)$').exec(view);
    if (view.startsWith('#/quiz/')) {
      if (!match) return 'brief';
      candidate = match[1];
    }
    if (candidate === 'result') return 'review';
    return safeViews.includes(candidate as PlanningPreviewView) ? candidate as PlanningPreviewView : 'brief';
  }

  function resolveDetectiveView(view: string, session: DetectiveSession): PlanningPreviewView {
    if (!isValidSession(session) || !session.started) return 'brief';
    const requested = normalizeView(view);
    if (session.completed) return requested;
    if (requested === 'brief') return 'brief';
    if (requested === 'review') return detectiveViewForRound(currentDetectiveRound(session));
    const requestedIndex = roundViews.indexOf(requested);
    return requestedIndex > currentDetectiveRound(session) ? detectiveViewForRound(currentDetectiveRound(session)) : requested;
  }


    return {
      newDetectiveSession,
      beginDetectiveSession,
      currentDetectiveRound,
      askDetectiveQuestion,
      setDetectiveChoice,
      commitDetectiveRound,
      evaluateDetectiveSession,
      detectiveViewForRound,
      resolveDetectiveView,
    };
}

export type DetectiveEngine = ReturnType<typeof createDetectiveEngine>;

const chapterTwoEngine = createDetectiveEngine(chapterTwoCase);
export const newDetectiveSession = chapterTwoEngine.newDetectiveSession;
export const beginDetectiveSession = chapterTwoEngine.beginDetectiveSession;
export const currentDetectiveRound = chapterTwoEngine.currentDetectiveRound;
export const askDetectiveQuestion = chapterTwoEngine.askDetectiveQuestion;
export const setDetectiveChoice = chapterTwoEngine.setDetectiveChoice;
export const commitDetectiveRound = chapterTwoEngine.commitDetectiveRound;
export const evaluateDetectiveSession = chapterTwoEngine.evaluateDetectiveSession;
export const detectiveViewForRound = chapterTwoEngine.detectiveViewForRound;
export const resolveDetectiveView = chapterTwoEngine.resolveDetectiveView;

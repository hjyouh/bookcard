import { ReadingCard } from "@/lib/types";
import { createId, nowIso } from "@/lib/utils";

export function createSampleCards(): ReadingCard[] {
  const now = nowIso();

  return [
    {
      id: createId("card"),
      owner_id: null,
      local_id: createId("local"),
      title: "질문으로 남긴 문장",
      author: "김영하",
      book_title: "여행의 이유",
      question: "익숙한 장소를 떠나는 일이 내 사고를 어떻게 넓혀 주는가?",
      keywords: ["여행", "시야", "일상"],
      memo: "장소가 바뀌면 감정의 속도도 달라진다는 문장이 오래 남았다.",
      purchase_link: "",
      summary: "여행은 탈출이 아니라 나를 새롭게 읽는 방식이었다.",
      action_note: "다음 산책 때도 일부러 다른 길로 돌아가 보기.",
      attachments: [],
      color_theme: "butter",
      visibility: "alone",
      read_status: "reading",
      created_at: now,
      updated_at: now,
      deleted_at: null,
      sync_status: "pending_create",
    },
    {
      id: createId("card"),
      owner_id: null,
      local_id: createId("local"),
      title: "작은 습관의 방향",
      author: "제임스 클리어",
      book_title: "아주 작은 습관의 힘",
      question: "행동 목표보다 정체성 목표가 더 오래가는 이유는 무엇일까?",
      keywords: ["습관", "정체성", "실행"],
      memo: "습관은 결과보다 자기 인식에 가까운 시스템이라는 관점이 유용했다.",
      purchase_link: "",
      summary: "지속 가능한 변화는 '무엇을 할까'보다 '어떤 사람이 될까'에서 시작된다.",
      action_note: "아침 독서 10분을 체크리스트 대신 정체성 문장으로 적기.",
      attachments: [],
      color_theme: "mint",
      visibility: "alone",
      read_status: "unread",
      created_at: now,
      updated_at: now,
      deleted_at: null,
      sync_status: "pending_create",
    },
  ];
}

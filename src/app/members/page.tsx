export default function MembersPage() {
  return (
    <section className="space-y-4">
      <div className="rounded-[1.5rem] border border-line bg-surface p-6 shadow-card">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted">Members</p>
        <h2 className="mt-2 text-2xl font-semibold text-stone-950">멤버 관리</h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          모든 사용자가 친구를 관리하고, 카드 공개 범위를 <strong>Only Me</strong>, <strong>With Friends</strong>,
          <strong> Share All</strong>로 나눠 쓸 수 있게 준비한 영역입니다.
        </p>
      </div>

      <div className="rounded-[1.5rem] border border-line bg-surface p-5 shadow-card">
        <h3 className="text-base font-semibold text-stone-900">다음 단계에서 연결될 기능</h3>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-muted">
          <li>친구 검색과 친구 요청</li>
          <li>친구별 카드 공유</li>
          <li>Share All 공개 카드 열람</li>
        </ul>
      </div>
    </section>
  );
}

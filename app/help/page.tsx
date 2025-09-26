const faqs = [
  {
    question: '펀딩은 어떻게 진행되나요?',
    answer:
      '프로젝트 오픈 → 팬 서포트 → 목표 달성 시 정산 및 리워드 제공 순으로 진행됩니다. Stripe 테스트 결제를 활용해 미리 시뮬레이션할 수 있습니다.'
  },
  {
    question: '파트너 검수는 얼마나 걸리나요?',
    answer: '제출 후 영업일 기준 3~5일 소요되며, 결과는 이메일로 안내드립니다.'
  },
  {
    question: '정산 리포트는 어디에서 확인하나요?',
    answer: '프로젝트 상세 페이지의 Settlement 탭에서 확인할 수 있습니다.'
  }
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 pb-20">
      <header className="pt-6">
        <h1 className="text-3xl font-semibold text-white">도움말 & FAQ</h1>
        <p className="mt-2 text-sm text-white/60">서비스 이용 중 자주 묻는 질문을 정리했습니다.</p>
      </header>
      <section className="mt-10 space-y-4">
        {faqs.map((faq) => (
          <article key={faq.question} className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-semibold text-white">{faq.question}</h2>
            <p className="mt-2 text-sm text-white/60">{faq.answer}</p>
          </article>
        ))}
      </section>
    </div>
  );
}

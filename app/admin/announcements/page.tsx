import { AnnouncementComposer } from './_components/announcement-composer';
import { AnnouncementList } from './_components/announcement-list';

export default function AdminAnnouncementsPage() {
  return (
    <div className="space-y-10 py-12">
      <section className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-blue-300/80">Announcements</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">공지 관리</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/70">
            플랫폼 전체 사용자에게 전달되는 공지를 작성하고 발행 일정을 관리하세요. 공지 등록과 동시에
            알림이 발송되며, 상단 고정 및 예약 발행을 통해 중요도를 조정할 수 있습니다.
          </p>
        </div>
        <AnnouncementComposer />
      </section>

      <section>
        <AnnouncementList />
      </section>
    </div>
  );
}

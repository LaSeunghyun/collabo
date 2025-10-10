// import { getServerSession } from 'next-auth';
// import { authOptions } from '@/lib/auth/options';
import { PartnerRegistrationPanel } from './partner-registration-panel';

const statusBadge = (verified: boolean) =>
  verified ? '?�증' : '검?�중';

export default async function PartnersPage() {
  // const session = await getServerSession(authOptions);
  // const user = session?.user;

  try {
    // ?�시�?�??�트???�이???�용
    const partners = [];

    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 pb-20">
        <header className="pt-6">
          <h1 className="text-3xl font-semibold text-white">?�트??매칭</h1>
          <p className="mt-2 text-sm text-white/60">
            ?�티?�트?� ?�트?��? ?�결?�는 ?�랫?�입?�다. ?�양???�트?��? ?�업?�여 ???��? ?�로?�트�?만들?�보?�요.
          </p>
        </header>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">?�트??목록</h2>
            <div className="text-sm text-white/60">
              �?{partners.length}개의 ?�트??
            </div>
          </div>

          {partners.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {partners.map((partner) => (
                <div
                  key={partner.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-white/20"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <h3 className="text-lg font-semibold text-white">
                        {partner.name}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        partner.verified 
                          ? 'bg-green-500/10 text-green-300' 
                          : 'bg-yellow-500/10 text-yellow-300'
                      }`}>
                        {statusBadge(partner.verified)}
                      </span>
                    </div>

                    <p className="text-sm text-white/70 line-clamp-3">
                      {partner.description}
                    </p>

                    <div className="space-y-2 text-xs text-white/60">
                      <div className="flex items-center gap-2">
                        <span>?�치:</span>
                        <span>{partner.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>?�??</span>
                        <span>{partner.type}</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
                        ?�락?�기
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-12 text-center">
              <p className="text-white/60">?�록???�트?��? ?�습?�다.</p>
            </div>
          )}
        </section>

        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-white">?�트???�록</h2>
          <PartnerRegistrationPanel />
        </section>
      </div>
    );
  } catch (error) {
    console.error('Failed to load partners data:', error);
    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 pb-20">
        <header className="pt-6">
          <h1 className="text-3xl font-semibold text-white">?�트??매칭</h1>
          <p className="mt-2 text-sm text-white/60">
            ?�티?�트?� ?�트?��? ?�결?�는 ?�랫?�입?�다.
          </p>
        </header>
        <div className="text-center py-12">
          <p className="text-white/60">?�이?��? 불러?????�습?�다.</p>
        </div>
      </div>
    );
  }
}

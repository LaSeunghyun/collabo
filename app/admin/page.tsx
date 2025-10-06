import { getAnalyticsOverview } from '@/lib/server/analytics';

import { AnalyticsOverviewSection } from './_components/analytics-overview-section';
import { ModerationReportSection } from './_components/moderation-report-section';
import { PartnerApprovalSection } from './_components/partner-approval-section';
import { ProjectReviewSection } from './_components/project-review-section';
import { SettlementQueueSection } from './_components/settlement-queue-section';

export default async function AdminDashboardPage() {
  const overview = await getAnalyticsOverview();

  return (
    <div className="space-y-8">
      {/* ?§Îçî */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Í¥ÄÎ¶¨Ïûê ?Ä?úÎ≥¥??/h1>
        <p className="mt-2 text-gray-600">
          ?åÎû´???ÑÌô©???úÎàà???ïÏù∏?òÍ≥† Í¥ÄÎ¶¨Ìïò?∏Ïöî.
        </p>
      </div>

      {/* Ï£ºÏöî ÏßÄ??Ïπ¥Îìú */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Ï¥?Î∞©Î¨∏??/p>
              <p className="text-2xl font-semibold text-gray-900">{overview.totalVisits.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">?†Í∑ú Í∞Ä?ÖÏûê</p>
              <p className="text-2xl font-semibold text-gray-900">{overview.uniqueUsers.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">?úÏÑ± ?ÑÎ°ú?ùÌä∏</p>
              <p className="text-2xl font-semibold text-gray-900">{overview.activeUsers.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Ï¥?Í±∞Îûò??/p>
              <p className="text-2xl font-semibold text-gray-900">??</p>
            </div>
          </div>
        </div>
      </div>

      {/* ?πÏÖò??*/}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AnalyticsOverviewSection overview={overview} />
        <ProjectReviewSection />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <PartnerApprovalSection />
        <ModerationReportSection />
      </div>
      
      <SettlementQueueSection />
    </div>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Clock, MapPin } from 'lucide-react';
import { churchConfig } from '../data/churchConfig';
import { filterActivities, type ActivityStatus } from '../utils/churchLogic';
import { PageHeader } from '../components/PageHeader';
import { ResilientImage } from '../components/ResilientImage';

type FilterOption = 'all' | ActivityStatus;

export function ActivitiesPage() {
  const [filter, setFilter] = useState<FilterOption>('all');
  const displayed = filterActivities(churchConfig.activities, filter);

  return (
    <div>
      <PageHeader
        eyebrow="Calendar & Programmes"
        title="Church Activities & Gatherings"
        description="Conferences, neighborhood outreach days, seasonal worship evenings, and youth programmes open to our congregation and local community."
      />

      <section className="py-14 sm:py-16">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          {/* Interactive Segmented Filter Control */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-[#E5E0D8]">
            <div
              role="group"
              aria-label="Filter activities by status"
              className="inline-flex items-center gap-1 p-1 bg-[#F2EFE9] border border-[#E5E0D8] rounded-lg self-start"
            >
              {(
                [
                  { id: 'all', label: 'All Activities' },
                  { id: 'upcoming', label: 'Upcoming' },
                  { id: 'completed', label: 'Completed' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  aria-pressed={filter === tab.id}
                  className={`px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                    filter === tab.id
                      ? 'bg-white text-[#18181B] shadow-xs'
                      : 'text-[#52525B] hover:text-[#18181B]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <p className="text-xs text-[#71717A] tabular-nums">
              Showing {displayed.length}{' '}
              {displayed.length === 1 ? 'programme' : 'programmes'}
            </p>
          </div>

          {displayed.length === 0 ? (
            <div className="py-16 text-center bg-white border border-[#E5E0D8] rounded-xl mt-8">
              <p className="font-serif text-xl text-[#18181B]">
                No activities match this filter right now.
              </p>
              <button
                type="button"
                onClick={() => setFilter('all')}
                className="mt-4 px-4 py-2 text-sm font-medium text-[#1B365D] border border-[#D6D0C4] rounded-lg hover:bg-[#F2EFE9] transition-colors"
              >
                Show All Activities
              </button>
            </div>
          ) : (
            <div className="mt-8 space-y-6">
              {displayed.map((activity) => (
                <article
                  key={activity.id}
                  className="bg-white border border-[#E5E0D8] rounded-xl overflow-hidden flex flex-col md:flex-row"
                >
                  {activity.image && (
                    <div className="md:w-72 lg:w-80 shrink-0 aspect-[16/10] md:aspect-auto overflow-hidden border-b md:border-b-0 md:border-r border-[#E5E0D8]">
                      <ResilientImage
                        src={activity.image}
                        alt={activity.title}
                        className="w-full h-full object-cover"
                        containerClassName="w-full h-full min-h-[200px]"
                      />
                    </div>
                  )}

                  <div className="flex-1 p-6 sm:p-7 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#71717A]">
                        <span
                          className={`font-semibold uppercase tracking-wider ${
                            activity.status === 'upcoming'
                              ? 'text-[#14532D]'
                              : 'text-[#71717A]'
                          }`}
                        >
                          {activity.status}
                        </span>
                        <span aria-hidden="true">&middot;</span>
                        <span>{activity.category}</span>
                      </div>

                      <h2 className="font-serif text-2xl font-semibold text-[#18181B] mt-2">
                        {activity.title}
                      </h2>
                      <p className="mt-2.5 text-sm sm:text-base text-[#52525B] leading-relaxed max-w-3xl">
                        {activity.description}
                      </p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-[#E5E0D8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#52525B] tabular-nums">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#1B365D]" aria-hidden="true" />
                          <span>{activity.date}</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#1B365D]" aria-hidden="true" />
                          <span>{activity.time}</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#1B365D]" aria-hidden="true" />
                          <span>{activity.venue}</span>
                        </span>
                      </div>

                      {activity.registrationHref && activity.status === 'upcoming' && (
                        <Link
                          to={activity.registrationHref}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1B365D] hover:underline whitespace-nowrap shrink-0"
                        >
                          <span>{activity.registrationLabel || 'Inquire'}</span>
                          <ArrowRight className="w-4 h-4" aria-hidden="true" />
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

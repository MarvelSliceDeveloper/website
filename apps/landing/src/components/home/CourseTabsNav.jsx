import {
  FiCheck, FiStar, FiAward, FiArrowRight, FiCircle, FiZap, FiHeart, FiThumbsUp,
} from 'react-icons/fi';
import Tabs from '../ui/Tabs';
import Reveal from '../ui/Reveal';

const iconMap = {
  FiCheck, FiStar, FiAward, FiArrowRight, FiCircle, FiZap, FiHeart, FiThumbsUp,
};

function TabPanel({ tab }) {
  const text = tab.text || tab.content || '';
  const bullets = tab.bullets || [];
  const hasImage = !!tab.image_url;
  const imageRight = tab.layout !== 'right';

  if (!text && !hasImage && bullets.length === 0) {
    return <div className="text-text-gray text-base leading-relaxed">{text}</div>;
  }

  return (
    <div className={`flex flex-col ${hasImage ? 'lg:flex-row' : ''} gap-6 lg:gap-8 items-center`}>
      <div className={hasImage ? 'lg:w-[65%]' : 'w-full'}>
        {text && (
          <div className="text-text-gray text-base leading-relaxed whitespace-pre-line">
            {text}
          </div>
        )}
        {bullets.length > 0 && (
          <ul className="mt-5 space-y-3">
            {bullets.map((b, i) => {
              const Icon = iconMap[b.icon] || FiCheck;
              return (
                <li key={i} className="flex items-start gap-3 text-text-gray text-base">
                  <Icon className="w-5 h-5 text-brand-orange shrink-0 mt-0.5" />
                  <span>{b.text}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {hasImage && (
        <div className="lg:w-[35%] shrink-0">
          <img
            src={tab.image_url}
            alt=""
            className="w-full h-64 object-cover rounded-xl shadow-sm border border-gray-100"
          />
        </div>
      )}
    </div>
  );
}

export default function CourseTabsNav({ section }) {
  if (!section) return null;

  const content = section.content || {};
  const tabs = content.tabs || [];

  if (tabs.length === 0) return null;

  return (
    <section className="py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {content.heading && (
          <Reveal as="h2" className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold text-dark-navy text-center mb-2">
            {content.heading}
          </Reveal>
        )}
        {content.subheading && (
          <Reveal as="p" className="text-text-gray text-center text-sm sm:text-base mb-6 sm:mb-8 max-w-2xl mx-auto">
            {content.subheading}
          </Reveal>
        )}
        <Reveal>
          <Tabs
            tabs={tabs.map((t) => t.label)}
            panels={tabs.map((tab, i) => (
              <div key={i} className="pt-6">
                <TabPanel tab={tab} />
              </div>
            ))}
          />
        </Reveal>
      </div>
    </section>
  );
}

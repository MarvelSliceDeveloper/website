import { Tab } from '@headlessui/react';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function Tabs({ tabs, panels, className = '' }) {
  return (
    <div className={className}>
      <Tab.Group>
        <Tab.List className="flex sm:flex-wrap items-center gap-2 sm:gap-3 border-b border-gray-200 pb-px overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          {tabs.map((tab) => (
            <Tab
              key={tab}
              className={({ selected }) =>
                classNames(
                  'px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-medium rounded-t-lg transition-colors outline-none whitespace-nowrap shrink-0',
                  selected
                    ? 'bg-brand-blue text-white shadow-sm'
                    : 'text-text-gray hover:text-brand-blue hover:bg-gray-100'
                )
              }
            >
              {tab}
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels className="mt-6 sm:mt-8">
          {panels.map((panel, idx) => (
            <Tab.Panel key={idx}>{panel}</Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}

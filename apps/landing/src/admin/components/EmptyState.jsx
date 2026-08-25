import { FiInbox } from "react-icons/fi";
import AddButton from "./AddButton";

export default function EmptyState({ icon: Icon = FiInbox, title = "Nothing here yet", description = "", action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-14 h-14 rounded-full bg-admin-100 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-admin-400" />
      </div>
      <p className="text-sm font-medium text-black mb-1">{title}</p>
      {description && <p className="text-sm text-neutral-500 mb-4 text-center max-w-sm">{description}</p>}
      {action && (
        action.to ? (
          <AddButton to={action.to} label={action.label} />
        ) : (
          <AddButton onClick={action.onClick} label={action.label} />
        )
      )}
    </div>
  );
}

import { FiAlertCircle } from "react-icons/fi";
import { CancelButton, SubmitButton } from "./FormButtons";

export default function SaveCancelBar({
  saving,
  saved,
  saveError,
  onSave,
  onDiscard,
  submitLabel = "Save",
  savingLabel = "Saving...",
  savedLabel = "Saved!",
}) {
  return (
    <div>
      <div className="flex justify-center items-center gap-4 mt-4 mb-2">
        {onDiscard && <CancelButton onClick={onDiscard} disabled={saving} />}
        <SubmitButton
          saving={saving}
          saved={saved}
          onClick={onSave}
          label={submitLabel}
          savingLabel={savingLabel}
          savedLabel={savedLabel}
        />
      </div>
      {saveError && (
        <div className="flex justify-center text-red-500 text-xs mt-1 font-medium">
          <FiAlertCircle className="w-4 h-4 mr-1.5" />
          {saveError}
        </div>
      )}
    </div>
  );
}

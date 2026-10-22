import type { AgeBand } from './audience';
import { ageBands } from './audience';
import './learning-widgets.css';

type AgeBandPickerProps = {
  value: AgeBand;
  onChange(value: AgeBand): void;
};

export function AgeBandPicker({ value, onChange }: AgeBandPickerProps) {
  return (
    <fieldset className="learning-band-picker" data-testid="group-age-band">
      <legend className="learning-widget-legend">Choose a learning path</legend>
      <p className="learning-widget-intro">
        Pick the age range that feels right. This is self-reported guidance, not identity verification.
        You do not need to share an exact birth date.
      </p>
      <div className="learning-band-options">
        {ageBands.map((band) => {
          const selected = value === band.id;
          return (
            <button
              className={`learning-band-option${selected ? ' is-selected' : ''}`}
              type="button"
              key={band.id}
              aria-pressed={selected}
              onClick={() => onChange(band.id)}
              data-testid={`button-age-band-${band.id}`}
            >
              <span className="learning-band-topline">
                <span className="learning-band-label">{band.label}</span>
                <span className="learning-band-indicator" aria-hidden="true">{selected ? 'Selected' : 'Choose'}</span>
              </span>
              <strong>{band.pathName}</strong>
              <span className="learning-band-description">{band.description}</span>
            </button>
          );
        })}
      </div>
      <p className="learning-band-footnote" role="note" data-testid="status-age-band-guidance">
        A trusted adult can help choose a path if you are unsure.
      </p>
    </fieldset>
  );
}

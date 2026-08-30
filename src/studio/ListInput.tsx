import { useState } from "react";

/**
 * A comma-separated list you can actually type into.
 *
 * The obvious version — display `value.join(", ")` and parse on every
 * keystroke — cannot be typed in. Press comma and the parse drops the empty
 * trailing entry, the joined value comes back one character shorter, and the
 * comma vanishes as you type it. The same happens to any space after it.
 *
 * So the text you are editing is held locally and never read back from the
 * parsed array. The array is still updated on every keystroke, which is what
 * the canvas renders from; the two just stop fighting over the separators.
 * Callers pass `key={element.id}` so switching elements remounts with fresh
 * text.
 */
export default function ListInput({
  value,
  onChange,
  placeholder,
  className,
  title,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  className?: string;
  title?: string;
}) {
  const [text, setText] = useState((value ?? []).join(", "));

  return (
    <input
      value={text}
      title={title}
      placeholder={placeholder}
      className={className}
      onChange={(e) => {
        setText(e.target.value);
        onChange(
          e.target.value
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean),
        );
      }}
    />
  );
}

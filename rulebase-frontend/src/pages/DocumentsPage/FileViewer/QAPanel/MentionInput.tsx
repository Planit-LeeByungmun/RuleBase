import React, { useState, useRef } from 'react';
import { usersApi } from '../../../../api/users';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface UserSuggestion {
  id: number;
  username: string;
  display_name: string;
}

export function MentionInput({ value, onChange, placeholder }: Props) {
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionStart, setMentionStart] = useState(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    onChange(val);

    const cursorPos = e.target.selectionStart;
    const textBefore = val.slice(0, cursorPos);
    const atMatch = textBefore.match(/@([a-zA-Z0-9_]*)$/);

    if (atMatch) {
      setMentionStart(textBefore.length - atMatch[0].length);
      const query = atMatch[1];
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        if (query.length >= 1) {
          try {
            const res = await usersApi.search(query);
            setSuggestions(res.data.data);
            setShowSuggestions(true);
          } catch { setSuggestions([]); }
        } else {
          setShowSuggestions(false);
        }
      }, 200);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  const selectSuggestion = (user: UserSuggestion) => {
    const cursorPos = textareaRef.current?.selectionStart ?? value.length;
    const textBefore = value.slice(0, mentionStart);
    const textAfter = value.slice(cursorPos);
    onChange(`${textBefore}@${user.username} ${textAfter}`);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        rows={3}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute bottom-full left-0 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
          {suggestions.map(user => (
            <button
              key={user.id}
              type="button"
              onClick={() => selectSuggestion(user)}
              className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm"
            >
              <span className="font-medium">@{user.username}</span>
              <span className="text-gray-400 ml-2">{user.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

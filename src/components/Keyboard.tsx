import { Button } from './ui/button';
import { Delete } from 'lucide-react';

type KeyState = 'unused' | 'correct' | 'present' | 'absent';

interface KeyboardProps {
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onEnter: () => void;
  keyStates: Record<string, KeyState>;
  disabled?: boolean;
}

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK'],
];

export function Keyboard({ onKeyPress, onBackspace, onEnter, keyStates, disabled = false }: KeyboardProps) {
  const getKeyColor = (key: string) => {
    const state = keyStates[key.toLowerCase()];
    switch (state) {
      case 'correct':
        return 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600';
      case 'present':
        return 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600';
      case 'absent':
        return 'bg-slate-400 hover:bg-slate-500 text-white border-slate-500';
      default:
        return 'bg-white hover:bg-gray-50 text-gray-800 border-gray-300';
    }
  };

  const handleClick = (key: string) => {
    if (key === 'ENTER') {
      onEnter();
    } else if (key === 'BACK') {
      onBackspace();
    } else {
      onKeyPress(key);
    }
  };

  return (
    <div className="flex flex-col gap-1.5 max-w-lg mx-auto w-full px-1">
      {KEYBOARD_ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-1 justify-center">
          {row.map((key) => {
            const isSpecial = key === 'ENTER' || key === 'BACK';
            return (
              <Button
                key={key}
                onClick={() => handleClick(key)}
                disabled={disabled}
                className={`h-11 border ${
                  isSpecial ? 'px-2 min-w-[50px] text-[10px]' : 'w-8 p-0 text-xs'
                } ${getKeyColor(key)} rounded-lg shadow-sm transition-all duration-200 active:scale-95 hover:shadow-md ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                variant="secondary"
              >
                {key === 'BACK' ? (
                  <Delete className="w-3.5 h-3.5" />
                ) : (
                  <span className="uppercase font-semibold">{key}</span>
                )}
              </Button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

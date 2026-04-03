import { formatPYG, parsePYG } from '../lib/formatters';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number;
  onChange: (value: number) => void;
}

export const CurrencyInput = ({ value, onChange, ...props }: CurrencyInputProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const numericValue = parsePYG(rawValue);
    onChange(numericValue);
  };

  return (
    <input
      {...props}
      type="text"
      value={formatPYG(value)}
      onChange={handleChange}
    />
  );
};

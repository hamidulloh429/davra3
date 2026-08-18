import './PasswordStrength.css';

export default function PasswordStrength({ password = '' }) {
  if (!password) return null;

  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const labels = ['Juda zaif', 'Zaif', "O'rtacha", 'Kuchli', 'Juda kuchli'];
  const label = labels[Math.min(score, 4)];

  return (
    <div className="password-strength mt-2">
      <div className="strength-bars flex gap-1 mb-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`strength-segment score-${score >= level ? score : 0}`}
          />
        ))}
      </div>
      <span className={`strength-label score-text-${score}`}>
        {label}
      </span>
    </div>
  );
}

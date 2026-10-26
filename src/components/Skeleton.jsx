export function Skeleton({ className = "" }) {
  return (
    <span
      className={`block animate-pulse rounded-md bg-neutral-200 ${className}`}
    />
  );
}

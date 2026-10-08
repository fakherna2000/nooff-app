import { SVGProps } from 'react';

export function Tooth(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2C8.1 2 5 5.1 5 9c0 2.5 1 4.5 2 6 1.2 1.8 2 3.8 2.4 6.5.2 1.4 1.3 2.5 2.6 2.5h0c1.3 0 2.4-1.1 2.6-2.5.4-2.7 1.2-4.7 2.4-6.5 1-1.5 2-3.5 2-6 0-3.9-3.1-7-7-7z" />
    </svg>
  );
}

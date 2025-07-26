import type { SVGProps } from "react";

export const Icons = {
  logo: (props: SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M16 4c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zM6 6c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zM6 10h.01" />
      <path d="M18 10h.01" />
      <path d="M12 10h.01" />
      <path d="M12 14c-3.9 0-7 1.8-7 4v2h14v-2c0-2.2-3.1-4-7-4z" />
      <path d="M12 2a2.5 2.5 0 0 0-2.5 2.5V8" />
    </svg>
  ),
};

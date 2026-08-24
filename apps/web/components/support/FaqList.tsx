import type { FC, ReactNode } from 'react';

interface Section {
  title: string;
  body: ReactNode;
}

interface IProps {
  sections: Section[];
}

export const FaqList: FC<IProps> = ({ sections }) => (
  <ul className="space-y-8">
    {sections.map((s) => (
      <li key={s.title}>
        <h2 className="mb-2 font-display text-base font-semibold text-white">{s.title}</h2>
        <p className="font-body text-sm leading-relaxed text-white/55">{s.body}</p>
      </li>
    ))}
  </ul>
);

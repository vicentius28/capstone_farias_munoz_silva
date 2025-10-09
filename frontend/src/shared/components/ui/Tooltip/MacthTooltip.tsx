import React from "react";
import { Tooltip } from "@heroui/tooltip";

import { User } from "@/types/types";

interface MatchTooltipProps {
  user?: User; // 👈️ lo hacemos opcional
  searchTerm: string;
  children: React.ReactNode;
}

const getMatchedFields = (term: string, user?: User): string[] => {
  if (!user) return [];

  const t = term.toLowerCase();
  const matches: string[] = [];

  user.titulos?.forEach((titulo) => {
    if (titulo.titulo.toLowerCase().includes(t))
      matches.push(`Título: ${titulo.titulo}`);
  });

  user.magisters?.forEach((m) => {
    if (m.magister.toLowerCase().includes(t))
      matches.push(`Magíster: ${m.magister}`);
  });

  user.diplomados?.forEach((d) => {
    if (d.diplomado.toLowerCase().includes(t))
      matches.push(`Diplomado: ${d.diplomado}`);
  });

  return matches;
};

const MatchTooltip: React.FC<MatchTooltipProps> = ({
  user,
  searchTerm,
  children,
}) => {
  const matched = getMatchedFields(searchTerm, user);

  if (!user || searchTerm.trim().length === 0 || matched.length === 0)
    return <>{children}</>;

  return (
    <Tooltip
      className="z-[999]"
      content={
        <div className="max-h-40 overflow-y-auto text-sm p-2 space-y-1">
          {matched.map((item, index) => {
            const highlighted = item.replace(
              new RegExp(searchTerm, "gi"),
              (match) => `<mark class="bg-warning-300">${match}</mark>`,
            );

            return (
              <div
                dangerouslySetInnerHTML={{ __html: highlighted }}
                key={`${item}-${index}`}
                className="px-2 py-1 rounded bg-default-100"
              />
            );
          })}
        </div>
      }
      placement="bottom-end"
    >
      {children}
    </Tooltip>
  );
};

export default MatchTooltip;

// data/sections.ts
import { Section } from "@/types/sections";
import { buttons } from "@/data/buttons";

export const sections: Section[] = [
  {
    title: "PORTAL TRABAJADOR",
    icon: "🧑‍🏫",
    buttons: [
      buttons.evaluacionAuto,
    ],
  },
  {
    title: "EQUIPO DIRECTIVO",
    icon: "📋",
    buttons: [
      buttons.evaluarDesempeno,
      buttons.evaluacionMixta,
    ],
  },
  {
    title: "FUNDACIÓN",
    icon: "🏫",
    buttons: [buttons.usuarios], // Changed from buttons.usuariosFicha to buttons.usuarios
  },
  {
    title: "EVALUACIÓN DE DESEMPEÑO",
    icon: "📊",
    buttons: [buttons.plantillas, buttons.asignar],
    fullWidth: true,
  },
];

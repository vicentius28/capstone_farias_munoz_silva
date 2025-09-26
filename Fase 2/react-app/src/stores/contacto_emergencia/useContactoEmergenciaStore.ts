// ejemplo base del store
import { create } from "zustand";

interface Contacto {
  id: number;
  nombre: string;
  telefono: string;
  parentezco: string;
}

interface ContactoEmergenciaState {
  contactos: Contacto[];
  setContactos: (lista: Contacto[]) => void;
  addContacto: (c: Contacto) => void;
  updateContacto: (id: number, nuevo: Partial<Contacto>) => void;
  removeContacto: (id: number) => void;
}

const useContactoEmergenciaStore = create<ContactoEmergenciaState>((set) => ({
  contactos: [],
  setContactos: (lista) => set({ contactos: lista }),
  addContacto: (nuevo) =>
    set((state) => ({ contactos: [...state.contactos, nuevo] })),
  updateContacto: (id, nuevo) =>
    set((state) => ({
      contactos: state.contactos.map((c) =>
        c.id === id ? { ...c, ...nuevo } : c,
      ),
    })),
  removeContacto: (id) =>
    set((state) => ({
      contactos: state.contactos.filter((c) => c.id !== id),
    })),
}));

export default useContactoEmergenciaStore;

export interface Prestacion {
  id: string;
  codigo: string;
  nombre: string;
  duracionMinutos: number;
  precio?: number;
  activo: boolean;
}
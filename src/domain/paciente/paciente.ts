export interface Paciente {
  id: string;
  nombre: string;
  apellido: string;
  documento?: string;
  telefono?: string;
  email?: string;
  fechaNacimiento?: Date;
  notas?: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}
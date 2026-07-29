export interface PerfilDto {
  username: string;
  name: string | null;
  perfilId: number;
  perfilNome: string;
  isAdmin: boolean;
  permissoes: string;
}
